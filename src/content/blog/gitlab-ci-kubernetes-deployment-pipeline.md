---
title: "GitLab CI to Kubernetes: A Deployment Pipeline That Actually Rolls Back"
description: "GitLab CI Kubernetes deployment pipeline, built properly: Kaniko image builds, agent-based auth, Helm deploys with --atomic, and a manual production gate."
aiSummary: "A production GitLab CI to Kubernetes pipeline needs four things the naive kubectl-apply job lacks: images built once and pinned by commit SHA, cluster access through the GitLab Kubernetes Agent instead of stored kubeconfigs, Helm deploys with --atomic so a failed release rolls back automatically, and GitLab environments with a manual gate protecting production. This guide assembles the complete .gitlab-ci.yml, the agent configuration, per-environment values files, and every rollback path."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "DevOps & Kubernetes"
---

The first version of this pipeline is always the same: a deploy job with a kubeconfig stored as a CI variable, running `kubectl apply -f k8s/` and maybe a `kubectl set image`. It works — right up until the first bad deploy. Then its three structural problems show up at once:

- **No rollback.** `kubectl apply` is not a transaction. It updates resources one by one, and if the new pods never become ready, the ConfigMaps, Services, and Deployments it already changed stay changed. `kubectl rollout undo` covers exactly one Deployment — not the release.
- **No environment separation.** One job deploys everywhere, or the staging and production jobs are copy-pasted duplicates that drift apart until "it worked in staging" stops meaning anything.
- **Credential sprawl.** A long-lived, usually cluster-admin kubeconfig sits in the CI variables of every project that deploys. Anyone who can edit those variables owns the cluster, and rotating the credential means hunting it down project by project.

The pipeline below fixes all three: images are built once and pinned by commit SHA, the cluster is reached through the GitLab Kubernetes Agent instead of a stored kubeconfig, Helm performs the deploy with `--atomic` so a failed release rolls itself back, and production sits behind a manual gate on a protected environment.

## Build once, tag with the commit SHA

Build the image in the first stage, push it to the GitLab Container Registry, and deploy *that exact image* to every environment. The tag is the full commit SHA — never `latest`, never a branch name. A mutable tag makes two questions unanswerable: what is running in production right now, and what was running before it? With SHA tags, both answers are a `git log` lookup, and a rollback is just redeploying an older SHA.

The build uses Kaniko, which builds images without a privileged Docker daemon — the thing locked-down and shared runners typically refuse to provide:

```yaml
build:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.23.2-debug
    entrypoint: [""]
  script:
    - /kaniko/executor
        --context "$CI_PROJECT_DIR"
        --dockerfile "$CI_PROJECT_DIR/Dockerfile"
        --destination "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

`$CI_REGISTRY_IMAGE` and `$CI_COMMIT_SHA` are predefined GitLab variables, and the job's own token authenticates the push to the project's registry. No registry credentials to manage.

## Cluster access through the GitLab Agent

The GitLab Kubernetes Agent (`agentk`) runs inside the cluster and connects *outbound* to GitLab. CI jobs then reach the cluster through the agent, authenticated by the job's short-lived `CI_JOB_TOKEN` — there is no kubeconfig file to steal, leak, or rotate.

Register the agent in GitLab (Operate → Kubernetes clusters), install it into the cluster with its Helm chart and the token GitLab gives you, and commit its configuration to the repository. The configuration is what authorizes your project to use the agent for CI:

```yaml
# .gitlab/agents/prod-cluster/config.yaml
ci_access:
  projects:
    - id: my-group/api # your project's path
```

The directory name — `prod-cluster` here — is the agent's name, and it appears again in the pipeline. In a deploy job, selecting the agent is one command; GitLab makes a context available for every agent your project is authorized to use:

```bash
kubectl config get-contexts
kubectl config use-context "my-group/api:prod-cluster"
```

Compare this with the kubeconfig-in-a-variable approach: access is granted and revoked in the agent configuration and project membership, the credential behind each job expires with the job, and one agent serves every project you list — instead of one copied secret per project.

One cluster-side detail: the pods still need to pull the image. Create a registry pull secret once per namespace from a GitLab deploy token with read-only registry access, and reference it in the chart values (it appears in the values files below):

```bash
kubectl create secret docker-registry gitlab-registry \
  --namespace api-production \
  --docker-server registry.example.com \
  --docker-username deploy-token-user \
  --docker-password <deploy-token>
```

## The full pipeline

Everything together. Four stages; the deploy jobs share one template and differ only in namespace, values file, and the production gate:

```yaml
stages:
  - build
  - test
  - deploy-staging
  - deploy-production

