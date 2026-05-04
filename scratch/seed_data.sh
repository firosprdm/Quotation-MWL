#!/bin/bash

URL="https://oindsvfulahcfazozpay.supabase.co"
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbmRzdmZ1bGFoY2Zhem96cGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTk5NzgsImV4cCI6MjA5MzI5NTk3OH0.1FlA2q_OZXDqQK-Wiw7TeTEnlek-tW1vXeewMeOgJ0Y"

# Helper to send POST requests
send_post() {
  local table=$1
  local data=$2
  curl -s -X POST "$URL/rest/v1/$table" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Helper to send PATCH requests
send_patch() {
  local table=$1
  local id=$2
  local data=$3
  curl -s -X PATCH "$URL/rest/v1/$table?id=eq.$id" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Cleanup
echo "Cleaning up..."
curl -s -X DELETE "$URL/rest/v1/journal_entries?id=neq.0" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"

# JAN: Investment (200k) + Loan (100k) + Equipment (20k + 3k VAT)
echo "Seeding January..."
send_post "journal_entries" '[
  {"date": 1704067200000, "description": "Initial Capital Investment", "reference": "CAP-01", "lines": [{"accountId": "acc-2", "debit": 200000, "credit": 0}, {"accountId": "acc-7", "debit": 0, "credit": 200000}]},
  {"date": 1704412800000, "description": "Bank Loan Received", "reference": "LOAN-01", "lines": [{"accountId": "acc-2", "debit": 100000, "credit": 0}, {"accountId": "acc-loan-01", "debit": 0, "credit": 100000}]},
  {"date": 1704844800000, "description": "Office Equipment Purchase", "reference": "PUR-01", "lines": [{"accountId": "acc-26", "debit": 20000, "credit": 0}, {"accountId": "acc-14", "debit": 3000, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 23000}]}
]'

# FEB: Rent (10k) + Revenue (50k + 7.5k VAT)
echo "Seeding February..."
send_post "journal_entries" '[
  {"date": 1706745600000, "description": "Monthly Office Rent", "reference": "EXP-01", "lines": [{"accountId": "acc-11", "debit": 10000, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 10000}]},
  {"date": 1707955200000, "description": "Service Revenue - Phase 1", "reference": "INV-01", "lines": [{"accountId": "acc-2", "debit": 57500, "credit": 0}, {"accountId": "acc-9", "debit": 0, "credit": 50000}, {"accountId": "acc-6", "debit": 0, "credit": 7500}]}
]'

# MAR: Salaries (30k) + Interest (0.5k)
echo "Seeding March..."
send_post "journal_entries" '[
  {"date": 1709251200000, "description": "Staff Salaries", "reference": "SAL-01", "lines": [{"accountId": "acc-17", "debit": 30000, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 30000}]},
  {"date": 1710460800000, "description": "Loan Interest", "reference": "INT-01", "lines": [{"accountId": "acc-11", "debit": 500, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 500}]}
]'

# APR: Software (2k) + Revenue (100k + 15k VAT)
echo "Seeding April..."
send_post "journal_entries" '[
  {"date": 1712275200000, "description": "Software Subscription", "reference": "EXP-02", "lines": [{"accountId": "acc-11", "debit": 2000, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 2000}]},
  {"date": 1713571200000, "description": "Project Alpha Revenue", "reference": "INV-02", "lines": [{"accountId": "acc-2", "debit": 115000, "credit": 0}, {"accountId": "acc-9", "debit": 0, "credit": 100000}, {"accountId": "acc-6", "debit": 0, "credit": 15000}]}
]'

# MAY: Utilities (1.5k) + Marketing (5k)
echo "Seeding May..."
send_post "journal_entries" '[
  {"date": 1715299200000, "description": "Utilities", "reference": "UTIL-01", "lines": [{"accountId": "acc-11", "debit": 1500, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 1500}]},
  {"date": 1716595200000, "description": "Digital Marketing", "reference": "MKT-01", "lines": [{"accountId": "acc-11", "debit": 5000, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 5000}]}
]'

# JUN: Loan Repayment (10k) + Revenue (25k + 3.75k VAT)
echo "Seeding June..."
send_post "journal_entries" '[
  {"date": 1718409600000, "description": "Loan Repayment", "reference": "PAY-01", "lines": [{"accountId": "acc-loan-01", "debit": 10000, "credit": 0}, {"accountId": "acc-2", "debit": 0, "credit": 10000}]},
  {"date": 1719532800000, "description": "Project Beta Revenue", "reference": "INV-03", "lines": [{"accountId": "acc-2", "debit": 28750, "credit": 0}, {"accountId": "acc-9", "debit": 0, "credit": 25000}, {"accountId": "acc-6", "debit": 0, "credit": 3750}]}
]'

echo "Updating account balances..."
# Bank (acc-2): 200k + 100k - 23k - 10k + 57.5k - 30k - 0.5k - 2k + 115k - 1.5k - 5k - 10k + 28.5k = 419k
send_patch "accounts" "acc-2" '{"balance": 419000}'
# Revenue (acc-9): 50k + 100k + 25k = 175k
send_patch "accounts" "acc-9" '{"balance": 175000}'
# VAT Output (acc-6): 7.5k + 15k + 3.75k = 26.25k
send_patch "accounts" "acc-6" '{"balance": 26250}'
# VAT Input (acc-14): 3k
send_patch "accounts" "acc-14" '{"balance": 3000}'
# Salaries (acc-17): 30k
send_patch "accounts" "acc-17" '{"balance": 30000}'
# Opex (acc-11): 10k + 0.5k + 2k + 1.5k + 5k = 19k
send_patch "accounts" "acc-11" '{"balance": 19000}'
# Loan (acc-loan-01): 100k - 10k = 90k
send_patch "accounts" "acc-loan-01" '{"balance": 90000}'
# Equipment (acc-26): 20k
send_patch "accounts" "acc-26" '{"balance": 20000}'
# Equity (acc-7): 200k
send_patch "accounts" "acc-7" '{"balance": 200000}'

echo "Seeding complete!"
