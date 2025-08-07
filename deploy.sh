#!/bin/bash

# LeadEnrich Pro Docker Deployment Script
# Run this script on your Contabo VPS

set -e

echo "🚀 Starting LeadEnrich Pro deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Installing Docker...${NC}"
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
    echo -e "${YELLOW}⚠️  Please logout and login again to use Docker without sudo${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Installing Docker Compose...${NC}"
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker Compose installed successfully${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from template...${NC}"
    cp .env.production .env
    
    echo -e "${RED}❌ Please edit the .env file with your actual values before continuing:${NC}"
    echo "   - DB_PASSWORD: Set a secure database password"
    echo "   - JWT_SECRET: Set a secure JWT secret (minimum 32 characters)"
    echo "   - CORS_ORIGIN: Set your VPS IP or domain"
    echo "   - NEXT_PUBLIC_API_URL: Set your VPS IP or domain"
    echo "   - Add your provider API keys"
    echo ""
    echo "After editing .env, run this script again."
    exit 1
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down --remove-orphans

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose up --build -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🔍 Checking service health...${NC}"

# Check database
if docker-compose exec -T database pg_isready -U leadenrich_user -d leadenrich; then
    echo -e "${GREEN}✅ Database is ready${NC}"
else
    echo -e "${RED}❌ Database is not ready${NC}"
fi

# Check backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is ready${NC}"
else
    echo -e "${RED}❌ Backend is not ready${NC}"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is ready${NC}"
else
    echo -e "${RED}❌ Frontend is not ready${NC}"
fi

# Check nginx
if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx is ready${NC}"
else
    echo -e "${RED}❌ Nginx is not ready${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "Your LeadEnrich Pro application should now be accessible at:"
echo "  - Main application: http://$(curl -s ifconfig.me)"
echo "  - Direct frontend: http://$(curl -s ifconfig.me):3000"
echo "  - Direct backend: http://$(curl -s ifconfig.me):3001"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop the application:"
echo "  docker-compose down"
echo ""
echo "To restart the application:"
echo "  docker-compose restart"
