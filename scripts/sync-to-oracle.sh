#!/bin/bash
KEY="/Users/firoz/Downloads/ssh-key-2026-05-12-3.key"
IP="145.241.154.0"
USER="ubuntu"
DEST="~/erp-app"

echo "Syncing local code to Oracle Cloud..."
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env' --exclude '.env.local' -e "ssh -i '$KEY' -o StrictHostKeyChecking=no" ./ $USER@$IP:$DEST/

echo "Rebuilding Next.js App on Oracle Cloud..."
ssh -i "$KEY" -o StrictHostKeyChecking=no $USER@$IP "cd $DEST && npm install && npm run build && pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js"

echo "Done! Cloud is updated."
