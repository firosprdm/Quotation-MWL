#!/bin/bash
set -e

echo "=== Installing uv ==="
pipx install uv

echo "=== Installing Frappe Bench via Pipx ==="
pipx install frappe-bench
export PATH="$PATH:/home/ubuntu/.local/bin"

echo "=== Initializing Frappe Bench ==="
cd /home/ubuntu
bench init --frappe-branch version-15 frappe-bench --python /usr/bin/python3.12
cd frappe-bench

echo "=== Getting Payments App ==="
bench get-app payments --branch version-15

echo "=== Getting ERPNext App ==="
bench get-app erpnext --branch version-15

echo "=== Getting Custom Zatca App ==="
# We will copy the ZATCA app directly into apps directory
cp -r /home/ubuntu/erp-app/apps/zatca /home/ubuntu/frappe-bench/apps/
echo "zatca" >> /home/ubuntu/frappe-bench/sites/apps.txt

echo "=== Installing Zatca Dependencies ==="
./env/bin/pip install -e apps/zatca

echo "=== Bench Build ==="
bench build

echo "=== Bench Setup Complete ==="
