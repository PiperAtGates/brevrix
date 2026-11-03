---
title: "Kubernetes GitOps with ArgoCD: Zero-Downtime Guide | Brevrix"
description: "Learn how to deploy zero-downtime GitOps pipelines on Kubernetes with ArgoCD, automated sync policies, Trivy security scanning, and blue/green rollouts."
aiSummary: "To achieve zero-downtime Kubernetes deployments using ArgoCD, declare cluster state in Git, configure ArgoCD Application CRDs with automated sync (prune and selfHeal enabled), enforce Trivy container image scanning in CI before tag promotion, and configure rollingUpdate with readinessProbes to prevent traffic drops."
pubDate: 2026-11-02
updatedDate: 2026-11-04
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "DevOps & Kubernetes"
---

Deploying microservices to Kubernetes should not feel like gambling on a roulette wheel. In fast-moving development teams, the traditional "push-based" CI/CD pipeline—where a continuous integration runner like GitLab CI or Jenkins executes `kubectl apply` directly against the cluster—inevitably leads to configuration drift, orphaned resources, and critical production outages.

**GitOps** flips this dynamic entirely. Instead of pushing changes from outside the cluster, an in-cluster controller (ArgoCD) continuously monitors your Git repository as the **single source of truth** and pulls the desired state into your cluster.

In this comprehensive production guide, we will walk through the exact architecture, YAML manifests, security hardening, and error troubleshooting we implement at [Brevrix](/services) for high-availability Kubernetes environments.

---

## 1. Why Traditional Push-Based CI/CD Fails in Production

In a classic push-based pipeline, your CI runner requires broad cluster-admin credentials stored inside your CI provider (GitLab, GitHub, or Jenkins). If your runner environment is breached, your entire cluster control plane is exposed.

Furthermore, traditional pipelines suffer from three architectural flaws:

1. **Configuration Drift:** When an on-call engineer runs `kubectl edit` or hotfixes a pod during an incident, that change never makes it back into Git. Subsequent pipeline runs either overwrite the fix or break completely.
2. **Missing Rollback Fidelity:** Rolling back a botched push deployment often requires re-running historical CI pipelines, waiting for container images to re-build, and hoping transitive dependencies haven't changed.
3. **Audit Blindspots:** Compliance standards (SOC2, ISO 27001) demand clear audit logs of who changed which environment variable, replica count, or secret. In push deployments, tracking drift requires scraping thousands of lines of CI console logs.

With GitOps, every change is a Git commit. A `git revert` instantly rolls back your cluster to a known good state in seconds.

---

## 2. Complete GitOps Architecture Overview

The recommended production pattern separates your **Application Source Code** from your **Kubernetes Configuration (Config Repo)**:

```
[ Developer Commit ] 
       │
       ▼
┌────────────────────────┐
│ App Code Repo (GitLab) │
└──────────┬─────────────┘
           │ (CI Pipeline)
           ├─ 1. Unit & Integration Tests
           ├─ 2. Build Docker Container
           ├─ 3. Trivy Container Vulnerability Scan
           └─ 4. Push Image to Harbor / OCI Registry
           │
           ▼
┌───────────────────────────┐
│ Update Image Tag via PR   │
└──────────┬────────────────┘
           │
           ▼
┌───────────────────────────┐
│ K8s Manifest Repo (GitOps)│ ◄─────┐
└──────────┬────────────────┘       │
           │                        │ Watches Git every 3m
           │                        │ or via Webhook
           ▼                        │
┌───────────────────────────────────────┴──┐
│ ArgoCD Controller (Inside K8s Cluster)   │
└──────────┬───────────────────────────────┘
           │ Reconciles Drift (selfHeal: true)
           ▼
┌──────────────────────────────────────────┐
│ Production Workloads (Pods, Services)   │
└──────────────────────────────────────────┘
```

---

## 3. Step 1: Pre-Deployment Security Scanning with Trivy

Before allowing any image tag to enter your GitOps repository, enforce container security scanning in your CI pipeline. If high or critical vulnerabilities exist, the pipeline must fail before updating the deployment manifest.

Here is an enterprise-grade **GitLab CI** stage using Aqua Security's **Trivy**:

