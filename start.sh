#!/bin/bash
#
# Yggdrasil Commander - Quick Start Script
#

set -e

echo "🌳 Yggdrasil Commander"
echo "Sovereign Simplicity"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if port 80 is available
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 80 is already in use."
    echo "   The application may fail to start."
    echo "   You can edit docker-compose.yml to use a different port."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start the services
echo "🚀 Building and starting Yggdrasil Commander..."
echo ""

docker compose up --build -d

echo ""
echo "✅ Yggdrasil Commander is starting!"
echo ""
echo "📊 View logs:"
echo "   docker compose logs -f"
echo ""
echo "🌐 Access the interface:"
echo "   http://localhost"
echo ""
echo "🛑 Stop the services:"
echo "   docker compose down"
echo ""