variables:
  HELM_RELEASE: "api"
  CHART_PATH: "./chart"
  AGENT_NAME: "prod-cluster"

build:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.23.2-debug
    entrypoint: [""]
  script:
    - /kaniko/executor
        --context "$CI_PROJECT_DIR"
        --dockerfile "$CI_PROJECT_DIR/Dockerfile"
        --destination "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
  rules:
    - if: $CI_COMMIT_BRANCH

test:
  stage: test
  image: node:22-alpine # replace with your stack's image and test command
  script:
    - npm ci
    - npm test
  rules:
    - if: $CI_COMMIT_BRANCH

.deploy:
  image: alpine/helm:3.16.2 # ships helm and kubectl
  resource_group: "$HELM_RELEASE-$KUBE_NAMESPACE" # serialize deploys per release
  before_script:
    - kubectl config use-context "$CI_PROJECT_PATH:$AGENT_NAME"
  script:
    - helm upgrade --install "$HELM_RELEASE" "$CHART_PATH"
        --namespace "$KUBE_NAMESPACE"
        --create-namespace
        --values "$VALUES_FILE"
        --set image.repository="$CI_REGISTRY_IMAGE"
        --set image.tag="$CI_COMMIT_SHA"
        --atomic
        --wait
        --timeout 5m
        --history-max 10

deploy-staging:
  extends: .deploy
  stage: deploy-staging
  variables:
    KUBE_NAMESPACE: "api-staging"
    VALUES_FILE: "./chart/values-staging.yaml"
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy-production:
  extends: .deploy
  stage: deploy-production
  variables:
    KUBE_NAMESPACE: "api-production"
    VALUES_FILE: "./chart/values-production.yaml"
  environment:
    name: production
    url: https://example.com
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
```

Environment differences live in the values files, not in duplicated jobs:

```yaml
# chart/values-staging.yaml
replicaCount: 1
imagePullSecrets:
  - name: gitlab-registry
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
autoscaling:
  enabled: false
```

```yaml
# chart/values-production.yaml
replicaCount: 3
imagePullSecrets:
  - name: gitlab-registry
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    cpu: "1"
    memory: "1Gi"
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## What the Helm flags buy you

The deploy is one `helm upgrade` command, and the flags are the rollback strategy:

- `--install` — install on first run, upgrade afterwards. One job works for both.
- `--wait` — the command does not succeed until every pod is ready and every service has endpoints. Without it, the pipeline goes green while the rollout is still failing.
- `--timeout 5m` — how long `--wait` waits before declaring failure. Match it to your slowest legitimate startup (image pulls, migrations, warm-up), not to hope.
- `--atomic` — if the upgrade fails, Helm automatically rolls the release back to the previous revision: chart, values, and image tag together. This is the property `kubectl apply` does not have.
- `--history-max 10` — keeps the last ten revisions as rollback targets without letting release history grow forever.

`--wait` is only as honest as your probes. A pod with no readiness probe counts as ready the moment it starts, so a crash-looping release "succeeds" and `--atomic` never fires. Probes are what make the wait — and therefore the rollback — real:

```yaml
# chart/values.yaml (defaults, overridden per environment)
readinessProbe:
  httpGet:
    path: /healthz
    port: http
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 6
livenessProbe:
  httpGet:
    path: /healthz
    port: http
  initialDelaySeconds: 15
  periodSeconds: 20
```

Give the application a real health endpoint — one that fails when the process is up but cannot serve (database unreachable, migrations pending). A probe that always returns 200 is decoration.

## Rolling back

Three levels, fastest first:

**Automatic.** The deploy itself fails: pods never become ready inside the timeout, `--atomic` rolls the release back, and the pipeline goes red with the previous version still serving. Nobody has to be awake for this one.

**Manual, by revision.** The deploy succeeded but the release is bad in a way probes cannot see — a wrong feature flag, a broken integration. Helm kept the history:

```bash
helm history api --namespace api-production
helm rollback api 14 --namespace api-production --wait
```

**By commit.** Because every image is tagged with its SHA and every pipeline belongs to a commit, you can also redeploy any earlier version exactly as it shipped: open that commit's pipeline in GitLab and run its deploy job. This is also how the manual production gate stays safe — clicking "play" hours later still deploys the SHA the pipeline was created for, not whatever the branch has moved on to.

## Environments and the production gate

The `environment:` keyword registers each deploy with GitLab: under Operate → Environments you get a deployment history per environment, the commit each environment is running, and one-click redeploys. The keyword alone does not protect anything — protection is a separate, deliberate step:

