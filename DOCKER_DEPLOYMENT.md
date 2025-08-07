# LeadEnrich Pro - Docker Deployment Guide

This guide will help you deploy LeadEnrich Pro using Docker on your Contabo VPS.

## 🚀 Quick Start

### Prerequisites
- Ubuntu 22.04 VPS (Contabo)
- Root or sudo access
- At least 2GB RAM and 20GB storage

### 1. Clone the Repository
```bash
git clone https://github.com/bashir0609/leadenrich-pro.git
cd leadenrich-pro
```

### 2. Run the Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install Docker and Docker Compose if needed
- Create environment file from template
- Build and start all services
- Check service health

### 3. Configure Environment Variables
Edit the `.env` file with your actual values:

```bash
nano .env
```

**Important variables to update:**
- `DB_PASSWORD`: Set a secure database password
- `JWT_SECRET`: Set a secure JWT secret (minimum 32 characters)
- `CORS_ORIGIN`: Your VPS IP or domain (e.g., `http://144.91.124.230`)
- `NEXT_PUBLIC_API_URL`: Your VPS IP or domain (e.g., `http://144.91.124.230/api`)
- Provider API keys (Apollo, Hunter, Clearbit, etc.)

### 4. Start the Application
```bash
docker-compose up -d
```

## 🏗️ Architecture

The Docker setup includes:

- **Frontend**: Next.js application (port 3000)
- **Backend**: Node.js/Express API (port 3001)
- **Database**: PostgreSQL (port 5432)
- **Cache**: Redis (port 6379)
- **Proxy**: Nginx (port 80)

## 📋 Available Commands

### Production Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up --build -d

# Check service status
docker-compose ps
```

### Development Commands
```bash
# Start development database only
docker-compose -f docker-compose.dev.yml up -d

# Run frontend in development
cd frontend && npm run dev

# Run backend in development
cd backend && npm run dev
```

## 🔧 Service Configuration

### Frontend (Next.js)
- **Port**: 3000
- **Build**: Multi-stage Docker build with standalone output
- **Environment**: Production optimized

### Backend (Node.js)
- **Port**: 3001
- **Database**: PostgreSQL with Prisma ORM
- **Features**: API routes, file uploads, authentication

### Database (PostgreSQL)
- **Port**: 5432
- **User**: leadenrich_user
- **Database**: leadenrich
- **Persistence**: Docker volume

### Nginx (Reverse Proxy)
- **Port**: 80 (HTTP), 443 (HTTPS - when configured)
- **Features**: Rate limiting, compression, security headers
- **Routes**: 
  - `/` → Frontend
  - `/api/` → Backend

## 🛡️ Security Features

- Rate limiting on API endpoints
- Security headers (XSS protection, CSRF, etc.)
- JWT authentication
- Environment variable isolation
- Non-root container users

## 📊 Monitoring

### Health Checks
```bash
# Check all services
curl http://your-vps-ip/health

# Check backend API
curl http://your-vps-ip/api/health

# Check frontend
curl http://your-vps-ip
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f database
```

## 🔄 Updates and Maintenance

### Update Application
```bash
git pull origin main
docker-compose up --build -d
```

### Database Migrations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Reset database (⚠️ DESTRUCTIVE)
docker-compose exec backend npx prisma migrate reset
```

### Backup Database
```bash
# Create backup
docker-compose exec database pg_dump -U leadenrich_user leadenrich > backup.sql

# Restore backup
docker-compose exec -T database psql -U leadenrich_user leadenrich < backup.sql
```

## 🌐 SSL/HTTPS Setup (Optional)

### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Update nginx configuration
# Uncomment HTTPS server block in nginx/nginx.conf
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   docker-compose logs database
   docker-compose restart database
   ```

3. **Frontend build fails**
   ```bash
   docker-compose logs frontend
   # Check environment variables
   ```

4. **Backend API not responding**
   ```bash
   docker-compose logs backend
   # Check database connection
   ```

### Reset Everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Remove all images
docker system prune -a

# Start fresh
docker-compose up --build -d
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all required ports are available
4. Check VPS firewall settings

## 🎯 Production Checklist

- [ ] Update all environment variables
- [ ] Set secure database password
- [ ] Configure JWT secret
- [ ] Add provider API keys
- [ ] Set up SSL certificate
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Configure automated backups
- [ ] Test all functionality

Your LeadEnrich Pro application should now be running at `http://your-vps-ip`!
