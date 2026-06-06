#!/bin/bash
# Run this ONCE on the VPS to install and start the Nexaproc gateway.
# Usage: bash setup.sh <NEXAPROC_MASTER_KEY>

set -e

MASTER_KEY="${1:-}"
if [ -z "$MASTER_KEY" ]; then
  echo "Usage: bash setup.sh <NEXAPROC_MASTER_KEY>"
  exit 1
fi

INSTALL_DIR="/opt/nexaproc-gateway"

echo "==> Installing system deps..."
apt-get update -qq
apt-get install -y -q nodejs npm chromium-browser || true

echo "==> Checking Node.js..."
node --version
npm --version

echo "==> Installing pm2..."
npm install -g pm2 2>/dev/null || true

echo "==> Copying gateway files to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp index.js package.json "$INSTALL_DIR/"

echo "==> Installing Node deps..."
cd "$INSTALL_DIR"
npm install --production

echo "==> Setting up pm2 process..."
pm2 delete nexaproc-gateway 2>/dev/null || true
NEXAPROC_MASTER_KEY="$MASTER_KEY" pm2 start index.js \
  --name nexaproc-gateway \
  --env production \
  --

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "✅ Gateway is running. Test it:"
echo "   curl http://localhost:8787/health"
