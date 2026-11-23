---
title: "ArgoCD Sync Failed: 7 Common Causes and How to Fix Each One"
description: "ArgoCD sync failed? Work through 7 common causes — invalid manifests, RBAC errors, immutable fields, failing hooks, missing CRDs, repo errors, selfHeal loops."
aiSummary: "Most ArgoCD sync failures fall into seven categories: invalid manifests or Helm template errors, RBAC or missing-namespace errors, immutable field changes, failing hooks or sync waves, missing CRDs, repo-server connectivity or credential errors, and selfHeal/prune fighting other controllers such as an HPA. Start with `argocd app get <app>` and the operation message, match the error text to the cause, and fix it in Git rather than in the cluster."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "DevOps & Kubernetes"
---

Your Git commit landed, ArgoCD picked it up, and the application went red: **Sync Failed**. That is not one error — it is the final state of an operation that can break during manifest generation, the dry run, the apply, or while waiting for hooks and health checks. The fix for one stage does nothing for another.

This guide works through the seven causes we check first, in sync order. Setting up GitOps from scratch instead? Start with our [Kubernetes GitOps guide with ArgoCD](/blog/kubernetes-argocd-gitops-guide/), and return here at the first red sync.

## First: read the failure properly

Do not re-run the sync first. Read the operation result — ArgoCD records which resource failed and why.

In the UI, expand the failed resource in the **Operation State** panel. Note two separate fields: **Sync Status** (Unknown, OutOfSync, Synced) — whether live state matches Git; and **Health Status** (Healthy, Progressing, Degraded, Missing) — whether the workload itself is running. An app can be Synced and Degraded (apply worked, app broken), or OutOfSync and Healthy (old version fine, new one will not apply). The fixes differ completely.

```bash
argocd app get my-app
kubectl describe application my-app -n argocd
argocd app resources my-app
```

Look for the `message:` field under the operation state. `ComparisonError`, `FailedSync`, or an API error like `field is immutable` points at one of the seven causes below. If a previous operation is stuck in `Running`, clear it with `argocd app terminate-op my-app`.

## 1. Invalid manifests or Helm template errors

**Symptom.** The application sits in `Unknown` sync status with a `ComparisonError`, and the sync never really starts. Typical messages:

```text
ComparisonError: Manifest generation error (cached):
template: my-chart/templates/deployment.yaml:14:6: executing "my-chart/templates/deployment.yaml"
at <.Values.replicaCount>: nil pointer evaluating interface {}.replicaCount
```

Plain YAML mistakes produce the plainer version: `error converting YAML to JSON: yaml: line 23: mapping values are not allowed in this context`. Kustomize builds fail the same way on a missing base or patch target.

**Why it happens.** The repo server renders your manifests (Helm template, Kustomize build, or plain YAML) before anything is applied. If rendering fails, there is nothing to sync: a renamed values key, a missing value in one environment's `values.yaml`, or a syntax error stops the pipeline here.

**Diagnose and fix.** Reproduce the render locally:

```bash
helm lint ./chart
helm template my-app ./chart -f values-production.yaml
kustomize build overlays/production
```

Fix the template or values in Git — above, the production values file is missing the key the template expects (`replicaCount: 3`). Then validate in CI (`helm lint`, `helm template`, `kubeconform`) so a broken render fails the pull request, not the production sync.

## 2. RBAC and permission errors — including the missing namespace

**Symptom.** The sync starts, then resources fail one by one:

```text
FailedSync: failed to apply object: namespaces "production" not found
deployments.apps is forbidden: User "system:serviceaccount:argocd:argocd-application-controller"
cannot create resource "deployments" in API group "apps" in the namespace "production"
```

A close relative appears before the sync: `resource ... is not permitted in project` or `destination ... is not permitted` — an ArgoCD AppProject restriction, not Kubernetes RBAC.

**Why it happens.** Three permission layers are involved: the controller's service account must be allowed to create the resources; the destination namespace must exist unless ArgoCD creates it; and the AppProject must allow that destination and resource type.

**Diagnose.**

```bash
argocd proj get default
kubectl auth can-i create deployments --namespace production \
  --as system:serviceaccount:argocd:argocd-application-controller
kubectl get namespace production
```

**Fix.** For the missing namespace — the most common first-deploy failure — let ArgoCD create it:

