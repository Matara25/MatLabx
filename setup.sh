#!/bin/bash

echo "NetLabX Backend Setup Script"
echo "============================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "Prerequisites check passed!"

# Create necessary directories
echo "Creating directories..."
mkdir -p logs configs docker/configs/quagga docker/configs/bird docker/configs/network docker/configs/ovs docker/configs/nginx docker/configs/ssh docker/configs/web

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file with your configuration before running the application."
fi

# Make scripts executable
echo "Making scripts executable..."
chmod +x docker/scripts/*.sh
chmod +x setup.sh

# Build Docker images
echo "Building Docker images..."
docker-compose build

echo ""
echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the application with: docker-compose up -d"
echo "3. Access the API at: http://localhost:5000"
echo "4. Check health status at: http://localhost:5000/api/health"
echo ""
echo "Default users after first startup:"
echo "- Admin: admin@netlabx.com / admin123"
echo "- Instructor: instructor@netlabx.com / instructor123"
echo "- Student: student@netlabx.com / student123"
echo ""
echo "For development mode, use: npm run dev"
