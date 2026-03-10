# Study

- Github Actions
- Docker
- Podman

## Github Actions

```bash
# Keep colors, remove Docker/act noise
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

```bash
podman build --platform linux/amd64 --load --no-cache -f Containerfile -t hello:1 .
podman run --rm -it hello:1 sh
podman run --platform linux/amd64 hello:1
podman save hello:1 -o hello.tar
trivy fs hello.tar
```