```yaml
spec:
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

`CreateNamespace=true` only helps if the controller's RBAC also allows creating namespaces; on a restricted cluster, an admin may need to provision the namespace and a RoleBinding once. For project errors, add the destination or resource to the AppProject's `destinations` / `clusterResourceWhitelist` instead of moving the app into an unrestricted project. For genuine RBAC errors, extend the ClusterRole bound to the ArgoCD service account — do not work around it with manual `kubectl apply`; the next sync hits the same wall.

## 3. Immutable field changes

**Symptom.** One resource refuses to apply while everything around it syncs:

```text
FailedSync: failed to apply object: Service "api" is invalid:
spec.clusterIP: Invalid value: "": field is immutable
```

Same pattern: `spec.selector ... field is immutable` on a Deployment whose labels changed, and Jobs, where `spec.template` is immutable once run.

**Why it happens.** Kubernetes forbids changing certain fields on an existing object, so a normal apply — what ArgoCD does — can never make that change. The resource must be deleted and recreated, and ArgoCD will not do that unprompted.

**Diagnose.** `argocd app diff my-app` shows the exact field that changed.

**Fix.** Mark that one resource for replacement, in Git, on the resource itself:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-options: Replace=true
```

Then sync again. `Replace=true` deletes and recreates the object, so expect a brief interruption — a recreated Service can receive a new cluster IP. Scope it to that one resource, never application-wide, and remove it in a follow-up commit once the sync is green. For a stuck Job, deleting it manually is usually cleaner: `kubectl delete job db-migrate -n production`, then `argocd app sync my-app`.

Long-term, avoid the immutable change: do not set `spec.clusterIP` in Git for Services (let Kubernetes allocate it), and treat Deployment selectors as permanent once shipped.

## 4. Hooks and sync waves blocking the sync

**Symptom.** The sync hangs partway, or fails with a hook in the resource list:

```text
Job/db-migrate  SyncFailed  hook failed: backoff limit reached
```

The application stays in `Progressing` while later resources never apply: later waves wait for earlier waves and hooks to succeed.

**Why it happens.** PreSync hooks (database migrations are the classic case) run before the main resources. If the hook Job fails — bad image, missing secret, wrong credentials — the sync correctly refuses to continue. Sync waves have the same effect: a wave `0` resource that never becomes healthy blocks waves `1`, `2`, and everything after. A subtler variant: a hook from a previous sync was never deleted, and the new hook cannot start cleanly.

**Diagnose.**

```bash
kubectl get jobs -n production
kubectl logs job/db-migrate -n production
argocd app resources my-app
```

**Fix.** Fix the hook first — the log almost always says why it failed. Then make hooks re-runnable with a delete policy, so a stale hook is cleaned up before the next attempt:

```yaml
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation,HookSucceeded
    argocd.argoproj.io/sync-wave: "-1"
spec:
  backoffLimit: 2
```

Use low waves for things everything else depends on (the migration, at wave `-1`, runs before the wave `0` defaults), and keep wave counts small. If an early-wave resource is slow to become healthy — a StatefulSet with a long warm-up — move resources that do not depend on it into the same wave.

## 5. The CRD does not exist yet

**Symptom.**

```text
ComparisonError: failed to load openapi schema: the server could not find the requested resource
ensure CRDs are applied first: no matches for kind "Certificate" in version "cert-manager.io/v1"
```

**Why it happens.** A custom resource (a cert-manager `Certificate`, a Prometheus `ServiceMonitor`) can only be applied after its CustomResourceDefinition is registered in the cluster's API. If the CRD lives in a different repo, Application, or an uninstalled chart, the sync has nowhere to put the resource. The dry run fails the same way: the API server cannot validate a kind it does not know.

**Diagnose.** Run `kubectl get crd | grep cert-manager` and `kubectl api-resources | grep -i certificate`. If the CRD is absent, no amount of re-syncing the dependent app will help.

**Fix.** Install the CRDs first, as their own step: a separate ArgoCD Application for the operator or CRD bundle, Synced and Healthy before dependent applications enable automated sync. Within one Application, ArgoCD applies CRDs before other resources in the same sync, so bundling a small CRD with its first consumer also works.

Where CRD and resource must land in the same first sync and the dry run is the only blocker, skip the dry run for it:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-options: SkipDryRunOnMissingResource=true
```

Treat that as a bootstrap tool, not a default: it removes a useful validation step for later syncs.

## 6. The repo server cannot reach Git or the Helm repository

**Symptom.** The application shows `ComparisonError` and never gets to comparing resources:

```text
Failed to fetch default: `helm repo add ...` failed: ... x509: certificate signed by unknown authority
```

Other common texts: `authentication required`, `repository not found`, `i/o timeout`, and `chart "my-chart" not found in ... repository`.

**Why it happens.** The repo server, not the application controller, talks to Git and Helm chart repositories. Expired credentials, a revoked token, a private CA the repo server does not trust, a renamed default branch, or blocked egress all surface here — and look like application failures even though the application is fine.

**Diagnose.**

```bash
argocd repo list
kubectl logs -n argocd deployment/argocd-repo-server --tail=200
argocd app get my-app --refresh
```

**Fix**, by layer:

- **Credentials:** repository credentials are Secrets in the `argocd` namespace labelled `argocd.argoproj.io/secret-type: repository`. Rotate the token or key there (or re-add the repo: `argocd repo add https://github.com/org/gitops.git --username git --password <token>`). Prefer a dedicated read-only deploy key per repo.
- **TLS:** for a self-hosted Git server with an internal CA, add the CA with `argocd cert add-tls git.example.com --from <ca.crt>`. Use `--insecure-skip-server-verification` only to confirm the diagnosis.
- **Helm repositories:** re-add the repo (`argocd repo add https://charts.example.com --type helm --name example`) and check the chart name and version exist in its index. OCI registries differ — an OCI chart is referenced as a Helm source with the registry URL, not browsed like an index.
- **Timeouts on huge repos:** narrow each Application's `path` to the directory it needs before raising timeouts blindly.

