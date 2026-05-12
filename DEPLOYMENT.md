# ERP System Deployment Guide (OrbStack Compose)

This guide outlines the steps to deploy the full stack using OrbStack's native Docker Compose support. This ensures environment consistency, persistent data, and automated service management.

---

## 1. Prerequisites

- **OrbStack** installed and running on macOS.
- **SSL Certificates** placed in a persistent volume or local directory mapped to `/etc/letsencrypt`.
- **Environment Variables** configured in a `.env` file in the project root.

---

## 2. Deployment Workflow

### Step 1: Configure Environment
Ensure your `.env` file is present and contains the correct API keys and database passwords.
```bash
cp .env.example .env  # If using a template
# Edit .env with your production secrets
```

### Step 2: Launch the Stack
OrbStack will automatically pick up `OrbStack-compose.yml`.
```bash
orbstack compose up -d
```

---

## 3. Security Hardening (CRITICAL)

### Step 1: Named Administrators
Do NOT use the default `Administrator` account for daily tasks:
1. Create a new User (e.g., `admin@marina-worldlink.com`).
2. Assign the **System Manager** role.
3. Enable **Two-Factor Authentication (2FA)** for this user.

### Step 2: Disable Default Administrator
Once your named administrator is verified:
```bash
orbstack compose exec erp-backend-web bench --site site1.local set-config disable_admin_login 1
```

### Step 3: Audit Trail
Enable full change tracking for financial documents:
- Go to **DocType List** > **Sales Invoice** > Enable **Track Changes**.
- Go to **DocType List** > **Journal Entry** > Enable **Track Changes**.

---

## 4. Disaster Recovery (S3 Backups)

### Step 1: Configure S3
Add your bucket credentials to the ERPNext "Backup Manager" or `.env`:
- **Service**: S3 Compatible Storage.
- **Schedule**: Daily at 02:00 AM.

### Step 2: Manual Backup Test
Verify the off-site connection:
```bash
orbstack compose exec erp-backend-web bench --site site1.local backup --with-files
```

---

## 5. KSA Payroll & HR Setup

### Step 1: GOSI & WPS
Configure Saudi-specific deductions and bank export formats in the HR module.

---

## 6. Accounting Initialization

### Step 1: COA & Taxes
Verify the Construction COA (Civil vs MEP) and 15% VAT templates.

---

## 7. Maintenance & Monitoring

### View Logs
```bash
orbstack compose logs -f
```

### Database Maintenance
```bash
orbstack compose exec erp-backend-web bench --site site1.local doctor
```
