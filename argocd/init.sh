kubectl apply -k base --server-side --force-conflicts
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/config/install.yaml
kubectl apply -f sync
