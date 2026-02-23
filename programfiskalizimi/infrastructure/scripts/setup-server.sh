#!/bin/bash
#
# FiscalNext Server Setup Script
# Created by: Max (DevOps Engineer)
# Date: 2026-02-23
#
# This script automates the initial server setup for FiscalNext
# Run as: sudo bash setup-server.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER="deploy"
APP_DIR="/opt/fiscalnext"
DOMAIN="${1:-staging.fiscalnext.com}"
EMAIL="${2:-admin@fiscalnext.com}"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}FiscalNext Server Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# 1. Update System
echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git vim ufw ca-certificates gnupg lsb-release
print_status "System updated"

# 2. Create Deploy User
echo -e "${YELLOW}Step 2: Creating deploy user...${NC}"
if id "$DEPLOY_USER" &>/dev/null; then
    print_warning "User $DEPLOY_USER already exists"
else
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$DEPLOY_USER
    print_status "User $DEPLOY_USER created"
fi

# 3. Setup SSH for Deploy User
echo -e "${YELLOW}Step 3: Setting up SSH...${NC}"
mkdir -p /home/$DEPLOY_USER/.ssh
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/
fi
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
print_status "SSH configured"

# 4. Configure Firewall
echo -e "${YELLOW}Step 4: Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
print_status "Firewall configured"

# 5. Set Timezone
echo -e "${YELLOW}Step 5: Setting timezone...${NC}"
timedatectl set-timezone Europe/Tirane
print_status "Timezone set to Europe/Tirane"

# 6. Install Docker
echo -e "${YELLOW}Step 6: Installing Docker...${NC}"
if command -v docker &> /dev/null; then
    print_warning "Docker already installed"
else
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
        gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    usermod -aG docker $DEPLOY_USER
    
    print_status "Docker installed"
fi

# 7. Configure Docker
echo -e "${YELLOW}Step 7: Configuring Docker...${NC}"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false
}
EOF
systemctl restart docker
systemctl enable docker
print_status "Docker configured"

# 8. Create Application Directory
echo -e "${YELLOW}Step 8: Creating application directory...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/backups
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/uploads
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
print_status "Application directory created"

# 9. Install Certbot
echo -e "${YELLOW}Step 9: Installing Certbot...${NC}"
apt install -y certbot
print_status "Certbot installed"

# 10. Configure Swap (if < 2GB RAM)
echo -e "${YELLOW}Step 10: Configuring swap...${NC}"
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ $TOTAL_MEM -lt 2048 ]; then
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        print_status "Swap configured (2GB)"
    else
        print_warning "Swap already exists"
    fi
else
    print_status "Sufficient RAM, swap not needed"
fi

# 11. Install monitoring tools
echo -e "${YELLOW}Step 11: Installing monitoring tools...${NC}"
apt install -y htop iotop nethogs ncdu
print_status "Monitoring tools installed"

# 12. Configure automatic security updates
echo -e "${YELLOW}Step 12: Configuring automatic security updates...${NC}"
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
print_status "Automatic security updates configured"

# 13. Setup fail2ban
echo -e "${YELLOW}Step 13: Installing fail2ban...${NC}"
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
print_status "Fail2ban installed"

# Summary
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Login as $DEPLOY_USER: ${YELLOW}ssh $DEPLOY_USER@$(hostname -I | awk '{print $1}')${NC}"
echo -e "2. Clone repository to $APP_DIR"
echo -e "3. Configure environment variables"
echo -e "4. Run: ${YELLOW}docker compose up -d${NC}"
echo ""
echo -e "Domain: ${YELLOW}$DOMAIN${NC}"
echo -e "Email: ${YELLOW}$EMAIL${NC}"
echo ""
echo -e "${GREEN}Server is ready for deployment!${NC}"
