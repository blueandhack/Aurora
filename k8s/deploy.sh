#!/bin/bash

# Aurora k3s Deployment Script
# Usage: ./deploy.sh [apply|delete|status]

set -e

NAMESPACE="aurora"
KUBECTL_CMD="kubectl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

apply_manifests() {
    log_info "Deploying Aurora to k3s cluster..."

    # Apply manifests in order
    log_info "Creating namespace..."
    $KUBECTL_CMD apply -f 00-namespace.yaml

    log_info "Applying configuration and secrets..."
    $KUBECTL_CMD apply -f 01-configmap.yaml

    log_info "Setting up storage..."
    $KUBECTL_CMD apply -f 02-mongodb.yaml
    $KUBECTL_CMD apply -f 03-audio-storage.yaml

    log_info "Waiting for MongoDB to be ready..."
    $KUBECTL_CMD wait --for=condition=available --timeout=300s deployment/aurora-mongo -n $NAMESPACE

    log_info "Deploying backend..."
    $KUBECTL_CMD apply -f 04-backend.yaml

    log_info "Waiting for backend to be ready..."
    $KUBECTL_CMD wait --for=condition=available --timeout=300s deployment/aurora-backend -n $NAMESPACE

    log_info "Deploying frontend..."
    $KUBECTL_CMD apply -f 05-frontend.yaml

    log_info "Setting up ingress..."
    $KUBECTL_CMD apply -f 06-ingress.yaml

    log_info "Applying autoscaling (optional)..."
    $KUBECTL_CMD apply -f 07-hpa.yaml

    log_success "Aurora deployment completed!"
    show_status
}

delete_manifests() {
    log_warning "Deleting Aurora from k3s cluster..."

    # Delete in reverse order
    $KUBECTL_CMD delete -f 07-hpa.yaml --ignore-not-found=true
    $KUBECTL_CMD delete -f 06-ingress.yaml --ignore-not-found=true
    $KUBECTL_CMD delete -f 05-frontend.yaml --ignore-not-found=true
    $KUBECTL_CMD delete -f 04-backend.yaml --ignore-not-found=true
    $KUBECTL_CMD delete -f 03-audio-storage.yaml --ignore-not-found=true
    $KUBECTL_CMD delete -f 02-mongodb.yaml --ignore-not-found=true
    $KUBECTL_CMD delete -f 01-configmap.yaml --ignore-not-found=true

    log_warning "Keeping namespace and PVCs for data safety"
    log_warning "To completely remove including data:"
    log_warning "  kubectl delete namespace $NAMESPACE"

    log_success "Aurora deletion completed!"
}

show_status() {
    log_info "Aurora Deployment Status:"
    echo

    log_info "Pods:"
    $KUBECTL_CMD get pods -n $NAMESPACE
    echo

    log_info "Services:"
    $KUBECTL_CMD get services -n $NAMESPACE
    echo

    log_info "Persistent Volume Claims:"
    $KUBECTL_CMD get pvc -n $NAMESPACE
    echo

    log_info "Ingress:"
    $KUBECTL_CMD get ingress -n $NAMESPACE
    echo

    # Check if all deployments are ready
    if $KUBECTL_CMD wait --for=condition=available --timeout=10s deployment/aurora-backend deployment/aurora-frontend -n $NAMESPACE &>/dev/null; then
        log_success "All deployments are ready!"

        # Get the ingress URL
        INGRESS_HOST=$($KUBECTL_CMD get ingress aurora-ingress -n $NAMESPACE -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "not-configured")
        if [ "$INGRESS_HOST" != "not-configured" ] && [ "$INGRESS_HOST" != "your-domain.com" ]; then
            log_success "Application available at: https://$INGRESS_HOST"
        else
            log_warning "Please configure your domain in 06-ingress.yaml"
        fi
    else
        log_warning "Some deployments are not ready yet. Check with: kubectl get pods -n $NAMESPACE"
    fi
}

show_logs() {
    log_info "Recent logs from Aurora components:"
    echo

    log_info "Backend logs (last 20 lines):"
    $KUBECTL_CMD logs --tail=20 -l app=aurora-backend -n $NAMESPACE
    echo

    log_info "Frontend logs (last 10 lines):"
    $KUBECTL_CMD logs --tail=10 -l app=aurora-frontend -n $NAMESPACE
    echo
}

show_help() {
    echo "Aurora k3s Deployment Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  apply     Deploy Aurora to k3s cluster"
    echo "  delete    Remove Aurora from k3s cluster"
    echo "  status    Show deployment status"
    echo "  logs      Show recent logs"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0 apply      # Deploy Aurora"
    echo "  $0 status     # Check deployment status"
    echo "  $0 logs       # View application logs"
    echo "  $0 delete     # Remove Aurora (keeps data)"
}

# Main script logic
case "${1:-help}" in
    "apply")
        check_prerequisites
        apply_manifests
        ;;
    "delete")
        check_prerequisites
        delete_manifests
        ;;
    "status")
        check_prerequisites
        show_status
        ;;
    "logs")
        check_prerequisites
        show_logs
        ;;
    "help"|*)
        show_help
        ;;
esac