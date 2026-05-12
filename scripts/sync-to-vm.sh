#!/bin/bash
# Sync local Mac changes to the high-performance native VM storage seamlessly
orb -m erp-frontend bash -c "rsync -av --exclude 'node_modules' --exclude '.next' --exclude '.git' '/Volumes/MARINA CO/Antigravity/ERP with ERP Next/' ~/app/"
orb -m erp-frontend bash -c "cd ~/app && npm run build && pm2 restart erp-app"
