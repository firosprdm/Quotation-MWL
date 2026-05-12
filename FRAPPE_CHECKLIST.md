# Frappe & ERPNext Pre-Deployment Checklist

Use this checklist to ensure your custom application follows the **"Extension over Modification"** philosophy and meets production performance standards.

---

## 🏗️ 1. Architectural Integrity
- [ ] **No Core Modification**: Ensure `apps/frappe` and `apps/erpnext` are untouched. All logic must reside in `apps/zatca` or the Next.js frontend.
- [ ] **DocType Encapsulation**: Business logic is in Python controllers (`.py` files), not just in the API routes.
- [ ] **Standard REST Usage**: All frontend interactions use `/api/resource/` or whitelisted `/api/method/`.

## 🏷️ 2. Naming & Data Standards
- [ ] **Field Naming**: Custom fields in DocTypes use `snake_case` (e.g., `zatca_status`, `idempotency_key`).
- [ ] **Frontend Consistency**: JavaScript/TypeScript variables use `camelCase`, but preserve `snake_case` when sending/receiving from the ERPNext API.
- [ ] **Module Alignment**: All custom DocTypes are assigned to the correct Module (e.g., `ZATCA`).

## 🔒 3. Security & Access
- [ ] **Credential Hardening**: API Keys and Secrets are moved to `.env` files. No hardcoded credentials in `erpnext-client.ts`.
- [ ] **Method Whitelisting**: Ensure any custom Python methods called via API have the `@frappe.whitelist()` decorator.
- [ ] **Permission Check**: Roles and Permissions are defined for custom DocTypes (e.g., `ZATCA Log`) to prevent unauthorized access.

## ⚡ 4. Database & Performance
- [ ] **No Raw SQL**: Every query uses `frappe.get_list`, `frappe.get_all`, or `frappe.get_doc`. No `frappe.db.sql`.
- [ ] **Indexing**: Frequently filtered fields (like `project_id`, `status`, or `idempotency_key`) have `search_index: 1` in their JSON definition.
- [ ] **N+1 Prevention**: API routes specify required `fields` instead of fetching full documents for list views.

## ⚖️ 5. Accounting & Integrity
- [ ] **Immutable Ledgers**: `DELETE` methods in the API block deletion of documents with `docstatus: 1`.
- [ ] **Balanced Ledgers**: Journal Entry submissions validate that `Total Debit == Total Credit`.
- [ ] **Cancel/Amend Workflow**: System respects the ERPNext lifecycle—once submitted, a document must be Canceled then Amended for changes.

## 🐳 6. OrbStack & Environment
- [ ] **Lean Machines**: OrbStack VMs are running only necessary services (Node.js, PM2, Frappe Bench).
- [ ] **IP Management**: Frontend `.env` uses the internal OrbStack IP (e.g., `192.168.x.x`) for backend communication.
- [ ] **Process Management**: PM2 is configured to restart the frontend on crash; Supervisor handles the backend bench.

## 🇸🇦 7. ZATCA Compliance (Specific)
- [ ] **Idempotency Keys**: Unique keys are enforced on all POST requests to prevent duplicate invoices.
- [ ] **Audit Logs**: All ZATCA API handshakes are recorded in the `ZATCA Log` DocType for regulatory review.
- [ ] **QR Verification**: QR code generation logic correctly handles TLV encoding as per ZATCA Phase 2 specs.
