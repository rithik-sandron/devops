# Study

- CI — Github Actions
- Docker
- Podman
- Local kind cluster
- CD — ArgoCD
- Terraform
- GCP
- Notifications to slack
- Monitoring
- DevSecOps
  - CI vulnerability scanning
  - ISO27001 audit report

## Github Actions

- **Workflow** That has `on` as triggers to configure when the workflow should run. Workflow uses the composite or docker
- **Composite Action** (has reusable `runs`and `uses` all in yaml just like we write a normal workflow)
- **Docker Action** (uses a docker image, which will install necessary stuff and run scripts and stuff)
  actions.

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
brew install act
act -l

# Dry runs workflows on push
act push \
    --container-architecture linux/amd64 \
    -P ubuntu-latest=ubuntu:22.04
```

## Docker

```bash
docker buildx build --platform linux/amd64 --load --no-cache -f Containerfile -t hello:1 .
trivy image hello:1
docker run hello:1
```

## Podman

Podman uses a daemonless architecture meaning, there is no node level daemon process running.
In Docker there is a node level daemon running(eg: containerd). But Podman directly uses CRI-O to run containers no daemon. Podman is `OCI compliant`.

```bash
# setup
brew install podman
podman machine init
podman machine start

podman build --platform linux/amd64 --load --no-cache -f Containerfile -t hello:1 .
podman run --rm -it hello:1 sh
podman run --platform linux/amd64 hello:1
podman save hello:1 -o hello.tar
trivy fs hello.tar
```

#### CRI-O

CRI-O implements the Container Runtime Interface (CRI) for kubelet, pulling images and launching OCI runtimes like `runc` directly per pod—without a persistent daemon like containerd. It's designed as a minimal K8s-native alternative to Docker, focusing solely on pod/container lifecycle.

#### GKE

Even after switching to podman, GKE still uses `containerd` to manage pods. Then there would be no point in switching to podman.

#### CI/CD Security Wins

- Daemonless builds: podman build in Actions runs rootless, no Docker daemon vulnerabilities during image creation
- No socket risks: Docker has to installed in CI to run. Podman eliminates that. Eliminates Docker-in-Docker (DinD) attack surface. Docker's /var/run/docker.sock is a massive CI vuln.
- Faster, lighter: 12-20% better resource efficiency in GitHub runners.
- we cannot run multiple containers in same pod as GKE pod does. but in local setup podman can create pod like containers which can have multiple contianers inside replicating GKE native setup in local

| Category                | Docker                   | Podman                   | **Your Win**                  |
| ----------------------- | ------------------------ | ------------------------ | ----------------------------- |
| **CI/CD Security**      | DinD daemon + socket     | Rootless, daemonless     | ✅ **Eliminates top CI vuln** |
| **GitHub Actions Cost** | Higher RAM/minutes       | 12-20% faster            | ✅ **Saves money**            |
| **Local Dev**           | `docker run`             | `podman pod create/play` | ✅ **K8s-native pods**        |
| **Rootless Default**    | Manual config            | Automatic                | ✅ **No sudo**                |
| **GKE Images**          | Identical OCI            | Identical OCI            | ✅ **Zero deployment change** |
| **Audit Trail**         | All actions → daemon UID | Traced to your UID       | ✅ **Better security logs**   |

## Setup local cluster

```bash
# this installs packages and spins a local cluster(kind)
brew install kind

# tells kind to use podman instead of docker
KIND_EXPERIMENTAL_PROVIDER=podman

# cluster is created with k8s image
kind create cluster --name k8s --wait 30s

# to delete
kind delete cluster --name k8s

# set context to interact with the cluster
# By default, the cluster access configuration is stored in ${HOME}/.kube/config
kubectl cluster-info --context kind-k8s
kubectl config use-context kind-k8s
kubectl config get-contexts
```

## Argo CD

Argo cd needs a cluster with coreDNS. Kind cluster has coreDNS by default. ArgoCD has 3 categories.

- Core (only core)
  ```bash
  core-install.yml
  ```
- Multi-tenant Non HA
  ```bash
  install.yml               # cluster wide
  namespace-install.yml     # ns scoped
  ```
- Multi-tenant HA
  ```bash
  ha/install.yml            # cluster wide
  ha/namespace-install.yml  # ns scoped
  ```

```bash
brew install argocd

# deploys kustomization from argocd folder
kubectl apply -k argocd --server-side --force-conflicts
argocd admin dashboard -n argocd
```

#### Deployig applications

Argo CD applications, projects and settings can be defined declaratively using Kubernetes manifests. These can be updated using kubectl apply, without needing to touch the argocd command-line tool.

- `app/deployment.yml` contains deployment manifest
- `argocd/app.yml` contains the argocd app resource to sync app deployment

```bash
kubectl apply -n argocd -f argocd/app.yml

# login to argocd
argocd login localhost:8080 \
  --username admin \
  --password $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d) \
  --insecure

# list git repo
argocd repo list
argocd repo add https://github.com/rithik-sandron/devops.git

# shows details and if sync policy is manual or auto
argocd app get app-prod
# sync resync app manually
argocd app sync app-prod
```
