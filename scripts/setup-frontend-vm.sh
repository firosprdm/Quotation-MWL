#!/bin/bash
# setup-frontend-vm.sh
# Purpose: Initialize a lean OrbStack VM for the Next.js Frontend.

MACHINE_NAME="erp-frontend"
NODE_VERSION="22"

echo "--- Creating OrbStack Machine: $MACHINE_NAME ---"
orb create ubuntu:24.04 $MACHINE_NAME || echo "Machine already exists."

echo "--- Installing Dependencies ---"
orb -m $MACHINE_NAME sudo apt-get update
orb -m $MACHINE_NAME sudo apt-get install -y curl git build-essential

echo "--- Installing Node.js $NODE_VERSION ---"
orb -m $MACHINE_NAME bash -c "curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -"
orb -m $MACHINE_NAME sudo apt-get install -y nodejs

echo "--- Installing PM2 for Process Management ---"
orb -m $MACHINE_NAME sudo npm install -g pm2

echo "--- Configuring Environment Variables ---"
# We read from .env.local and push to /etc/environment or a local .env in the VM
# Best practice for Lean VMs is a dedicated .env file in the app directory.
orb -m $MACHINE_NAME mkdir -p ~/app
orb -m $MACHINE_NAME touch ~/app/.env

# Note: In a real scenario, we'd copy the local .env.local content here.
# For now, we'll ensure the directory structure is ready.

echo "--- VM Setup Complete ---"
echo "To deploy: "
echo "1. Sync your code: orb push . $MACHINE_NAME:~/app"
echo "2. Install & Build: orb -m $MACHINE_NAME bash -c 'cd ~/app && npm install && npm run build'"
echo "3. Start: orb -m $MACHINE_NAME bash -c 'cd ~/app && pm2 start npm --name erp-app -- start'"
