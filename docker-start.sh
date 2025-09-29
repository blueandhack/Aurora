#!/bin/bash

# Aurora IVR Assistant Docker Startup Script
# Supports x86_64, ARM64 (Apple Silicon), and ARM (Raspberry Pi)

set -e

echo "🚀 Starting Aurora IVR Assistant..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📋 Please copy .env.example to .env and configure your settings:"
    echo "   cp .env.example .env"
    echo "   # Then edit .env with your Twilio and OpenAI credentials"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
required_vars=(
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN" 
    "TWILIO_PHONE_NUMBER"
    "OPENAI_API_KEY"
    "USER_PHONE_NUMBER"
    "WEBHOOK_BASE_URL"
    "JWT_SECRET"
)

echo "🔍 Validating environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        echo "Please check your .env file"
        exit 1
    fi
done

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        echo "🖥️  Detected x86_64 architecture"
        ;;
    aarch64|arm64)
        echo "💻 Detected ARM64 architecture (Apple Silicon/ARM64 servers)"
        ;;
    armv7l|armhf)
        echo "🥧 Detected ARM architecture (Raspberry Pi)"
        ;;
    *)
        echo "⚠️  Unknown architecture: $ARCH (proceeding anyway)"
        ;;
esac

# Check if we're in local development (without multi-platform support)
if docker buildx version >/dev/null 2>&1 && docker buildx ls | grep -q "default.*docker$"; then
    echo "⚠️  Using local Docker driver - switching to single-platform build"
    COMPOSE_FILE="docker-compose.local.yml"
else
    echo "📦 Using multi-platform Docker setup"
    COMPOSE_FILE="docker-compose.yml"
    # Pull latest images for multi-platform
    docker-compose pull
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f "$COMPOSE_FILE" up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up (healthy)"; then
    echo "✅ Services are running and healthy!"
else
    echo "⚠️  Services are starting up, checking logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=20
fi

# Show running services
echo ""
echo "🎉 Aurora IVR Assistant is now running!"
echo ""
echo "📊 Service Status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "🔗 Access URLs:"
echo "   Frontend:     http://localhost:3001"
echo "   Backend API:  http://localhost:${PORT:-3000}/health"
echo "   Database:     mongodb://localhost:27017/aurora"

echo ""
echo "🛠️  Useful Commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo "   Update:       ./docker-start.sh"

echo ""
echo "📱 Configure your Twilio webhook URL to:"
echo "   ${WEBHOOK_BASE_URL}/webhook"