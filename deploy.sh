#!/bin/bash

# Configuration
# ==========================================
SERVER_USER="root"
SERVER_IP="209.38.226.171"
SERVER_DIR="~/OCPP"
ARCHIVE_NAME="deploy-$(date +%Y%m%d%H%M%S).tar.gz"
IMAGES_FILE="images.tar.gz"
PLATFORM="linux/amd64"
# ==========================================

set -e

echo "🚀 Starting Deployment Process..."

# 1. Build Docker images locally for amd64
echo "🔨 1/6 Building Docker images for $PLATFORM..."
docker buildx build --platform $PLATFORM -t ocpp-backend ./backend --target development --load
docker buildx build --platform $PLATFORM -t ocpp-ocpp-gateway ./ocpp-gateway --target development --load
docker buildx build --platform $PLATFORM -t ocpp-web ./web \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_OCPP_GATEWAY_URL=https://app.sarjmodul.com/gateway \
  --load
docker buildx build --platform $PLATFORM -t ocpp-mobile ./mobile --load

# 2. Save images to tar
echo "💾 2/6 Saving Docker images to $IMAGES_FILE..."
docker save ocpp-backend ocpp-ocpp-gateway ocpp-web ocpp-mobile | gzip > $IMAGES_FILE

# 3. Compress source files (exclude heavy/unnecessary stuff)
echo "📦 3/6 Compressing project files..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='mobile/node_modules' \
    --exclude='mobile/.expo' \
    --exclude='backend/node_modules' \
    --exclude='ocpp-gateway/node_modules' \
    --exclude='web/node_modules' \
    --exclude='simulation/node_modules' \
    --exclude='*.tar.gz' \
    --exclude='docker-compose.yml' \
    -czf $ARCHIVE_NAME .

# 4. Upload both files to server
echo "📤 4/6 Uploading files to server..."
scp $ARCHIVE_NAME $IMAGES_FILE $SERVER_USER@$SERVER_IP:$SERVER_DIR/

# 5. Extract source files, load images, start containers
echo "🔧 5/6 Setting up on remote server..."
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_DIR
    echo "Extracting source files..."
    tar -xzf $ARCHIVE_NAME
    rm $ARCHIVE_NAME
    echo "Loading Docker images..."
    docker load < $IMAGES_FILE
    rm $IMAGES_FILE
    echo "Starting containers..."
    docker compose up -d
    echo "✅ Server is up!"
EOF

# 6. Clean up local files
echo "🧹 6/6 Cleaning up local files..."
rm $ARCHIVE_NAME $IMAGES_FILE

echo "✨ Deployment complete! 🎉"
