# Aurora GitHub Actions Workflows

This directory contains GitHub Actions workflows for building, testing, and pushing Docker images for the Aurora IVR/AI Assistant application.

## 🚀 Workflows Overview

### 1. `build-backend.yml` - Backend Image Build
**Triggers:** Push to main/develop, PR to main, manual dispatch
- Builds multi-architecture Docker images (amd64, arm64, arm/v7)
- Pushes to GitHub Container Registry (ghcr.io)
- Runs security scans with Trivy
- Generates build attestations

### 2. `build-frontend.yml` - Frontend Image Build
**Triggers:** Push to main/develop, PR to main, manual dispatch
- Runs frontend tests and linting
- Builds optimized production React bundle
- Creates multi-architecture Docker images
- Pushes to GitHub Container Registry
- Security scanning and attestations

### 3. `build-images.yml` - Complete CI Build Pipeline
**Triggers:** Push to main, version tags, manual dispatch
- Detects changes in backend/frontend code
- Builds only changed components
- Pushes images to GitHub Container Registry
- Provides build summaries with deployment instructions

### 4. `security-and-quality.yml` - Security & Quality Checks
**Triggers:** Push, PR, weekly schedule
- Dependency vulnerability scanning
- Code quality checks and linting
- Secret detection
- Dockerfile validation
- Kubernetes manifest validation
- Container security scanning

## 🔧 Configuration Requirements

### GitHub Secrets
Optional secrets for custom registry (GitHub Container Registry is used by default):

```bash
# Optional: For custom registry (if not using ghcr.io)
DOCKER_USERNAME     # Docker registry username
DOCKER_PASSWORD     # Docker registry password
REGISTRY_URL        # Custom registry URL
```

### Environment Setup

#### 1. GitHub Container Registry (Recommended)
No additional setup required. Uses `GITHUB_TOKEN` automatically.

#### 2. Custom Registry
Update workflows to use your registry:
```yaml
env:
  REGISTRY: your-registry.com
  IMAGE_PREFIX: your-namespace
```

### 3. Manual K3s Deployment
The workflows only build and push images. Deploy manually to your K3s cluster:

```bash
# Pull latest images and deploy
cd k8s/
./deploy.sh apply
```

## 📦 Image Registry

### Default Configuration
Images are pushed to GitHub Container Registry:
```
ghcr.io/your-username/aurora/aurora-backend:latest
ghcr.io/your-username/aurora/aurora-frontend:latest
```

### Image Tags
Automatic tagging strategy:
- `latest` - Latest main branch build
- `main-<sha>` - Main branch builds with commit SHA
- `develop-<sha>` - Develop branch builds
- `v1.2.3` - Semantic version tags
- `pr-123` - Pull request builds

## 🎯 Usage Examples

### Manual Build
```bash
# Trigger manual build
gh workflow run build-images.yml \
  -f custom_tag=my-custom-tag
```

### Version Release
```bash
# Create and push a version tag
git tag v2.1.1
git push origin v2.1.1

# This automatically triggers:
# 1. Image builds with version tags
# 2. Images available in container registry

# Then deploy manually:
cd k8s/
./deploy.sh apply
```

### Development Workflow
```bash
# 1. Push to feature branch
git push origin feature/new-feature

# 2. Create PR to main
# - Triggers quality checks
# - Builds test images
# - Runs security scans

# 3. Merge to main
# - Builds production images
# - Images available for manual deployment
```

## 🔍 Monitoring and Debugging

### View Workflow Status
```bash
# List workflow runs
gh run list

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Check Image Registry
```bash
# List available images
gh api /user/packages/container/aurora%2Faurora-backend/versions

# Pull latest image
docker pull ghcr.io/your-username/aurora/aurora-backend:latest
```

### Manual Deployment to K3s
```bash
# Deploy with built images
cd k8s/
./deploy.sh apply

# Check deployment status
./deploy.sh status

# View logs
./deploy.sh logs
```

## 🛠️ Customization

### Add Custom Build Steps
Extend workflows to add custom logic before/after builds:

### Custom Build Steps
Add to workflow files:
```yaml
- name: Custom build step
  run: |
    echo "Custom logic here"
```

### Additional Quality Checks
Extend `security-and-quality.yml`:
```yaml
- name: Custom security scan
  uses: your-security-action@v1
```

## 🔒 Security Best Practices

### Image Security
- Multi-stage builds to minimize attack surface
- Non-root user in containers
- Regular base image updates
- Vulnerability scanning with Trivy

### Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Environment-specific secret scoping
- No secrets in code or logs

### Access Control
- Limit workflow permissions
- Use least privilege principle
- Environment protection rules
- Required status checks

## 📋 Workflow Dependencies

### Required GitHub Actions
- `actions/checkout@v4` - Code checkout
- `docker/build-push-action@v5` - Docker builds
- `docker/setup-buildx-action@v3` - Multi-arch support
- `actions/setup-node@v4` - Node.js setup

### Optional Enhancements
- `aquasecurity/trivy-action@master` - Security scanning
- `hadolint/hadolint-action@v3.1.0` - Dockerfile linting
- `trufflesecurity/trufflehog@main` - Secret scanning

## 🚀 Getting Started

1. **Setup Repository Secrets**
   ```bash
   # Add KUBECONFIG secret
   gh secret set KUBECONFIG --body "$(cat ~/.kube/config | base64 -w 0)"
   ```

2. **Update Image References**
   ```bash
   # Update k8s manifests with your registry
   sed -i 's|blueandhack|your-username|g' k8s/04-backend.yaml k8s/05-frontend.yaml
   ```

3. **Test Workflow**
   ```bash
   # Push to trigger builds
   git push origin main
   ```

4. **Deploy to K3s**
   ```bash
   # Use built images for manual deployment
   cd k8s/
   ./deploy.sh apply
   ```

## 📁 Current Workflow Files

| File | Purpose | Triggers |
|------|---------|----------|
| `build-backend.yml` | Backend-only builds | Backend code changes, PRs, manual |
| `build-frontend.yml` | Frontend-only builds | Frontend code changes, PRs, manual |
| `build-images.yml` | Smart combined builds | Main branch, tags, manual |
| `security-and-quality.yml` | Quality & security checks | All pushes, PRs, weekly |

## 🎯 Recommended Usage

### **For Development:**
- Use individual workflows (`build-backend.yml`, `build-frontend.yml`) for component-specific changes
- Automatic PR builds for testing

### **For Production:**
- Use `build-images.yml` for main branch and releases
- Manual deployment to K3s using built images

### **For Maintenance:**
- `security-and-quality.yml` runs automatically for continuous monitoring

## 📞 Support

For workflow issues:
1. Check workflow logs in GitHub Actions tab
2. Verify image registry permissions
3. Test Docker builds locally
4. Review workflow file syntax