- **Protect the production environment** (Settings → CI/CD → Protected environments) so only Maintainers can run the deploy job. Staging stays open to the whole team.
- **Protect the default branch.** Both deploy jobs only run on it, so nothing reaches a cluster without a merge — and a review.
- **The manual gate.** `when: manual` on the production rule means merging deploys staging automatically and then stops. A human looks at staging and starts production. The gate is a rule on the job, not a separate approval tool to integrate.
- **Serialized deploys.** The `resource_group` on the deploy template stops two pipelines from upgrading the same release at the same time — the usual cause of releases stuck in `pending-upgrade`.

## Push from CI, or pull with GitOps?

This pipeline is push-based: CI reaches into the cluster and applies the release. The alternative is pull-based GitOps, where an in-cluster controller such as ArgoCD watches a Git repository and reconciles the cluster to it — CI's job ends at building the image and committing the new tag.

Neither is universally right. Push is simpler to set up and easier to reason about, and for a small number of services it stays that way. Pull adds drift detection and self-healing — changes made by hand in the cluster get reverted — at the cost of running and understanding another control plane. Our [Kubernetes GitOps guide with ArgoCD](/blog/kubernetes-argocd-gitops-guide/) walks through the pull model end to end. If you adopt it, note that its failures look different from pipeline failures: syncs break at render, RBAC, and reconciliation time, which is why we keep a separate field guide to [ArgoCD sync failures and their fixes](/blog/argocd-sync-failed-common-causes/).

## Common mistakes

- **Mutable image tags.** Deploying `latest` or a branch name makes rollbacks guesswork and "what is running?" unanswerable. Pin the commit SHA; treat tags as immutable.
- **No resource requests.** HPA utilization is a percentage *of requests*. Without requests, the HPA reports `<unknown>/70%` and never scales — and the scheduler is placing pods blind. The production values above set requests for this reason.
- **Secrets in plain CI variables or values files.** `values-production.yaml` is committed to Git; a password in it is published to everyone with repo access. CI variables must be masked and protected at minimum, and the better home for runtime secrets is in-cluster management (External Secrets, Sealed Secrets) that the pipeline never sees. Never echo a secret in a job log, masked or not.
- **A cluster-admin kubeconfig as a CI variable.** The sprawl this guide started with. If a stored credential can administer the cluster, every project holding it is a cluster-admin project.
- **Probes that lie.** An always-200 health endpoint defeats `--wait` and `--atomic`. If the app cannot serve, the probe must fail.
- **Deploying feature branches to shared namespaces.** Two branches racing one staging release produce failures neither branch caused. Preview environments need their own namespaces and releases, or they should not deploy at all.

## FAQ

### Does `--atomic` make deployments zero-downtime?

No. `--atomic` decides what happens when an upgrade *fails*: the release rolls back instead of sitting half-applied. Availability during a normal rollout comes from running more than one replica, honest readiness probes, and PodDisruptionBudgets. With `replicaCount: 1`, there is a gap during every deploy no matter which flags you set.

### Kaniko or Docker-in-Docker for the build step?

Kaniko builds images with no Docker daemon and no privileged mode, which is why it works on locked-down runners where Docker-in-Docker is refused. If your runners are self-managed and already privileged, DinD works too — but the SHA-tagging and build-once rules matter more than the builder. Do not let the deploy stages rebuild the image; they must deploy the artifact the build stage produced.

### A release is stuck in `pending-upgrade`. What now?

An interrupted deploy — the job was cancelled or the runner died mid-upgrade — leaves the release marked pending, and further upgrades refuse to start. Check `helm history`, then roll back to the last revision with status `deployed`: `helm rollback api <revision> --namespace api-production`. Prevent it with the `resource_group` serialization above and by not cancelling deploy jobs casually.

### Can I keep this pipeline and still use ArgoCD?

Yes — split the jobs at the build. CI builds and pushes the SHA-tagged image, then commits the new tag to the GitOps repository; ArgoCD reconciles the cluster from there and the Helm deploy jobs go away. You keep immutable tags and the manual promotion discipline (the tag commit to the production folder is the gate), and ArgoCD adds drift correction on top.

## When every deploy is a small incident

A pipeline that cannot roll back turns each merge into a risk decision, and teams respond the way teams do: they deploy less, in bigger batches, which makes each deploy riskier. The fix is mechanical — immutable images, a real health signal, Helm's transactional releases, and a gate before production. Our [Kubernetes & DevOps service](/services/kubernetes-devops/) covers exactly this work: pipeline builds and reviews, Helm chart structure, and cluster access done without stored credentials. If your deploys are manual, fragile, or feared, [contact us](/contact/) with your current `.gitlab-ci.yml`, and we will point at the stage that breaks first before any work is scoped.
