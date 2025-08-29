#!/bin/bash

# Production Docker build script for Nesbah Portal
set -e

echo "🚀 Starting production Docker build for Nesbah Portal..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build arguments
BUILD_ARGS=""
IMAGE_NAME="nesbah-portal"
TAG="latest"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag)
            TAG="$2"
            shift 2
            ;;
        --no-cache)
            BUILD_ARGS="$BUILD_ARGS --no-cache"
            shift
            ;;
        --pull)
            BUILD_ARGS="$BUILD_ARGS --pull"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --tag TAG       Specify image tag (default: latest)"
            echo "  --no-cache      Build without using cache"
            echo "  --pull          Always pull base images"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set full image name
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "📦 Building image: $FULL_IMAGE_NAME"
echo "🔧 Build arguments: $BUILD_ARGS"

# Start timing
START_TIME=$(date +%s)

# Build the image
echo "🏗️  Building Docker image..."
docker build \
    -f Dockerfile.production \
    -t "$FULL_IMAGE_NAME" \
    $BUILD_ARGS \
    .

# Check build result
if [ $? -eq 0 ]; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo "✅ Build completed successfully!"
    echo "⏱️  Build duration: ${DURATION} seconds"
    echo "🐳 Image: $FULL_IMAGE_NAME"
    
    # Show image size
    IMAGE_SIZE=$(docker images "$FULL_IMAGE_NAME" --format "table {{.Size}}" | tail -n 1)
    echo "📏 Image size: $IMAGE_SIZE"
    
    # Show layers
    echo "🔍 Image layers:"
    docker history "$FULL_IMAGE_NAME" --format "table {{.CreatedBy}}\t{{.Size}}" | head -10
    
    echo ""
    echo "🚀 Ready to deploy! Use the following command to run:"
    echo "   docker-compose -f docker-compose.production.yml up -d"
    
else
    echo "❌ Build failed!"
    exit 1
fi
