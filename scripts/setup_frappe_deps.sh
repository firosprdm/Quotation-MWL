#!/bin/bash
set -e

echo "=== Updating System ==="
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

echo "=== Installing Dependencies ==="
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-dev python3-venv python3-pip pipx mariadb-server redis-server xvfb libfontconfig wkhtmltopdf curl git build-essential supervisor nginx

echo "=== Configuring MariaDB ==="
cat <<EOF | sudo tee /etc/mysql/mariadb.conf.d/frappe.cnf
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
EOF

echo "=== Restarting MariaDB ==="
sudo systemctl restart mariadb
sudo systemctl enable mariadb
sudo systemctl enable redis-server

echo "=== Setting MariaDB Root Password to 'frappe' ==="
# Secure MariaDB and set root password for Frappe
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'frappe';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "=== Setup Complete ==="