```yaml
# .gitlab-ci.yml - Container Build & Vulnerability Gate
stages:
  - build
  - security-scan
  - gitops-promote

build_container:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  script:
    - docker build -t registry.brevrix.com/production/core-api:${CI_COMMIT_SHORT_SHA} .
    - docker push registry.brevrix.com/production/core-api:${CI_COMMIT_SHORT_SHA}

trivy_security_gate:
  stage: security-scan
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    # Scan for High and Critical CVEs; fail exit code 1 if found
    - trivy image --exit-code 1 --severity HIGH,CRITICAL --no-progress registry.brevrix.com/production/core-api:${CI_COMMIT_SHORT_SHA}
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

promote_to_gitops:
  stage: gitops-promote
  needs: ["trivy_security_gate"]
  image: alpine/git:latest
  script:
    - git config user.name "GitOps Bot"
    - git config user.email "bot@brevrix.com"
    - git clone https://oauth2:${GITOPS_TOKEN}@gitlab.brevrix.com/infra/k8s-manifests.git
    - cd k8s-manifests/overlays/production
    - sed -i "s|newTag:.*|newTag: ${CI_COMMIT_SHORT_SHA}|g" kustomization.yaml
    - git commit -am "chore(deploy): bump core-api to ${CI_COMMIT_SHORT_SHA} [skip ci]"
    - git push origin main
```

---

## 4. Step 2: The Production ArgoCD Application CRD

In GitOps, you define your applications declaratively as Custom Resource Definitions (CRDs). Here is the complete production manifest for a zero-downtime ArgoCD Application:

```yaml
# argocd-production-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: core-api-production
  namespace: argocd
  finalizers:
    # Ensures cascading deletion of Kubernetes resources if the App is deleted
    - resources-finalizer.argocd.argoproj.io
  labels:
    environment: production
    managed-by: brevrix-devops
spec:
  project: default
  source:
    repoURL: 'https://github.com/PiperAtGates/brevrix-infrastructure.git'
    targetRevision: main
    path: overlays/production
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: production
  syncPolicy:
    automated:
      prune: true       # Automatically deletes resources removed from Git
      selfHeal: true    # Reverts manual 'kubectl' edits within seconds
      allowEmpty: false # Prevents wiping the namespace if repo is empty
    syncOptions:
      - CreateNamespace=true
      - PruneLast=true              # Prunes resources after new ones are healthy
      - ApplyOutOfSyncOnly=true     # Only touches resources that have drifted
      - RespectIgnoreDifferences=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Critical Sync Policy Options Explained:
* **`selfHeal: true`**: If an engineer logs into the cluster and manually deletes a pod or modifies a ConfigMap, ArgoCD detects the discrepancy within its reconciliation loop and reverts the cluster back to the Git state.
* **`prune: true`**: When you delete a Kubernetes manifest file in Git, ArgoCD automatically destroys the orphaned resource in the cluster.
* **`ApplyOutOfSyncOnly=true`**: Prevents generating wasteful Kubernetes API load by applying updates only to manifests whose live state does not match the desired Git state.

---

## 5. Step 3: Zero-Downtime Deployment & Probes Manifest

ArgoCD cannot deliver zero downtime alone if your underlying Kubernetes workload drops connections during container restarts. You must pair ArgoCD with proper rolling update strategies and lifecycle probes:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-api
  namespace: production
  labels:
    app.kubernetes.io/name: core-api
spec:
  replicas: 4
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%         # Spins up 1 new pod before killing any old pods
      maxUnavailable: 0     # ZERO dropped traffic guarantee during deploys
  selector:
    matchLabels:
      app.kubernetes.io/name: core-api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: core-api
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: core-api
          image: registry.brevrix.com/production/core-api:v2.4.1
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          # Liveness Probe: Restarts deadlocked containers
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
            failureThreshold: 3
          # Readiness Probe: Only routes Ingress traffic when warm
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            successThreshold: 1
            failureThreshold: 2
          lifecycle:
            preStop:
              exec:
                # Sleep gives existing ingress connections time to drain gracefully
                command: ["/bin/sh", "-c", "sleep 10"]
```

---

## 6. Real-World Troubleshooting: Fixing 4 Common ArgoCD Sync Failures

In production, you will encounter sync errors. Here is how to diagnose and resolve the most common issues:

