# 📚 Study

- [Github Actions](#github-actions)
- [Docker](#docker)
- [Podman](#podman)
- [Local Cluster](#local-cluster)
- [ArgoCD](#argocd)
- Terraform
- GCP
- Monitoring
- Alerts
- DevSecOps
  - Vulnerability scanning and reports
  - ISO27001 audit

## ⚙️ Github Actions

- **Workflow** — Has `on` triggers to configure when the workflow should run. A workflow uses either composite or Docker actions.
- **Composite Action** — Has reusable `runs` and `uses` steps, all in YAML, just like a normal workflow.
- **Docker Action** — Uses a Docker image that installs necessary dependencies and runs scripts.

```bash
.github/
├── workflows/
    └── workflow.yml     # workflow that calls the actions
├── actions/
└── composite-action/
    └── action.yml 	    # Action

└── docker-action/
    ├── action.yml      # Action
    └── Dockerfile
```

```bash
# setup
act -l

# Dry run workflows on push
act push \
    --container-architecture linux/amd64 \
    -P ubuntu-latest=ubuntu:22.04
```

## 🐳 Docker

```bash
docker buildx build --platform linux/amd64 --load --no-cache -f Containerfile -t hello:1 .
trivy image hello:1
docker run hello:1
```

## 🦭 Podman

Podman uses a daemonless architecture, meaning there is no node-level daemon process running.
In Docker, there is a node-level daemon running (e.g., `containerd`). Podman directly uses CRI-O to run containers without a daemon. Podman is `OCI compliant`.

```bash
# setup
podman machine init
podman machine start
podman machine stop

podman build --platform linux/amd64 --load --no-cache -f Containerfile -t hello:1 .
podman run --rm -it hello:1 sh
podman run --platform linux/amd64 hello:1
podman save hello:1 -o hello.tar
trivy fs hello.tar

export DOCKER_HOST=$(podman system connection default podman-machine-default)
export DOCKER_HOST=ssh://root@127.0.0.1:61056/run/podman/podman.sock

```

#### 🔧 CRI-O

CRI-O implements the Container Runtime Interface (CRI) for kubelet, pulling images and launching OCI runtimes like `runc` directly per pod — without a persistent daemon like `containerd`. It's designed as a minimal, Kubernetes-native alternative to Docker, focusing solely on pod and container lifecycle.

#### ☁️ GKE

Even after switching to Podman, GKE still uses `containerd` to manage pods. This means there would be no point in switching to Podman for GKE workloads.

#### 🔒 CI/CD Security Wins

- **Daemonless builds:** `podman build` in Actions runs rootless, with no Docker daemon vulnerabilities during image creation.
- **No socket risks:** Docker must be installed in CI to run. Podman eliminates that, removing the Docker-in-Docker (DinD) attack surface. Docker's `/var/run/docker.sock` is a massive CI vulnerability.
- **Faster and lighter:** 12–20% better resource efficiency in GitHub runners.
- We cannot run multiple containers in the same pod as a GKE pod does. However, in a local setup, Podman can create pod-like containers with multiple containers inside, replicating a GKE-native setup locally. 🎯

| Category                | Docker                   | Podman                   | **Your Win**                  |
| ----------------------- | ------------------------ | ------------------------ | ----------------------------- |
| **CI/CD Security**      | DinD daemon + socket     | Rootless, daemonless     | ✅ **Eliminates top CI vuln** |
| **GitHub Actions Cost** | Higher RAM/minutes       | 12-20% faster            | ✅ **Saves money**            |
| **Local Dev**           | `docker run`             | `podman pod create/play` | ✅ **K8s-native pods**        |
| **Rootless Default**    | Manual config            | Automatic                | ✅ **No sudo**                |
| **GKE Images**          | Identical OCI            | Identical OCI            | ✅ **Zero deployment change** |
| **Audit Trail**         | All actions → daemon UID | Traced to your UID       | ✅ **Better security logs**   |

## 🖥️ Local Cluster

```bash
# Tells kind to use Podman instead of Docker
export KIND_EXPERIMENTAL_PROVIDER=podman


# Cluster is created with a k8s image
kind create cluster --name k8s --wait 30s

# To delete
kind delete cluster --name k8s

# Set context to interact with the cluster
# By default, the cluster access configuration is stored in ${HOME}/.kube/config
kubectl config get-contexts
kubectl config use-context kind-k8s
kubectl cluster-info --context kind-k8s
```

## 🚀 ArgoCD

Argo CD needs a cluster with CoreDNS. A Kind cluster has CoreDNS by default. ArgoCD has 3 installation categories.

- **Core** (only core)
  ```bash
  core-install.yml
  ```
- **Multi-tenant Non-HA**
  ```bash
  install.yml               # cluster wide
  namespace-install.yml     # ns scoped
  ```
- **Multi-tenant HA**
  ```bash
  ha/install.yml            # cluster wide
  ha/namespace-install.yml  # ns scoped
  ```

```bash
# Deploys kustomization from the argocd folder
kubectl apply -k argocd --server-side --force-conflicts
argocd admin dashboard -n argocd
```

#### 📦 Deploying Applications

Argo CD applications, projects, and settings can be defined declaratively using Kubernetes manifests. These can be updated using `kubectl apply`, without needing to touch the `argocd` command-line tool.

- `argocd/app.yml` — Contains the ArgoCD Application resource to sync a directory specified as `"path"`.
- `app/*` — The directory that is synced via ArgoCD.

```bash
kubectl apply -n argocd -f argocd/app.yml

# Login to ArgoCD
argocd login localhost:8080 \
  --username admin \
  --password $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d) \
  --insecure

# List git repos
argocd repo list
argocd repo add https://github.com/rithik-sandron/devops.git

# Show details and sync policy (manual or auto)
argocd app get app-prod

# Sync / resync app manually
argocd app sync app-prod

# Switch from manual to auto (if manual was applied initially via app.yml)
argocd app set app-prod \
  --sync-policy automated \
  --auto-prune \
  --self-heal

# Refresh and watch Argo sync the app
argocd app get app-prod --refresh --watch

# Check app logs to see "hello" printed
kubectl logs deployment/app -n prod

# Shell into the app container
kubectl exec -it deployment/app -n prod -- /bin/sh
```
