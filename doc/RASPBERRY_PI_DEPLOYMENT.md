# 🍓 TaxiTub on Raspberry Pi - Deployment Guide

TaxiTub can be successfully hosted on Raspberry Pi devices, providing a cost-effective solution for local taxi dispatch operations. This guide covers multiple deployment strategies from simple local hosting to production-ready setups.

## 📋 Prerequisites

### Recommended Raspberry Pi Models
- **Raspberry Pi 4 Model B (4GB/8GB RAM)** - Recommended for production
- **Raspberry Pi 4 Model B (2GB RAM)** - Suitable for small operations
- **Raspberry Pi 3 Model B+** - Minimum requirement, may have performance limitations

### Required Accessories
- **MicroSD Card**: 32GB Class 10 or faster (64GB+ recommended)
- **Power Supply**: Official Raspberry Pi power adapter
- **Case with Cooling**: Heat sinks or active cooling recommended
- **Network Connection**: Ethernet preferred for stability

## 🚀 Deployment Options

### Option 1: Frontend-Only Hosting (Simplest)
Host only the React frontend on Raspberry Pi while using cloud Supabase for backend.

#### Benefits
- ✅ Simplest setup and maintenance
- ✅ Reliable cloud backend with auto-scaling
- ✅ Lower Pi resource usage
- ✅ Built-in backups and security

#### Requirements
- Raspberry Pi with internet connection
- Cloud Supabase account (free tier available)

### Option 2: Full Self-Hosted Solution
Host both frontend and backend (database) entirely on Raspberry Pi.

#### Benefits
- ✅ Complete independence from cloud services
- ✅ Full data control and privacy
- ✅ No ongoing cloud costs
- ✅ Works with local network only

#### Requirements
- Raspberry Pi 4 (4GB+ RAM recommended)
- Docker support
- Local PostgreSQL database

### Option 3: Hybrid Cloud Setup
Frontend on Pi, managed database in cloud for better reliability.

#### Benefits
- ✅ Local control of frontend
- ✅ Reliable cloud database
- ✅ Balanced cost and performance

---

## 🛠️ Setup Instructions

### Initial Raspberry Pi Setup

#### 1. Install Raspberry Pi OS
```bash
# Flash Raspberry Pi OS Lite (64-bit) to SD card
# Enable SSH and configure WiFi during flash process

# First boot - update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git vim htop
```

#### 2. Install Node.js
```bash
# Install Node.js 18.x (recommended method)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show v8.x.x
```

#### 3. Configure Memory and Performance
```bash
# Increase GPU memory split for better performance
sudo raspi-config
# Advanced Options > Memory Split > Set to 64

# Enable hardware acceleration
echo 'gpu_mem=64' | sudo tee -a /boot/config.txt

# Reboot to apply changes
sudo reboot
```

---

## 🌐 Option 1: Frontend-Only Deployment

### Step 1: Clone and Setup Project
```bash
# Clone the repository
git clone https://github.com/your-username/Delhi-Cabs.git
cd Delhi-Cabs

# Install dependencies (this may take 10-15 minutes on Pi)
npm install
```

### Step 2: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your cloud Supabase credentials
nano .env
```

Environment configuration:
```env
# Supabase Configuration (Cloud)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-key

# Application Settings
VITE_APP_NAME=TaxiTub
VITE_APP_VERSION=0.1.0

# Production optimizations for Pi
VITE_ENVIRONMENT=production
```

### Step 3: Build and Deploy
```bash
# Create production build
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Install serve to host static files
sudo npm install -g serve

# Start the application
pm2 start "serve -s dist -l 3000" --name taxitub

# Enable PM2 startup
pm2 startup
pm2 save
```

### Step 4: Configure Nginx (Optional - Recommended)
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/taxitub
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-pi-ip-address;
    root /home/pi/Delhi-Cabs/dist;
    index index.html;

    # Gzip compression for better performance
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/taxitub /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🐳 Option 2: Full Self-Hosted with Docker

### Step 1: Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Reboot to apply group changes
sudo reboot
```

### Step 2: Create Docker Configuration
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: taxitub-db
    environment:
      POSTGRES_DB: taxitub
      POSTGRES_USER: taxitub_user
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase-setup.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  # PostgREST API
  postgrest:
    image: postgrest/postgrest:v11.2.0
    container_name: taxitub-api
    environment:
      PGRST_DB_URI: postgres://taxitub_user:secure_password_here@postgres:5432/taxitub
      PGRST_DB_SCHEMA: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: your-jwt-secret-here
    ports:
      - "3001:3000"
    depends_on:
      - postgres
    restart: unless-stopped

  # TaxiTub Frontend
  taxitub:
    build: .
    container_name: taxitub-frontend
    ports:
      - "3000:3000"
    depends_on:
      - postgrest
    restart: unless-stopped
    environment:
      - NODE_ENV=production

volumes:
  postgres_data:
```

### Step 3: Create Dockerfile
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Step 4: Deploy
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f taxitub
```

---

## ⚡ Performance Optimization for Raspberry Pi

### 1. System Optimizations
```bash
# Increase swap space (for compilation)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Optimize GPU memory
echo 'gpu_mem=64' | sudo tee -a /boot/config.txt

# Enable hardware acceleration
echo 'dtoverlay=vc4-kms-v3d' | sudo tee -a /boot/config.txt
```