### 1. `OutOfSync` Infinite Loop Caused by Mutating Webhooks
* **Symptom:** ArgoCD stays permanently yellow (`OutOfSync`), syncing repeatedly every 3 minutes even though no commits occurred.
* **Root Cause:** A mutating webhook (such as an Istio sidecar injector, Kyverno policy, or HashiCorp Vault agent) modifies the pod spec on creation. ArgoCD compares the live spec with Git, sees the injected sidecar or annotation, and attempts to wipe it.
* **Fix:** Tell ArgoCD to ignore the specific mutated field via `ignoreDifferences`:

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/template/metadata/annotations/sidecar.istio.io~1status
```

### 2. `ComparisonError: unknown field in spec`
* **Symptom:** ArgoCD throws a `ComparisonError` immediately upon reading the Git repository.
* **Root Cause:** Your Kubernetes manifest uses an API version or field not supported by the cluster's API server (e.g. using `networking.k8s.io/v1beta1` on Kubernetes 1.25+).
* **Fix:** Run `kubectl explain <resource>` on your target cluster or upgrade your Kustomize/Helm templates to align with the current Kubernetes minor release.

### 3. `FailedSync: dry-run failed: admission webhook denied the request`
* **Symptom:** Sync fails during the server-side dry-run evaluation.
* **Root Cause:** A Kubernetes ValidatingWebhookConfiguration (like an OPA Gatekeeper constraint or cert-manager admission controller) rejected the resource for violating cluster policies (e.g., missing resource limits or running as root).
* **Fix:** Review the admission webhook event logs:
```bash
kubectl get events -n production --sort-by='.metadata.creationTimestamp'
```
Adjust the resource definition in Git to fulfill your cluster's security policy.

### 4. ArgoCD Repository Webhook Certificate Expired
* **Symptom:** Changes pushed to Git take up to 3 minutes to reflect in ArgoCD because webhook delivery fails.
* **Root Cause:** The TLS certificate on your ArgoCD server or your self-hosted Git server has expired, causing the GitHub/GitLab webhook HTTP request to fail silently.
* **Fix:** Verify webhook health in your Git repository's Webhook settings and check cert-manager status:
```bash
kubectl describe certificate argocd-server-tls -n argocd
```

---

## 7. Frequently Asked Questions (FAQ)

### What is the difference between ArgoCD and Flux?
Both are CNCF graduated GitOps engines. ArgoCD provides a full web UI, granular RBAC, SSO integration, and visual cluster synchronization trees. Flux is a collection of decoupled, lightweight Kubernetes controllers managed purely via CLI and CRDs. For small teams requiring visual observability, ArgoCD is overwhelmingly preferred.

### How do you handle database migrations in a GitOps workflow?
Never run schema migrations inside your primary web container's entrypoint script. Instead, execute schema migrations as a Kubernetes `Job` orchestrated through an **ArgoCD PreSync Hook**:
```yaml
metadata:
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
```
This guarantees that the database migration completes successfully before ArgoCD begins rolling out the new application pods.

### How do you keep Kubernetes secrets safe in a public Git repository?
Never commit unencrypted secrets to Git. We recommend either:
1. **Sealed Secrets (Bitnami):** Public-key encryption where only your Kubernetes cluster can decrypt the secret.
2. **External Secrets Operator (ESO):** Synchronizes secrets directly from AWS Secrets Manager, HashiCorp Vault, or Google Secret Manager into standard Kubernetes secrets.

---

## 8. Summary & Next Steps

Adopting GitOps with ArgoCD transforms Kubernetes deployment from a stressful manual chore into an automated, verifiable, and audit-compliant operational workflow.

### Key Rules for Production:
1. **Strict separation:** Keep application source code and deployment manifests in separate Git repositories.
2. **Security gates:** Run container vulnerability scanners (like Trivy) in CI before committing updated image tags to Git.
3. **Graceful shutdowns:** Always configure `readinessProbe` and `preStop` sleep commands in your Deployment specs to guarantee zero dropped packets during rolling updates.
4. **Automate drift correction:** Keep `selfHeal: true` and `prune: true` enabled in your ArgoCD Application CRDs.

---

### Need Help Setting Up Production Kubernetes or GitOps?

At **Brevrix**, we architect, harden, and manage enterprise Linux and Kubernetes clusters for growing businesses. 

* Explore our [Kubernetes & DevOps Services](/services#cloud-devops) for full-scope sprint packages.
* Book our [$249 Server & Speed Audit](/pricing) for a thorough 72-hour review of your existing infrastructure.
* Or [contact our engineering team](/contact) to discuss your cloud roadmap directly.
