# Aurora IVR/AI Assistant - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying Aurora on k3s while maintaining Docker Compose compatibility.

## 🚀 Quick Deployment

### Prerequisites
- k3s cluster running
- kubectl configured to access your cluster
- Your Docker images built and pushed to a registry
- Domain name configured (optional but recommended)

### 1. Update Configuration

**Edit the following files with your actual values:**

#### `01-configmap.yaml`
```yaml
# Update WEBHOOK_BASE_URL with your domain
WEBHOOK_BASE_URL: "https://your-actual-domain.com"

# Update secrets with base64 encoded values:
# echo -n "your-actual-secret" | base64
```

#### `04-backend.yaml` & `05-frontend.yaml`
```yaml
# Update image references
image: your-registry/aurora-backend:latest
image: your-registry/aurora-frontend:latest
```

#### `06-ingress.yaml`
```yaml
# Update domain references
- host: your-actual-domain.com
  hosts:
  - your-actual-domain.com
```

### 2. Deploy to k3s

```bash
# Apply all manifests in order
kubectl apply -f k8s/

# Or apply individually for better control
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-mongodb.yaml
kubectl apply -f k8s/03-audio-storage.yaml
kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml
kubectl apply -f k8s/07-hpa.yaml  # Optional: Horizontal Pod Autoscaler
```

### 3. Verify Deployment

```bash
# Check all resources
kubectl get all -n aurora

# Check pods status
kubectl get pods -n aurora

# Check persistent volumes
kubectl get pvc -n aurora

# Check ingress
kubectl get ingress -n aurora

# View logs
kubectl logs -f deployment/aurora-backend -n aurora
kubectl logs -f deployment/aurora-frontend -n aurora
```

## 📁 File Structure

| File | Description |
|------|-------------|
| `00-namespace.yaml` | Aurora namespace |
| `01-configmap.yaml` | Configuration and secrets |
| `02-mongodb.yaml` | MongoDB deployment with persistent storage |
| `03-audio-storage.yaml` | Persistent volume for audio files |
| `04-backend.yaml` | Aurora backend deployment |
| `05-frontend.yaml` | Aurora frontend deployment |
| `06-ingress.yaml` | Ingress with SSL and WebSocket support |
| `07-hpa.yaml` | Horizontal Pod Autoscaler (optional) |

## 🔧 Configuration Details

### Environment Variables
- **ConfigMap**: Non-sensitive configuration (PORT, MONGODB_URI, etc.)
- **Secrets**: Sensitive data (API keys, tokens) - Base64 encoded

### Storage
- **MongoDB**: 10Gi persistent volume for database
- **Audio Files**: 20Gi persistent volume for call recordings
- **Storage Class**: `local-path` (k3s default)

### Networking
- **Frontend**: Port 80 (Nginx)
- **Backend**: Port 3000 (Express API + WebSocket)
- **MongoDB**: Port 27017 (Internal only)

### Scaling
- **Frontend**: 2-5 replicas (auto-scaling enabled)
- **Backend**: 1 replica (maintains in-memory state)
- **MongoDB**: 1 replica (single instance)

## 🔒 Security Considerations

### Secrets Management
```bash
# Create secrets manually (more secure)
kubectl create secret generic aurora-secrets \
  --from-literal=TWILIO_ACCOUNT_SID="your-sid" \
  --from-literal=TWILIO_AUTH_TOKEN="your-token" \
  --from-literal=TWILIO_PHONE_NUMBER="your-number" \
  --from-literal=OPENAI_API_KEY="your-key" \
  --from-literal=USER_PHONE_NUMBER="your-phone" \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  --namespace=aurora
```

### TLS/SSL
- Uses Traefik for automatic HTTPS
- Supports Let's Encrypt with cert-manager
- WebSocket connections are secured

## 🔄 Docker Compose Compatibility

Aurora maintains full Docker Compose compatibility:

```bash
# Development with Docker Compose
docker-compose up -d

# Production with k3s
kubectl apply -f k8s/
```

## 📊 Monitoring

### Check Application Health
```bash
# Backend health check
kubectl exec -n aurora deployment/aurora-backend -- curl http://localhost:3000/health

# View application logs
kubectl logs -f -l app=aurora-backend -n aurora
kubectl logs -f -l app=aurora-frontend -n aurora
```

### Database Operations
```bash
# Connect to MongoDB
kubectl exec -it deployment/aurora-mongo -n aurora -- mongosh aurora

# Backup database
kubectl exec deployment/aurora-mongo -n aurora -- mongodump --archive --gzip | gzip > aurora-backup.gz
```

## 🚨 Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod -n aurora
kubectl logs -n aurora <pod-name>
```

**Storage issues:**
```bash
kubectl get pvc -n aurora
kubectl describe pvc -n aurora
```

**Network connectivity:**
```bash
kubectl exec -n aurora deployment/aurora-backend -- nc -zv aurora-mongo 27017
```

**Ingress not working:**
```bash
kubectl describe ingress aurora-ingress -n aurora
```

### Important Notes

1. **Backend Scaling**: Currently limited to 1 replica due to in-memory state (activeCalls, audioStreams)
2. **Audio Storage**: Ensure sufficient disk space for call recordings
3. **MongoDB**: Consider MongoDB replica sets for production
4. **SSL Certificates**: Configure cert-manager for automatic HTTPS
5. **Resource Limits**: Adjust based on your cluster capacity

## 🔧 Advanced Configuration

### External Load Balancer
```yaml
# For cloud providers
spec:
  type: LoadBalancer
  loadBalancerIP: "your-static-ip"
```

### Custom Storage Class
```yaml
# For specific storage requirements
storageClassName: "fast-ssd"
```

### Resource Quotas
```yaml
# Limit namespace resources
apiVersion: v1
kind: ResourceQuota
metadata:
  name: aurora-quota
  namespace: aurora
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
```