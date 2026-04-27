#!/bin/bash
# ============================================================================
# MyMeet MCP Server — First-time deploy on Google VM
#
# Usage (from local machine):
#   ssh user@your-vm-ip "bash -s" < deploy/deploy.sh
#
# Or on the VM directly:
#   bash deploy/deploy.sh
# ============================================================================
set -e

echo "=== MyMeet MCP Server — Deploy ==="

# 1. Ensure Node.js 22+ is installed
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 22 ]; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js $(node -v)"

# 2. Navigate to mymeet-mcp
cd ~/mymeet-dev/mymeet-mcp

# 3. Install dependencies & build
echo "Installing dependencies..."
npm ci --production=false
echo "Building..."
npm run build

# 4. Install systemd service
echo "Setting up systemd service..."
sudo cp deploy/mymeet-mcp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mymeet-mcp
sudo systemctl restart mymeet-mcp

# 5. Setup nginx (if nginx installed)
if command -v nginx &> /dev/null; then
    echo "Setting up nginx..."
    sudo cp deploy/nginx-mcp.conf /etc/nginx/sites-available/mcp.mymeet.ai
    sudo ln -sf /etc/nginx/sites-available/mcp.mymeet.ai /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx

    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Add DNS A-record: mcp.mymeet.ai → $(curl -s ifconfig.me)"
    echo "2. Get SSL: sudo certbot --nginx -d mcp.mymeet.ai"
    echo "3. Test: curl https://mcp.mymeet.ai/health"
else
    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Install nginx: sudo apt install nginx"
    echo "2. Re-run this script"
fi

echo ""
echo "=== Service Status ==="
sudo systemctl status mymeet-mcp --no-pager -l

echo ""
echo "MCP endpoint: http://localhost:3100/mcp"
echo "Health check: http://localhost:3100/health"
