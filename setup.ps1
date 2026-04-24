# NetLabX Backend Setup Script for Windows
Write-Host "NetLabX Backend Setup Script" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed. Please install Node.js 16 or higher." -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "Docker version: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not installed. Please install Docker Desktop for Windows." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Host "Docker Compose version: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker Compose is not installed. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

Write-Host "Prerequisites check passed!" -ForegroundColor Green

# Create necessary directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "configs" | Out-Null
New-Item -ItemType Directory -Force -Path "docker\configs\quagga" | Out-Null
New-Item -ItemType Directory -Force -Path "docker\configs\bird" | Out-Null
New-Item -ItemType Directory -Force -Path "docker\configs\network" | Out-Null
New-Item -ItemType Directory -Force -Path "docker\configs\ovs" | Out-Null
New-Item -ItemType Directory -Force -Path "docker\configs\nginx" | Out-Null
New-Item -ItemType Directory -Force -Path "docker\configs\ssh" | Out-Null
New-Item -ItemType Directory -Force -Path "docker\configs\web" | Out-Null

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Copy environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Please edit .env file with your configuration before running the application." -ForegroundColor Yellow
}

# Build Docker images
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker-compose build

Write-Host ""
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your configuration" -ForegroundColor White
Write-Host "2. Start the application with: docker-compose up -d" -ForegroundColor White
Write-Host "3. Access the API at: http://localhost:5000" -ForegroundColor White
Write-Host "4. Check health status at: http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Default users after first startup:" -ForegroundColor Cyan
Write-Host "- Admin: admin@netlabx.com / admin123" -ForegroundColor White
Write-Host "- Instructor: instructor@netlabx.com / instructor123" -ForegroundColor White
Write-Host "- Student: student@netlabx.com / student123" -ForegroundColor White
Write-Host ""
Write-Host "For development mode, use: npm run dev" -ForegroundColor White
