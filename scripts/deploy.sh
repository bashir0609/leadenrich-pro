#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load environment
source .env.production

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Backend deployment
echo "🔧 Deploying backend..."
cd backend

# Install dependencies
npm ci --only=production

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build application
echo "🏗️ Building application..."
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart ecosystem.config.js

# Frontend deployment
echo "🎨 Deploying frontend..."
cd ../frontend

# Install and build
npm ci
npm run build

# Deploy to CDN or static hosting
# rsync -avz --delete dist/ user@server:/var/www/leadenrich/

echo "✅ Deployment complete!"

# Health check
echo "🏥 Running health check..."
sleep 10
curl -f http://localhost:3001/health || exit 1

echo "🎉 Deployment successful!"