## 7. selfHeal and prune fighting other controllers

**Symptom.** The application flips between `Synced` and `OutOfSync` every few minutes without any new commits, and `argocd app diff` keeps showing the same difference — most often `spec.replicas`. Or the opposite: resources someone created keep disappearing.

**Why it happens.** With `automated.selfHeal: true`, ArgoCD reverts any live change that is not in Git. That is the point of GitOps — but other actors change live state legitimately. A HorizontalPodAutoscaler changes `spec.replicas` based on load; if Git also pins `replicas: 3`, selfHeal and the HPA fight forever, each undoing the other. Manual `kubectl edit` hotfixes are reverted for the same reason — by design, not by bug. Prune is the mirror image: it deletes resources removed from Git, and will also try to remove resources another operator created and expects to own.

**Diagnose.**

```bash
argocd app diff my-app
kubectl get hpa -n production
```

**Fix.** Decide, per field, who owns it — and write that into the Application. If an HPA owns replica count, remove `replicas` from Git and tell ArgoCD to ignore the field:

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      name: api
      namespace: production
      jsonPointers:
        - /spec/replicas
```

For resources an operator or another process creates inside your application's scope, protect them from pruning individually:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-options: Prune=false
```

Set expectations: with selfHeal on, a `kubectl edit` is a temporary diagnostic, not a fix — the fix goes in Git, or selfHeal erases it within one reconciliation interval. For a break-glass change, disable automated sync first, then put the change into Git before re-enabling.

## Prevention checklist

Most sync failures are cheaper in CI than in production:

- **Validate in CI:** `helm lint` + `helm template`, `kustomize build`, and a schema validator (`kubeconform`) on every GitOps pull request.
- **Dry run in staging:** keep a staging Application on the same repo, one promotion step ahead of production, with automated sync on. Keep CRDs and operators in their own Applications, healthy before dependent apps.
- **Pin chart and image versions.** Floating tags make "nothing changed in Git" untrue.
- **Alert on sync state, not just pod health:** ArgoCD Notifications for `SyncFailed` and `ComparisonError`.
- **Keep automated sync boring:** `prune` and `selfHeal` on, `ApplyOutOfSyncOnly=true` for large applications, and an explicit `ignoreDifferences` list for fields another controller owns.
- **Review the dangerous operations:** Replace annotations and prune exceptions belong in code review, not an incident.

## FAQ

### What is the difference between OutOfSync, Sync Failed, and Degraded?

**OutOfSync** is a sync status: live state differs from Git. **Sync Failed** means the last sync operation itself errored — apply rejected, hook failed, manifests would not render. **Degraded** is a health status: resources applied, but the workload is not running properly. Fix them in that order.

### Will `argocd app sync --prune` delete resources I created manually?

Prune deletes resources ArgoCD tracks as part of the application that no longer exist in Git. A hand-created resource in the same namespace is not automatically part of the application — but if ArgoCD has taken ownership of it through its tracking, it can be pruned. Protect anything that must survive with the `Prune=false` sync option (cause 7), and check the sync preview first.

### A sync operation is stuck and new syncs will not start. What do I do?

Terminate the stuck operation (`argocd app terminate-op my-app`), then read the recorded failure with `argocd app get my-app` before retrying — retrying blind just reproduces the same failure. If operations stick repeatedly at the same resource, it is almost always one of the seven causes above — usually a hook that never completes or an unhealthy early-wave resource.

### Should I fix a failed sync with kubectl directly in the cluster?

Almost never as the final fix. With selfHeal enabled, ArgoCD reverts manual changes not in Git; without it, you have still created drift the next sync must resolve. Use `kubectl` to diagnose and to unblock in the narrow cases above (deleting a stuck Job). The actual change goes in Git.

## When the sync failures keep coming back

One failed sync is an error message. The same failure every week is an architecture problem: no CI validation, CRDs tangled into application repos, or sync policies nobody has reviewed since the first install. Our [Kubernetes & DevOps service](/services/kubernetes-devops/) covers GitOps setup and review — manifest pipelines, ArgoCD configuration, guardrails. If your team spends more time reconciling ArgoCD than shipping through it, [contact us](/contact/) with the `argocd app get` output for the failing application, and we will identify which cause you have before any work is scoped.