### 2. Application Optimizations
```bash
# Build with Pi-specific optimizations
export NODE_OPTIONS="--max-old-space-size=3072"
npm run build
```

Update `vite.config.ts` for Pi optimization:
```typescript
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### 3. Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop -y

# Monitor system resources
htop

# Monitor disk I/O
sudo iotop

# Check memory usage
free -h

# Monitor temperature
vcgencmd measure_temp
```

---

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# Install and configure UFW
sudo apt install ufw -y

# Allow SSH (if using)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow your application port
sudo ufw allow 3000

# Enable firewall
sudo ufw enable
```

### 2. SSL Certificate (Optional)
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace your-domain.com)
sudo certbot --nginx -d your-domain.com
```

### 3. Auto-Updates
```bash
# Install unattended upgrades
sudo apt install unattended-upgrades -y

# Configure automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Monitoring and Maintenance

### 1. System Monitoring
Create monitoring script `/home/pi/monitor.sh`:
```bash
#!/bin/bash
echo "=== TaxiTub System Status ==="
echo "Temperature: $(vcgencmd measure_temp)"
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h /
echo ""
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)"
echo ""
echo "Application Status:"
pm2 status
```

### 2. Automated Backups
Create backup script `/home/pi/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/pi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database (if using Docker)
docker exec taxitub-db pg_dump -U taxitub_user taxitub > $BACKUP_DIR/db_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/pi/Delhi-Cabs

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
crontab -e
# Add line for daily backup at 2 AM
0 2 * * * /home/pi/backup.sh >> /var/log/backup.log 2>&1
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Out of Memory During Build
```bash
# Increase swap space
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Use build optimization
export NODE_OPTIONS="--max-old-space-size=3072"
npm run build
```

#### 2. Slow Performance
```bash
# Check temperature throttling
vcgencmd measure_temp
# If > 70°C, improve cooling

# Check memory usage
free -h

# Optimize Pi configuration
echo 'arm_freq=1750' | sudo tee -a /boot/config.txt
echo 'gpu_mem=64' | sudo tee -a /boot/config.txt
```

#### 3. Network Issues
```bash
# Check network connectivity
ping 8.8.8.8

# Check port availability
sudo netstat -tulpn | grep :3000

# Restart networking
sudo systemctl restart networking
```

#### 4. Application Not Starting
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs taxitub

# Restart application
pm2 restart taxitub
```

---

## 📈 Performance Expectations

### Raspberry Pi 4 (4GB RAM)
- **Build Time**: 15-20 minutes
- **Memory Usage**: ~200-400MB during operation
- **Concurrent Users**: 10-20 simultaneous users
- **Response Time**: < 500ms for most operations

### Raspberry Pi 3 Model B+
- **Build Time**: 25-35 minutes
- **Memory Usage**: ~300-500MB during operation
- **Concurrent Users**: 5-10 simultaneous users
- **Response Time**: < 1000ms for most operations

---

## 💰 Cost Analysis

### Hardware Costs (One-time)
- Raspberry Pi 4 (4GB): $75
- MicroSD Card (64GB): $15
- Case + Power Supply: $20
- **Total**: ~$110

### Operational Costs
- **Electricity**: ~$2-5 per month
- **Internet**: Existing connection
- **Maintenance**: Minimal

### Comparison with Cloud Hosting
- **Cloud VPS**: $5-20/month
- **Pi Hosting**: ~$3/month electricity
- **Break-even**: 3-4 months

---

## 🎯 Use Cases

### Ideal Scenarios for Pi Hosting
- ✅ Local taxi companies with <50 vehicles
- ✅ Airport shuttle services
- ✅ Small transport cooperatives
- ✅ Development and testing environments
- ✅ Areas with unreliable internet

### When to Consider Cloud Hosting
- ❌ Large fleets (>100 vehicles)
- ❌ High availability requirements (99.9%+)
- ❌ Multiple locations needing central management
- ❌ Regulatory compliance requirements

---

## 🔄 Updating TaxiTub on Pi

### Automated Update Script
Create `/home/pi/update.sh`:
```bash
#!/bin/bash
cd /home/pi/Delhi-Cabs

echo "Stopping TaxiTub..."
pm2 stop taxitub

echo "Backing up current version..."
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Starting TaxiTub..."
pm2 start taxitub

echo "Update completed!"
```

Make executable and run:
```bash
chmod +x /home/pi/update.sh
./update.sh
```

---

## 📞 Support and Community

### Getting Help
- **Documentation**: Check all files in `/doc` folder
- **GitHub Issues**: For bugs and feature requests
- **Pi Community**: Raspberry Pi forums for hardware issues

### Reporting Pi-Specific Issues
Include in bug reports:
- Pi model and RAM size
- OS version (`cat /etc/os-release`)
- Temperature (`vcgencmd measure_temp`)
- Available memory (`free -h`)
- System load (`uptime`)

---

**Conclusion**: Hosting TaxiTub on Raspberry Pi is not only possible but can be a cost-effective solution for small to medium taxi operations. The Pi 4 provides sufficient performance for most use cases while keeping costs low and providing complete control over your data and infrastructure.

🚖🍓 Happy Pi hosting!
