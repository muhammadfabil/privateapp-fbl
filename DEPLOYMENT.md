# ISSI Stock Scraper - VPS Deployment Guide

Complete step-by-step guide untuk deploy di VPS (Ubuntu/Debian).

---

## Prerequisites
- VPS dengan Ubuntu 20.04/22.04 atau Debian 11/12
- SSH access ke server
- Domain (optional, untuk HTTPS)

---

## Step 1: Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

---

## Step 2: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start & enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify running
sudo systemctl status postgresql
```

---

## Step 3: Setup Database

```bash
# Login as postgres user
sudo -u postgres psql

# Di dalam PostgreSQL shell, jalankan:
```

```sql
-- Create database
CREATE DATABASE gfinance;

-- Create user with password
CREATE USER gfinance_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE gfinance TO gfinance_user;

-- Exit
\q
```

```bash
# Test connection
psql -h localhost -U gfinance_user -d gfinance
# Masukkan password saat diminta
```

---

## Step 4: Install Playwright Dependencies

```bash
# Install dependencies untuk Chromium headless
sudo apt install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2
```

---

## Step 5: Clone & Setup Application

```bash
# Clone repository
cd /home
git clone https://github.com/muhammadfabil/privateapp-fbl.git gfinance-scrapper
cd gfinance-scrapper

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium
```

---

## Step 6: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Isi dengan:
```env
PORT=3322
DATABASE_URL=postgresql://gfinance_user:YOUR_SECURE_PASSWORD@localhost:5432/gfinance

# Browser settings
HEADLESS=true
BROWSER_TIMEOUT=30000

# Scraper settings
SCRAPE_DELAY_MIN=2000
SCRAPE_DELAY_MAX=5000
BATCH_SIZE=10
BATCH_COOLDOWN=60000
```

```bash
# Save dan exit (Ctrl+X, Y, Enter)
```

---

## Step 7: Build & Test

```bash
# Build TypeScript
npm run build

# Test run (should show server starting)
npm run start

# Ctrl+C untuk stop
```

---

## Step 8: Setup PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start dist/index.js --name gfinance

# Save PM2 config (untuk auto-restart on reboot)
pm2 save

# Setup PM2 startup script
pm2 startup
# Jalankan perintah yang diberikan oleh PM2

# Useful commands:
# pm2 logs gfinance     - View logs
# pm2 restart gfinance  - Restart
# pm2 stop gfinance     - Stop
# pm2 status            - Check status
```

---

## Step 9: Setup Firewall (Optional)

```bash
# Allow port 3322
sudo ufw allow 3322

# Or if using nginx reverse proxy
sudo ufw allow 80
sudo ufw allow 443
```

---

## Step 10: Verify Deployment

```bash
# Test API
curl http://localhost:3322/api/health

# Test from external
curl http://YOUR_SERVER_IP:3322/api/health
```

---

## Nginx Reverse Proxy (Optional)

```bash
# Install nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/gfinance
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3322;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gfinance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Troubleshooting

### Database connection error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf if connection refused
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Ensure local connections use md5 or scram-sha-256
```

### Playwright browser not found
```bash
npx playwright install chromium --with-deps
```

### Permission denied errors
```bash
sudo chown -R $USER:$USER /home/gfinance-scrapper
```

---

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Start server | `pm2 start gfinance` |
| Stop server | `pm2 stop gfinance` |
| View logs | `pm2 logs gfinance` |
| Restart | `pm2 restart gfinance` |
| Manual scrape | `curl -X POST http://localhost:3322/api/scrape/trigger` |
| Check health | `curl http://localhost:3322/api/health` |
