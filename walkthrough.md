# MARINA ERP System Walkthrough

Welcome to the visual walkthrough of your high-performance, compliant ERP system.

---

## 💎 Premium Design & UI
The system utilizes a state-of-the-art **Glassmorphic Dark Theme**, designed for maximum clarity and a premium feel.

![Financial Ledger Overview](file:///Users/firoz/.gemini/antigravity/brain/427a8e73-49d3-42bb-809b-798f470cfc3b/.system_generated/click_feedback/click_feedback_1778561469363.png)
*Figure 1: The Financial Ledger overview showing the real-time Chart of Accounts and compliance tabs.*

---

## 🇸🇦 ZATCA Compliance Hub
The **ZATCA Hub** is the heart of your regulatory compliance. It provides an end-to-end wizard for Phase 2 integration.

````carousel
```mermaid
graph LR
    A[Business Profile] --> B[CSR & Keys]
    B --> C[ZATCA Integration]
    C --> D[Device Registration]
    D --> E[Go Live]
    style E fill:#10b981,stroke:#059669,color:#fff
```
<!-- slide -->
### Onboarding Wizard
The system handles the complex cryptographic handshake with ZATCA's Fatoora portal.
- **CSR Generation**: Automatic RSA key pair and CSR creation.
- **OTP Exchange**: Secure portal synchronization.
- **CSID Issuance**: Digital signature management.
````

---

## ⚖️ Accounting Integrity & Safety
The backend is hardened with strict financial rules:
- **Immutable Ledgers**: Submitted invoices and payments are locked from deletion.
- **Balanced Entries**: Journal Entries are validated for Debit/Credit equality before being recorded.
- **Audit Logs**: Every ZATCA interaction is logged with a cryptographic hash chain.

---

## 🚀 Infrastructure: OrbStack & Performance
The entire stack runs on **OrbStack Machines**, optimized for speed and reliability.

- **Frontend VM**: Managed by PM2 for 100% uptime.
- **Backend VM**: Managed by Supervisor with an indexed MariaDB for rapid queries.
- **Security**: Isolated networking between machines for maximum data safety.

---

## 🎬 System Interaction Recording
Watch the system in action, navigating through the ZATCA Hub and Financial Ledger:

![ZATCA Walkthrough](file:///Users/firoz/.gemini/antigravity/brain/427a8e73-49d3-42bb-809b-798f470cfc3b/zatca_dashboard_walkthrough_1778561202821.webp)
