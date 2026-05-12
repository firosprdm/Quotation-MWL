/**
 * clear-data.mjs  (v2 — force delete via bench console)
 * Generates a Python script to run inside bench console that force-deletes all
 * GL Entries, Payment Entries, Sales Invoices, and Quotations in one shot.
 *
 * Run in two steps:
 *   Step 1: node scripts/clear-data.mjs > /tmp/clear_erp.py
 *   Step 2: bench --site [your-site] execute /tmp/clear_erp.py
 *
 * OR run via SSH directly (all on one line):
 *   cd ~/frappe-bench && bench --site $(bench --site list | head -1) execute <(node /path/to/clear-data.mjs)
 */

const script = `
import frappe

frappe.connect()

DOCTYPES_TO_CLEAR = [
    "GL Entry",
    "Payment Ledger Entry",
    "Payment Entry",
    "Sales Invoice",
    "Quotation",
    "Journal Entry",
]

for doctype in DOCTYPES_TO_CLEAR:
    try:
        records = frappe.get_all(doctype, fields=["name", "docstatus"], limit_page_length=0)
        print(f"\\n🔍 {doctype}: Found {len(records)} records")

        for r in records:
            try:
                doc = frappe.get_doc(doctype, r["name"])
                # Cancel submitted docs first
                if doc.docstatus == 1:
                    doc.flags.ignore_permissions = True
                    doc.cancel()
                    frappe.db.commit()
                # Force delete
                frappe.delete_doc(doctype, r["name"], force=True, ignore_permissions=True)
                frappe.db.commit()
                print(f"  🗑️  Deleted {r['name']}")
            except Exception as e:
                print(f"  ⚠️  Failed {r['name']}: {e}")
                frappe.db.rollback()

    except Exception as e:
        print(f"⚠️  Could not process {doctype}: {e}")

print("\\n✅ Cleanup complete! Company, Customer, and Item records preserved.")
`;

process.stdout.write(script);
