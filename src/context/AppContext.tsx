'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, InventoryItem, Quotation, AppState, CompanySettings, JournalEntry, Account, FixedAsset, Employee, PayrollRecord, GlobalDateFilter, PaymentReceipt, Expense, ExpenseProduct, Supplier, PurchaseInvoice } from '../types';
import { generateZatcaUUID, calculateInvoiceHash, generatePhase2TLV } from '@/lib/zatca-crypto';
import { generateUBL21XML } from '@/lib/ubl-generator';
import { signInvoiceAction } from '@/app/actions/zatca-sign';
// ---------------------------------------------------------------------------
// Local-storage helpers for HR / Payroll / Assets / Settings
// (ERPNext routes are only wired for Clients, Inventory, Quotations)
// ---------------------------------------------------------------------------
const LS_KEY = 'mwl_local_data';



interface AppContextType extends AppState {
  isLoaded: boolean;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => Promise<void>;
  updateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  
  addQuotation: (quotation: Omit<Quotation, 'id' | 'number'>) => Promise<void>;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Quotation>) => Promise<void>;
  invoices: Quotation[];
  loadMoreQuotations: () => Promise<void>;
  
  loadMoreInventory: () => Promise<void>;
  
  dateFilter: GlobalDateFilter;
  setDateFilter: (filter: GlobalDateFilter) => void;
  
  updateDefaultNotes: (notes: string) => Promise<void>;
  updateSettings: (settings: CompanySettings) => Promise<void>;
  
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  addQuickTransaction: (params: { 
    type: 'income' | 'expense', 
    amount: number, 
    categoryAccountId: string, 
    sourceAccountId: string,
    description: string
  }) => void;
  finalizeInvoice: (id: string) => Promise<void>;
  clearInvoiceWithZATCA: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addPayrollRecord: (record: Omit<PayrollRecord, 'id'>) => Promise<void>;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => Promise<void>;
  
  // Bank Recon & Fixed Assets
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  reconcileJournalEntry: (id: string, bankRef: string) => Promise<void>;
  addFixedAsset: (asset: Omit<FixedAsset, 'id'>) => Promise<void>;
  runDepreciation: (month: number, year: number) => Promise<void>;
  
  addPaymentReceipt: (receipt: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'createdAt'>) => Promise<void>;
  
  addExpense: (expense: Omit<Expense, 'id' | 'status' | 'totalAmount'>, receipt?: { data: string }) => Promise<void>;
  updateExpenseStatus: (id: string, action: 'submit' | 'approve' | 'refuse') => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  addPurchaseInvoice: (invoice: Omit<PurchaseInvoice, 'id' | 'number'>) => Promise<void>;
  updatePurchaseInvoice: (id: string, invoice: Partial<PurchaseInvoice>) => Promise<void>;
  deletePurchaseInvoice: (id: string) => Promise<void>;
  
  importData: (json: any) => Promise<void>;
  exportData: () => any;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  schemaWarning: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'quotation_app_data';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Cash', type: 'Asset', balance: 0, code: '1000' },
  { id: 'acc-2', name: 'Bank Account', type: 'Asset', balance: 0, code: '1010' },
  { id: 'acc-3', name: 'Accounts Receivable', type: 'Asset', balance: 0, code: '1200' },
  { id: 'acc-12', name: 'Retention Receivable', type: 'Asset', balance: 0, code: '1210' },
  { id: 'acc-4', name: 'Inventory Asset', type: 'Asset', balance: 0, code: '1300' },
  { id: 'acc-13', name: 'Work in Progress (WIP)', type: 'Asset', balance: 0, code: '1400' },
  { id: 'acc-14', name: 'VAT Input (15%)', type: 'Asset', balance: 0, code: '1500' },
  { id: 'acc-5', name: 'Accounts Payable', type: 'Liability', balance: 0, code: '2000' },
  { id: 'acc-15', name: 'Progress Billings', type: 'Liability', balance: 0, code: '2100' },
  { id: 'acc-6', name: 'VAT Output (15%)', type: 'Liability', balance: 0, code: '2200' },
  { id: 'acc-16', name: 'Unearned Revenue (Advances)', type: 'Liability', balance: 0, code: '2300' },
  { id: 'acc-7', name: 'Owner\'s Equity', type: 'Equity', balance: 0, code: '3000' },
  { id: 'acc-8', name: 'Retained Earnings', type: 'Equity', balance: 0, code: '3100' },
  { id: 'acc-9', name: 'Project Revenue', type: 'Revenue', balance: 0, code: '4000' },
  { id: 'acc-10', name: 'Cost of Goods Sold', type: 'Expense', balance: 0, code: '5000' },
  { id: 'acc-11', name: 'Operating Expenses', type: 'Expense', balance: 0, code: '6000' },
  { id: 'acc-17', name: 'Salaries & Benefits', type: 'Expense', balance: 0, code: '6100' },
  { id: 'acc-21', name: 'Rent Expense', type: 'Expense', balance: 0, code: '6200' },
  { id: 'acc-22', name: 'Utilities (Elec/Water)', type: 'Expense', balance: 0, code: '6300' },
  { id: 'acc-23', name: 'Marketing & Ads', type: 'Expense', balance: 0, code: '6400' },
  { id: 'acc-24', name: 'Office Supplies', type: 'Expense', balance: 0, code: '6500' },
  { id: 'acc-18', name: 'Accrued Salaries', type: 'Liability', balance: 0, code: '2400' },
  { id: 'acc-19', name: 'GOSI Payable', type: 'Liability', balance: 0, code: '2500' },
  { id: 'acc-20', name: 'EOSB Provision', type: 'Liability', balance: 0, code: '2600' },
  { id: 'acc-25', name: 'Furniture & Fixtures', type: 'Asset', balance: 0, code: '1600' },
  { id: 'acc-26', name: 'Office Equipment', type: 'Asset', balance: 0, code: '1610' },
  { id: 'acc-28', name: 'Accumulated Depreciation', type: 'Asset', balance: 0, code: '1690' }, // Contra-asset
  { id: 'acc-29', name: 'Depreciation Expense', type: 'Expense', balance: 0, code: '5100' },
  { id: 'acc-27', name: 'Zakat/Tax Payable', type: 'Liability', balance: 0, code: '2700' },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppState>({
    clients: [],
    suppliers: [],
    inventory: [],
    quotations: [],
    invoices: [],
    purchaseInvoices: [],
    defaultNotes: '1. Payment: 50% Advance, 50% on completion.\n2. Validity: As per selection.\n3. Delivery: Within 7 days of order.',
    settings: {
      name: 'MARINA WORLDLINK',
      address: 'King Fahd Road, Al Olaya District, Riyadh, Saudi Arabia',
      splitAddress: {
        buildingNumber: '1234',
        streetName: 'King Fahd Road',
        district: 'Al Olaya',
        city: 'Riyadh',
        postalCode: '12211',
        countryCode: 'SA'
      },
      vatNumber: '300000000000003',
      crNumber: '1010000000',
      contact: '+966 11 000 0000',
      salesPerson: 'Admin User',
      zatca: {
        onboarded: false,
      }
    },
    accounts: [...DEFAULT_ACCOUNTS],
    journalEntries: [],
    employees: [],
    payroll: [],
    fixedAssets: [],
    paymentReceipts: [],
    expenses: [],
    expenseProducts: [],
    dateFilter: '1M',
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [dateFilter, setDateFilter] = useState<GlobalDateFilter>('1M');
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [schemaWarning, setSchemaWarning] = useState<string[]>([]);



  useEffect(() => {
    const savedUser = localStorage.getItem('marina_user');
    if (savedUser) {
      try {
        setData(prev => ({ ...prev, currentUser: JSON.parse(savedUser) }));
      } catch (e) {
        localStorage.removeItem('marina_user');
      }
    }
  }, []);

  // Load from ERPNext API
  useEffect(() => {
    const loadData = async () => {
      console.log('AppProvider: Starting data load from ERPNext...');
      setIsLoaded(false);
      try {
        const endpoints = [
          '/api/v1/erpnext/clients',
          '/api/v1/erpnext/inventory',
          '/api/v1/erpnext/quotations',
          '/api/v1/erpnext/accounts',
          '/api/v1/erpnext/employees',
          '/api/v1/erpnext/journal-entries',
          '/api/v1/erpnext/expenses',
          '/api/v1/erpnext/expense-products',
          '/api/v1/erpnext/settings',
          '/api/v1/erpnext/payroll',
          '/api/v1/erpnext/fixed-assets',
          '/api/v1/erpnext/payments',
          '/api/v1/erpnext/invoices',
          '/api/v1/erpnext/suppliers',
          '/api/v1/erpnext/purchase-invoices'
        ];

        const results = await Promise.all(endpoints.map(async (ep) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
            
            const r = await fetch(ep, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!r.ok) {
              console.warn(`Fetch failed for ${ep}: ${r.status}`);
              return null;
            }
            return await r.json();
          } catch (err: any) {
            console.error(`Error fetching ${ep}:`, err.name === 'AbortError' ? 'Timeout' : err);
            return null;
          }
        }));

        const [
          clientsRes, inventoryRes, quotationsRes, accountsRes, 
          employeesRes, journalRes, expensesRes, expenseProductsRes, 
          settingsRes, payrollRes, assetsRes, paymentsRes, invoicesRes,
          suppliersRes, purchaseInvoicesRes
        ] = results;

        console.log('AppProvider: Data load completed. Inventory count:', Array.isArray(inventoryRes) ? inventoryRes.length : 0);

        setData(prev => ({
          ...prev,
          clients: Array.isArray(clientsRes) ? clientsRes : [],
          inventory: Array.isArray(inventoryRes) ? inventoryRes : [],
          quotations: Array.isArray(quotationsRes) ? quotationsRes : [],
          accounts: Array.isArray(accountsRes) ? accountsRes : prev.accounts,
          employees: Array.isArray(employeesRes) ? employeesRes : prev.employees,
          journalEntries: Array.isArray(journalRes) ? journalRes : prev.journalEntries,
          expenses: Array.isArray(expensesRes) ? expensesRes : [],
          expenseProducts: Array.isArray(expenseProductsRes) ? expenseProductsRes : [],
          payroll: Array.isArray(payrollRes) ? payrollRes : [],
          fixedAssets: Array.isArray(assetsRes) ? assetsRes : [],
          paymentReceipts: Array.isArray(paymentsRes) ? paymentsRes : [],
          invoices: Array.isArray(invoicesRes) ? invoicesRes : [],
          suppliers: Array.isArray(suppliersRes) ? suppliersRes : [],
          purchaseInvoices: Array.isArray(purchaseInvoicesRes) ? purchaseInvoicesRes : [],
          settings: (settingsRes && !settingsRes.error) ? {
            ...prev.settings,
            ...settingsRes,
            name: settingsRes.name || settingsRes.companyName || prev.settings.name,
            vatNumber: settingsRes.vatNumber || prev.settings.vatNumber,
            address: settingsRes.address || prev.settings.address,
            contact: settingsRes.contact || prev.settings.contact,
            crNumber: settingsRes.crNumber || prev.settings.crNumber,
            splitAddress: settingsRes.splitAddress || prev.settings.splitAddress,
            defaultNotes: settingsRes.defaultNotes || prev.settings.defaultNotes,
          } : prev.settings,
          defaultNotes: settingsRes?.defaultNotes || prev.defaultNotes,
        }));
      } catch (e) {
        console.error('AppProvider: Critical error during data load:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [dateFilter]);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/v1/erpnext/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
    if (!res.ok) throw new Error('Failed to add client');
    const newClient = await res.json();
    newClient.createdAt = Date.now();
    setData(prev => ({ ...prev, clients: [newClient, ...prev.clients] }));
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    const res = await fetch('/api/v1/erpnext/clients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...client })
    });
    if (!res.ok) throw new Error('Failed to update client');
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => (c.id === id ? { ...c, ...client } : c)),
    }));
  };

  const deleteClient = async (id: string) => {
    const res = await fetch(`/api/erpnext/clients?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete client');
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
    }));
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/v1/erpnext/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier)
    });
    if (!res.ok) throw new Error('Failed to add supplier');
    const newSupplier = await res.json();
    newSupplier.createdAt = Date.now();
    setData(prev => ({ ...prev, suppliers: [newSupplier, ...prev.suppliers] }));
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    const res = await fetch('/api/v1/erpnext/suppliers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...supplier })
    });
    if (!res.ok) throw new Error('Failed to update supplier');
    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => (s.id === id ? { ...s, ...supplier } : s)),
    }));
  };

  const deleteSupplier = async (id: string) => {
    const res = await fetch(`/api/erpnext/suppliers?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete supplier');
    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id),
    }));
  };

  const addItem = async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/v1/erpnext/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add item');
    const newItem = await res.json();
    newItem.createdAt = Date.now();
    setData(prev => ({ ...prev, inventory: [newItem, ...prev.inventory] }));
  };

  const updateItem = async (id: string, item: Partial<InventoryItem>) => {
    const res = await fetch('/api/v1/erpnext/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...item })
    });
    if (!res.ok) throw new Error('Failed to update item');
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => (i.id === id ? { ...i, ...item } : i)),
    }));
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/erpnext/inventory?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete item');
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== id),
    }));
  };

  const loadMoreInventory = async () => {
    // Already loading all active inventory from ERPNext API
  };

  const loadMoreQuotations = async () => {
    // Already loading 1000 from ERPNext API
  };

  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'number'>) => {
    if (quotation.items) {
      quotation.items = await Promise.all(quotation.items.map(async item => {
        if (!item.descriptionAr && item.description) {
           try {
             const res = await fetch('/api/v1/translate', { method: 'POST', body: JSON.stringify({ text: item.description }) });
             if (res.ok) {
               const data = await res.json();
               if (data.translatedText) item.descriptionAr = data.translatedText;
             }
           } catch (e) {}
        }
        return item;
      }));
    }
    const mwlQuotations = data.quotations.filter(q => q.number.startsWith('MWL-'));
    const maxNumber = mwlQuotations.reduce((max, q) => {
      const num = parseInt(q.number.split('-')[1]);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const number = `MWL-${(maxNumber + 1).toString().padStart(4, '0')}`;
    
    const newQuotation: Quotation = {
      ...quotation,
      id: crypto.randomUUID(),
      number,
      invoiceNumber: quotation.invoiceNumber || undefined,
      status: quotation.status || 'sent',
      revision: quotation.revision || 0
    };
    setData(prev => ({ ...prev, quotations: [newQuotation, ...prev.quotations] }));
    
    try {
      const res = await fetch('/api/v1/erpnext/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuotation)
      });
      if (!res.ok) console.error('Failed to save quotation to ERPNext');
    } catch (error) {
      console.error('ERPNext Insert Error:', error);
    }
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    if (updates.items) {
      updates.items = await Promise.all(updates.items.map(async item => {
        if (!item.descriptionAr && item.description) {
           try {
             const res = await fetch('/api/v1/translate', { method: 'POST', body: JSON.stringify({ text: item.description }) });
             if (res.ok) {
               const data = await res.json();
               if (data.translatedText) item.descriptionAr = data.translatedText;
             }
           } catch (e) {}
        }
        return item;
      }));
    }
    
    let newEntriesToPush: JournalEntry[] = [];
    let accountsToUpdate: Account[] = [];

    setData(prev => {
      const qIndex = prev.quotations.findIndex(q => q.id === id);
      if (qIndex === -1) return prev;

      const oldQ = prev.quotations[qIndex];
      const newQ = { ...oldQ, ...updates };
      
      // Invoice number will be generated only during ZATCA Finalization.
      const newQuotations = [...prev.quotations];
      newQuotations[qIndex] = newQ;

      let newJournalEntries = [...prev.journalEntries];
      let newAccounts = [...prev.accounts];

      const arAccount = newAccounts.find(a => a.code === '1200');
      const salesAccount = newAccounts.find(a => a.code === '4000');
      const cashAccount = newAccounts.find(a => a.code === '1000');
      
      const client = prev.clients.find(c => c.id === newQ.clientId);
      const clientName = client ? client.name : 'Client';

      if (oldQ.workStatus !== 'Work Done' && newQ.workStatus === 'Work Done' && arAccount && salesAccount) {
        const vatAccount = newAccounts.find(a => a.code === '2200'); // VAT Output
        const totalAmount = newQ.grandTotal || newQ.total;
        const vatAmount = newQ.vatAmount || 0;
        const netAmount = totalAmount - vatAmount;
        
        const lines = [
          { accountId: arAccount.id, debit: totalAmount, credit: 0 },
          { accountId: salesAccount.id, debit: 0, credit: netAmount }
        ];
        
        if (vatAmount > 0 && vatAccount) {
          lines.push({ accountId: vatAccount.id, debit: 0, credit: vatAmount });
        }

        const newEntry: JournalEntry = {
          id: crypto.randomUUID(),
          date: Date.now(),
          description: `Invoice Generated - ${clientName}`,
          reference: newQ.number,
          lines
        };
        newJournalEntries.unshift(newEntry);
        newEntriesToPush.push(newEntry);
        
        const arIdx = newAccounts.findIndex(a => a.id === arAccount.id);
        const salesIdx = newAccounts.findIndex(a => a.id === salesAccount.id);
        newAccounts[arIdx] = { ...newAccounts[arIdx], balance: newAccounts[arIdx].balance + totalAmount };
        newAccounts[salesIdx] = { ...newAccounts[salesIdx], balance: newAccounts[salesIdx].balance + netAmount };
        accountsToUpdate.push(newAccounts[arIdx], newAccounts[salesIdx]);

        if (vatAmount > 0 && vatAccount) {
          const vatIdx = newAccounts.findIndex(a => a.id === vatAccount.id);
          newAccounts[vatIdx] = { ...newAccounts[vatIdx], balance: newAccounts[vatIdx].balance + vatAmount };
          accountsToUpdate.push(newAccounts[vatIdx]);
        }
      }

      if (oldQ.paymentStatus !== 'Done' && newQ.paymentStatus === 'Done' && arAccount && cashAccount) {
        const entryAmount = newQ.grandTotal || newQ.total;
        const newEntry: JournalEntry = {
          id: crypto.randomUUID(),
          date: Date.now(),
          description: `Payment Received - ${clientName}`,
          reference: newQ.number,
          lines: [
            { accountId: cashAccount.id, debit: entryAmount, credit: 0 },
            { accountId: arAccount.id, debit: 0, credit: entryAmount }
          ]
        };
        newJournalEntries.unshift(newEntry);
        newEntriesToPush.push(newEntry);
        
        const cashIdx = newAccounts.findIndex(a => a.id === cashAccount.id);
        const arIdx = newAccounts.findIndex(a => a.id === arAccount.id);
        newAccounts[cashIdx] = { ...newAccounts[cashIdx], balance: newAccounts[cashIdx].balance + entryAmount };
        newAccounts[arIdx] = { ...newAccounts[arIdx], balance: newAccounts[arIdx].balance - entryAmount };
        accountsToUpdate.push(newAccounts[cashIdx], newAccounts[arIdx]);
      }

      return {
        ...prev,
        quotations: newQuotations,
        journalEntries: newJournalEntries,
        accounts: newAccounts
      };
    });

    // 2. Prepare DB updates
    const dbUpdates: any = { ...updates };
    
    // Mapping subject to projectName if it exists
    if ('subject' in dbUpdates) {
      dbUpdates.projectName = dbUpdates.subject;
    }
    
    if (Object.keys(dbUpdates).length > 0) {
      try {
        console.log('Attempting ERPNext update for quotation', id, 'Payload:', dbUpdates);
        logAction('Update Quotation', `ID: ${id} updated with ${Object.keys(dbUpdates).join(', ')}`);
        const res = await fetch('/api/v1/erpnext/quotations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...dbUpdates, modified_by: data.currentUser?.name })
        });
        if (!res.ok) {
          const errData = await res.json();
          console.error('ERPNext Update Error:', errData.error || res.statusText);
        } else {
          console.log('ERPNext update successful for quotation', id);
        }
      } catch (err: any) {
        console.error('Failed to save quotation status to database:', err.message);
      }
    }

    // Push associated changes (financials) - Using ERPNext backend

    // Auto-create Sales Invoice when Work Done + PO Received
    const currentQ = data.quotations.find(q => q.id === id);
    const newWorkStatus = (updates as any).workStatus || currentQ?.workStatus;
    const newSalesStatus = (updates as any).salesStatus || currentQ?.salesStatus;
    
    // Auto-create Sales Invoice when both statuses are met and no invoice exists yet
    const hasInvoice = data.invoices.some((inv: any) => inv.quotationRef === currentQ?.number);

    if (!hasInvoice && newWorkStatus === 'Work Done' && newSalesStatus === 'PO recieved') {
      console.log(`Auto-creating Sales Invoice for quotation ${id}...`);
      fetch('/api/v1/erpnext/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentQ?.clientId,
          date: currentQ?.invoiceDate || currentQ?.date || Date.now(),
          dueDate: currentQ?.dueDate || Date.now() + 30 * 86400000,
          items: (currentQ?.items || []).filter((it: any) => !it._isWorkflowMetadata),
          subtotal: currentQ?.subtotal || 0,
          vatRate: 15,
          vatAmount: currentQ?.vatAmount || 0,
          total: currentQ?.total || 0,
          discount: currentQ?.discount || 0,
          grandTotal: currentQ?.grandTotal || 0,
          notes: currentQ?.notes || '',
          poNumber: currentQ?.poNumber || '',
          ticketNumber: currentQ?.ticketNumber || '',
          subject: currentQ?.subject || '',
          quotationRef: currentQ?.number,
          mwlStatus: 'draft',
        })
      }).then(async res => {
        if (res.ok) {
          const inv = await res.json();
          console.log(`✅ Auto-invoice created: ${inv.id} from quotation ${id}`);
          setData(prev => ({
            ...prev,
            invoices: [{ ...currentQ, id: inv.id, invoiceId: inv.id, invoiceNumber: inv.id, quotationRef: currentQ?.number, mwlStatus: 'draft', isCreditNote: false }, ...((prev as any).invoices || [])]
          }));
        } else {
          console.warn('Auto-invoice creation failed:', await res.text());
        }
      }).catch(err => console.error('Auto-invoice error:', err.message));
    }
  };

  const deleteQuotation = async (id: string) => {
    const res = await fetch(`/api/erpnext/quotations?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete quotation');
    setData(prev => ({
      ...prev,
      quotations: prev.quotations.filter(q => q.id !== id),
    }));
  };

  const updateDefaultNotes = async (notes: string) => {
    setData(prev => ({ ...prev, defaultNotes: notes }));
    // Store in ERPNext via settings endpoint
    try {
      await fetch('/api/v1/erpnext/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultNotes: notes })
      });
    } catch (e) {
      console.error('Failed to sync notes to database');
    }
  };

  const logAction = async (action: string, details: string) => {
    console.log(`[Audit Log] ${action}: ${details}`);
    try {
      await fetch('/api/v1/erpnext/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: data.currentUser?.name || 'Unknown',
          action,
          details,
          timestamp: Date.now()
        })
      });
    } catch (e) {
      console.warn('Failed to sync audit log to server');
    }
  };

  const updateSettings = async (newSettings: CompanySettings) => {
    setData(prev => ({ ...prev, settings: newSettings }));
    logAction('Update Settings', `Company metadata updated by ${data.currentUser?.name}`);
    try {
      await fetch('/api/v1/erpnext/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {
      console.error('Failed to sync settings to database');
    }
  };


  const addJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    try {
      const res = await fetch('/api/v1/erpnext/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const erpnextData = await res.json();
      
      const newEntry: JournalEntry = {
        ...entry,
        id: erpnextData.id || crypto.randomUUID(),
      };
      
      let accountsToUpdate: Account[] = [];

      setData(prev => {
        let updatedAccounts = [...prev.accounts];
        newEntry.lines.forEach(line => {
          const idx = updatedAccounts.findIndex(a => a.id === line.accountId);
          if (idx !== -1) {
            const acc = updatedAccounts[idx];
            const change = (acc.type === 'Asset' || acc.type === 'Expense') 
              ? (line.debit - line.credit) 
              : (line.credit - line.debit);
            updatedAccounts[idx] = { ...acc, balance: acc.balance + change };
            accountsToUpdate.push(updatedAccounts[idx]);
          }
        });
        return { ...prev, journalEntries: [newEntry, ...prev.journalEntries], accounts: updatedAccounts };
      });
    } catch (e) {
      console.error('Failed to add journal entry to ERPNext', e);
    }
  };

  const addQuickTransaction = async ({ type, amount, categoryAccountId, sourceAccountId, description }: { 
    type: 'income' | 'expense', 
    amount: number, 
    categoryAccountId: string, 
    sourceAccountId: string,
    description: string
  }) => {
    const lines = type === 'expense' 
      ? [
          { accountId: categoryAccountId, debit: amount, credit: 0 },
          { accountId: sourceAccountId, debit: 0, credit: amount }
        ]
      : [
          { accountId: sourceAccountId, debit: amount, credit: 0 },
          { accountId: categoryAccountId, debit: 0, credit: amount }
        ];

    await addJournalEntry({
      date: Date.now(),
      description,
      reference: 'Quick Add',
      lines
    });
  };

  const finalizeInvoice = async (id: string) => {
    const q = data.invoices.find(q => q.id === id);
    if (!q || q.uuid) return;

    const client = data.clients.find(c => c.id === q.clientId);
    if (!client) return;

    const finalizedInvoices = data.invoices.filter(invoice => !!invoice.uuid);
    const icv = finalizedInvoices.length + 1;
    const pih = finalizedInvoices.length > 0 ? finalizedInvoices.sort((a, b) => (b.icv || 0) - (a.icv || 0))[0].invoiceHash || 'NWZob3Jh' : 'NWZob3Jh';
    const uuid = generateZatcaUUID();

    let xml = generateUBL21XML({
      quotation: q,
      client,
      settings: data.settings,
      pih,
      icv,
      uuid
    });

    const invoiceHash = await calculateInvoiceHash(xml);

    let invoiceNumber = q.invoiceNumber;
    if (!invoiceNumber) {
      const invInvoices = data.invoices.filter(invoice => invoice.invoiceNumber?.startsWith('INV-'));
      const maxInv = invInvoices.reduce((max, invoice) => {
        const parts = invoice.invoiceNumber!.split('-');
        const num = parseInt(parts[parts.length - 1]);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const currentYear = new Date(q.invoiceDate || q.date).getFullYear();
      invoiceNumber = `INV-${currentYear}-${(maxInv + 1).toString().padStart(4, '0')}`;
    }

    // Note: To properly update the invoice, we should call an updateInvoice method, 
    // but since AppContext uses updateQuotation for legacy compatibility, we need to update the API call.
    // However, we should try to call the invoices API directly here.
    try {
      await fetch('/api/v1/erpnext/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          uuid,
          icv,
          pih,
          invoiceHash,
          invoiceNumber,
          zatcaStatus: 'pending_clearance'
        })
      });
      
      // Update local state
      setData(prev => ({
        ...prev,
        invoices: prev.invoices.map(inv => inv.id === id ? {
          ...inv, uuid, icv, pih, invoiceHash, invoiceNumber, zatcaStatus: 'pending_clearance'
        } : inv)
      }));
    } catch (e) {
      console.error('Failed to finalize invoice in ERPNext', e);
    }
  };

  const clearInvoiceWithZATCA = async (id: string) => {
    const q = data.invoices.find(q => q.id === id);
    if (!q) return { success: false, error: 'Invoice not found' };

    const client = data.clients.find(c => c.id === q.clientId);
    if (!client) return { success: false, error: 'Client not found' };

    if (!data.settings.zatca?.onboarded || !data.settings.zatca.privateKey) {
      return { success: false, error: 'ZATCA Onboarding not complete. Please go to Settings and complete the onboarding process first.' };
    }

    try {
      const response = await fetch('/api/v1/zatca/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation: q,
          client,
          settings: data.settings,
          pih: q.pih,
          icv: q.icv
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        try {
          await fetch('/api/v1/erpnext/invoices', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              qrCode: result.data.qrCode,
              invoiceHash: result.data.invoiceHash,
              zatcaStatus: 'cleared'
            })
          });
          
          setData(prev => ({
            ...prev,
            invoices: prev.invoices.map(inv => inv.id === id ? {
              ...inv,
              qrCode: result.data.qrCode,
              invoiceHash: result.data.invoiceHash,
              zatcaStatus: 'cleared'
            } : inv)
          }));
        } catch (e) {
          console.error('Failed to save ZATCA clearance status', e);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || 'ZATCA Clearance failed' };
      }
    } catch (error: any) {
      console.error('ZATCA Clearance API Error:', error);
      return { success: false, error: error.message || 'ZATCA API request failed' };
    }
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    try {
      const res = await fetch('/api/v1/erpnext/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });
      const erpnextData = await res.json();
      
      const newEmployee = { ...employee, id: erpnextData.id || crypto.randomUUID() };
      setData(prev => {
        const updated = [...prev.employees, newEmployee];
        return { ...prev, employees: updated };
      });
    } catch (e) {
      console.error('Failed to add employee to ERPNext', e);
    }
  };

  const addPaymentReceipt = async (receipt: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'createdAt'>) => {
    const maxReceipt = data.paymentReceipts.reduce((max, r) => {
      const num = parseInt(r.receiptNumber.split('-')[2]);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    
    const currentYear = new Date().getFullYear();
    const receiptNumber = `RCP-${currentYear}-${(maxReceipt + 1).toString().padStart(4, '0')}`;
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const createdAt = Date.now();
    
    const newReceipt: PaymentReceipt = {
      ...receipt,
      id,
      receiptNumber,
      createdAt
    };
    
    // Update local state for receipt
    setData(prev => ({
      ...prev,
      paymentReceipts: [newReceipt, ...prev.paymentReceipts]
    }));
    
    // Calculate all updates first to batch state update
    const invoiceUpdates: Record<string, any> = {};
    receipt.allocations.forEach(alloc => {
      const inv = data.quotations.find(q => q.id === alloc.invoiceId);
      if (inv) {
        const newReceived = (inv.receivedAmount || 0) + alloc.amount;
        const isFullyPaid = newReceived >= inv.grandTotal - 0.01;
        invoiceUpdates[alloc.invoiceId] = {
          receivedAmount: newReceived,
          paymentStatus: isFullyPaid ? 'Done' : 'partial'
        };
      }
    });

    // Update local state + sync invoice payment status to ERPNext
    setData(prev => ({
      ...prev,
      quotations: prev.quotations.map(q => invoiceUpdates[q.id] ? { ...q, ...invoiceUpdates[q.id] } : q)
    }));

    for (const [invId, updates] of Object.entries(invoiceUpdates)) {
      fetch('/api/v1/erpnext/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invId, ...updates })
      }).catch(e => console.warn('ERPNext invoice update failed:', e));
    }
    
    // Post Payment to ERPNext
    fetch('/api/v1/erpnext/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReceipt)
    }).catch(e => console.warn('ERPNext payment sync failed:', e));
    
    // Add Journal Entry (this will also go to ERPNext via the addJournalEntry method)
    const accountsReceivable = data.accounts.find(a => a.code === '1200')?.id || ''; // Accounts Receivable
    const cashOrBank = receipt.paymentMethod === 'Cash' 
      ? (data.accounts.find(a => a.code === '1000')?.id || '') // Cash
      : (data.accounts.find(a => a.code === '1010')?.id || ''); // Bank Account
      
    if (accountsReceivable && cashOrBank) {
      const invoiceList = receipt.allocations.map(a => {
        const q = data.quotations.find(inv => inv.id === a.invoiceId);
        return q ? q.invoiceNumber : a.invoiceId;
      }).join(', ');

      await addJournalEntry({
        date: receipt.paymentDate,
        description: `Payment Receipt ${receiptNumber} for invoices: ${invoiceList}`,
        reference: receipt.bankReference || receiptNumber,
        lines: [
          { accountId: cashOrBank, debit: receipt.amountReceived, credit: 0 },
          { accountId: accountsReceivable, debit: 0, credit: receipt.amountReceived }
        ]
      });
    }
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    setData(prev => {
      const updated = prev.employees.map(e => e.id === id ? { ...e, ...employee } : e);
      return { ...prev, employees: updated };
    });
    fetch('/api/v1/erpnext/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...employee })
    }).catch(e => console.error('ERPNext sync failed:', e));
  };



  const deleteEmployee = async (id: string) => {
    setData(prev => {
      const updated = prev.employees.filter(e => e.id !== id);
      return { ...prev, employees: updated };
    });
    fetch(`/api/erpnext/employees?id=${id}`, { method: 'DELETE' }).catch(e => console.error('ERPNext sync failed:', e));
  };

  const addPayrollRecord = async (record: Omit<PayrollRecord, 'id'>) => {
    const id = crypto.randomUUID();
    const newRecord = { ...record, id };
    
    let entriesToPush: JournalEntry[] = [];
    let accountsToUpdate: Account[] = [];

    setData(prev => {
      let newAccounts = [...prev.accounts];
      let newEntries = [...prev.journalEntries];

      const expenseAcc = newAccounts.find(a => a.code === '6100'); // Salaries & Benefits
      const gosiAcc = newAccounts.find(a => a.code === '2500'); // GOSI Payable
      const payableAcc = newAccounts.find(a => a.code === '2400'); // Accrued Salaries
      
      const emp = prev.employees.find(e => e.id === record.employeeId);
      const gross = record.basicSalary + record.housingAllowance + record.transportAllowance + record.otherAllowances;

      if (expenseAcc && payableAcc && gosiAcc) {
        const jEntry: JournalEntry = {
          id: crypto.randomUUID(),
          date: Date.now(),
          description: `Payroll Generated - ${emp?.name || 'Employee'} (${record.month}/${record.year})`,
          reference: `PAY-${record.year}-${record.month}`,
          lines: [
            { accountId: expenseAcc.id, debit: gross, credit: 0 },
            { accountId: gosiAcc.id, debit: 0, credit: record.gosiDeduction },
            { accountId: payableAcc.id, debit: 0, credit: record.netSalary }
          ]
        };
        newEntries.unshift(jEntry);
        entriesToPush.push(jEntry);

        const expIdx = newAccounts.findIndex(a => a.id === expenseAcc.id);
        const gosiIdx = newAccounts.findIndex(a => a.id === gosiAcc.id);
        const payIdx = newAccounts.findIndex(a => a.id === payableAcc.id);

        newAccounts[expIdx] = { ...newAccounts[expIdx], balance: newAccounts[expIdx].balance + gross };
        newAccounts[gosiIdx] = { ...newAccounts[gosiIdx], balance: newAccounts[gosiIdx].balance + record.gosiDeduction };
        newAccounts[payIdx] = { ...newAccounts[payIdx], balance: newAccounts[payIdx].balance + record.netSalary };
        accountsToUpdate.push(newAccounts[expIdx], newAccounts[gosiIdx], newAccounts[payIdx]);
      }

      const newPayroll = [...prev.payroll, newRecord];
      return {
        ...prev,
        payroll: newPayroll,
        accounts: newAccounts,
        journalEntries: newEntries
      };
    });

    // Sync to ERPNext
    fetch('/api/v1/erpnext/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).catch(e => console.error('ERPNext Payroll sync failed:', e));
  };

  const updatePayrollRecord = async (id: string, updates: Partial<PayrollRecord>) => {
    let entriesToPush: JournalEntry[] = [];
    let accountsToUpdate: Account[] = [];

    setData(prev => {
      const pIdx = prev.payroll.findIndex(p => p.id === id);
      if (pIdx === -1) return prev;
      
      const oldP = prev.payroll[pIdx];
      const newP = { ...oldP, ...updates };
      
      const newPayroll = [...prev.payroll];
      newPayroll[pIdx] = newP;

      let newAccounts = [...prev.accounts];
      let newEntries = [...prev.journalEntries];

      if (oldP.status !== 'Paid' && newP.status === 'Paid') {
        const payableAcc = newAccounts.find(a => a.code === '2400'); // Accrued Salaries
        const cashAcc = newAccounts.find(a => a.code === '1000'); // Cash
        const emp = prev.employees.find(e => e.id === newP.employeeId);

        if (payableAcc && cashAcc) {
          const jEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: Date.now(),
            description: `Salary Paid - ${emp?.name || 'Employee'} (${newP.month}/${newP.year})`,
            reference: `PAY-OUT-${newP.year}-${newP.month}`,
            lines: [
              { accountId: payableAcc.id, debit: newP.netSalary, credit: 0 },
              { accountId: cashAcc.id, debit: 0, credit: newP.netSalary }
            ]
          };
          newEntries.unshift(jEntry);
          entriesToPush.push(jEntry);

          const payIdx = newAccounts.findIndex(a => a.id === payableAcc.id);
          const cashIdx = newAccounts.findIndex(a => a.id === cashAcc.id);
          newAccounts[payIdx] = { ...newAccounts[payIdx], balance: newAccounts[payIdx].balance - newP.netSalary };
          newAccounts[cashIdx] = { ...newAccounts[cashIdx], balance: newAccounts[cashIdx].balance - newP.netSalary };
          accountsToUpdate.push(newAccounts[payIdx], newAccounts[cashIdx]);
        }
      } else if (oldP.status === 'Paid' && newP.status !== 'Paid') {
        // Reversal logic for accidental payment marking
        const payableAcc = newAccounts.find(a => a.code === '2400');
        const cashAcc = newAccounts.find(a => a.code === '1000');
        const emp = prev.employees.find(e => e.id === newP.employeeId);

        if (payableAcc && cashAcc) {
          const jEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: Date.now(),
            description: `Salary Payment Reversed - ${emp?.name || 'Employee'} (${newP.month}/${newP.year})`,
            reference: `PAY-REV-${newP.year}-${newP.month}`,
            lines: [
              { accountId: cashAcc.id, debit: newP.netSalary, credit: 0 },
              { accountId: payableAcc.id, debit: 0, credit: newP.netSalary }
            ]
          };
          newEntries.unshift(jEntry);
          entriesToPush.push(jEntry);

          const payIdx = newAccounts.findIndex(a => a.id === payableAcc.id);
          const cashIdx = newAccounts.findIndex(a => a.id === cashAcc.id);
          newAccounts[payIdx] = { ...newAccounts[payIdx], balance: newAccounts[payIdx].balance + newP.netSalary };
          newAccounts[cashIdx] = { ...newAccounts[cashIdx], balance: newAccounts[cashIdx].balance + newP.netSalary };
          accountsToUpdate.push(newAccounts[payIdx], newAccounts[cashIdx]);
        }
      }

      return { ...prev, payroll: newPayroll, accounts: newAccounts, journalEntries: newEntries };
    });
  };

  const updateJournalEntry = async (id: string, updates: Partial<JournalEntry>) => {
    setData(prev => {
      const updated = prev.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e);
      return { ...prev, journalEntries: updated };
    });
  };

  const reconcileJournalEntry = async (id: string, bankRef: string) => {
    await updateJournalEntry(id, { reconciled: true, bankRef });
  };

  const addFixedAsset = async (asset: Omit<FixedAsset, 'id'>) => {
    const newAsset = { ...asset, id: crypto.randomUUID() };
    setData(prev => ({
      ...prev,
      fixedAssets: [...prev.fixedAssets, newAsset]
    }));

    // Sync to ERPNext
    fetch('/api/v1/erpnext/fixed-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAsset)
    }).catch(e => console.error('ERPNext Asset sync failed:', e));
  };

  const runDepreciation = async (month: number, year: number) => {
    let entriesToPush: JournalEntry[] = [];
    let accountsToUpdate: Account[] = [];

    setData(prev => {
      let newAccounts = [...prev.accounts];
      let newEntries = [...prev.journalEntries];

      prev.fixedAssets.forEach(asset => {
        if (asset.status !== 'Active') return;
        
        // Calculate monthly depreciation
        const monthlyDep = (asset.cost - asset.salvageValue) / (asset.usefulLife * 12);
        
        const expenseAcc = newAccounts.find(a => a.id === asset.depreciationExpenseAccountId);
        const accumAcc = newAccounts.find(a => a.id === asset.accumulatedDepreciationAccountId);

        if (expenseAcc && accumAcc) {
          const jEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: new Date(year, month - 1, 28).getTime(),
            description: `Depreciation - ${asset.name} (${month}/${year})`,
            reference: `DEP-${asset.id.slice(0,4)}`,
            lines: [
              { accountId: expenseAcc.id, debit: monthlyDep, credit: 0 },
              { accountId: accumAcc.id, debit: 0, credit: monthlyDep }
            ]
          };
          newEntries.unshift(jEntry);
          entriesToPush.push(jEntry);

          const expIdx = newAccounts.findIndex(a => a.id === expenseAcc.id);
          const accIdx = newAccounts.findIndex(a => a.id === accumAcc.id);
          newAccounts[expIdx] = { ...newAccounts[expIdx], balance: newAccounts[expIdx].balance + monthlyDep };
          newAccounts[accIdx] = { ...newAccounts[accIdx], balance: newAccounts[accIdx].balance - monthlyDep }; // Contra-asset
          accountsToUpdate.push(newAccounts[expIdx], newAccounts[accIdx]);
        }
      });

      return { ...prev, journalEntries: newEntries, accounts: newAccounts };
    });
  };

  const exportData = () => {
    return {
      ...data,
      settings: data.settings,
      defaultNotes: data.defaultNotes
    };
  };

  const importData = async (json: any) => {
    if (!json || typeof json !== 'object') return;
    
    // Restore all state from JSON
    setData(prev => ({
      ...prev,
      ...json,
      ...(json.settings && { settings: json.settings }),
      ...(json.defaultNotes && { defaultNotes: json.defaultNotes }),
    }));



    // Re-sync clients, inventory, quotations to ERPNext in bulk
    // (fire-and-forget — UI already has the data)
    const erpnextSyncs = [
      ...(json.clients || []).map((c: any) =>
        fetch('/api/v1/erpnext/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }).catch(() => {})
      ),
      ...(json.inventory || []).map((i: any) =>
        fetch('/api/v1/erpnext/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) }).catch(() => {})
      ),
      ...(json.quotations || []).map((q: any) =>
        fetch('/api/v1/erpnext/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) }).catch(() => {})
      ),
    ];
    await Promise.allSettled(erpnextSyncs);
  };

  const login = (username: string, password: string): boolean => {
    if (username === 'Afrin@1989' && password === 'Afrin@1989') {
      const user: any = { username, role: 'admin', name: 'Afrin' };
      setData(prev => ({ ...prev, currentUser: user }));
      localStorage.setItem('marina_user', JSON.stringify(user));
      return true;
    }
    if (username === 'Marina@2026' && password === 'Marina@2026') {
      const user: any = { username, role: 'user', name: 'Marina User' };
      setData(prev => ({ ...prev, currentUser: user }));
      localStorage.setItem('marina_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setData(prev => ({ ...prev, currentUser: undefined }));
    localStorage.removeItem('marina_user');
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'status' | 'totalAmount'>, receipt?: { data: string }) => {
    const res = await fetch('/api/v1/erpnext/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expense, receipt })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to add expense');
    }
    // Refresh all expenses from ERPNext to get accurate computed values
    const refreshed = await fetch('/api/v1/erpnext/expenses').then(r => r.json());
    if (Array.isArray(refreshed)) {
      setData(prev => ({ ...prev, expenses: refreshed }));
    }
  };

  const updateExpenseStatus = async (id: string, action: 'submit' | 'approve' | 'refuse') => {
    const res = await fetch('/api/v1/erpnext/expenses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    if (!res.ok) throw new Error('Failed to update expense status');
    
    // Refresh expenses after update to get latest states from ERPNext
    const refreshed = await fetch('/api/v1/erpnext/expenses').then(r => r.json());
    if (Array.isArray(refreshed)) {
      setData(prev => ({ ...prev, expenses: refreshed }));
    }
  };

  const deleteExpense = async (id: string) => {
    const res = await fetch(`/api/erpnext/expenses?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  const addPurchaseInvoice = async (invoice: Omit<PurchaseInvoice, 'id' | 'number'>) => {
    const res = await fetch('/api/v1/erpnext/purchase-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    if (!res.ok) throw new Error('Failed to add purchase invoice');
    const created = await res.json();
    const newInvoice = { ...invoice, id: created.id, number: created.id } as PurchaseInvoice;
    setData(prev => ({ ...prev, purchaseInvoices: [newInvoice, ...prev.purchaseInvoices] }));
  };

  const updatePurchaseInvoice = async (id: string, invoice: Partial<PurchaseInvoice>) => {
    const res = await fetch('/api/v1/erpnext/purchase-invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...invoice })
    });
    if (!res.ok) throw new Error('Failed to update purchase invoice');
    setData(prev => ({
      ...prev,
      purchaseInvoices: prev.purchaseInvoices.map(inv => (inv.id === id ? { ...inv, ...invoice } : inv)),
    }));
  };

  const deletePurchaseInvoice = async (id: string) => {
    const res = await fetch(`/api/erpnext/purchase-invoices?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete purchase invoice');
    setData(prev => ({
      ...prev,
      purchaseInvoices: prev.purchaseInvoices.filter(inv => inv.id !== id),
    }));
  };

  // ── Invoice CRUD ───────────────────────────────────────────────────────────
  const addInvoice = async (invoice: any) => {
    const res = await fetch('/api/v1/erpnext/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create invoice');
    }
    const created = await res.json();
    const newInvoice = { ...invoice, id: created.id, invoiceId: created.id, invoiceNumber: created.id };
    setData(prev => ({ ...prev, invoices: [newInvoice, ...(prev as any).invoices || []] }));
    return created;
  };

  const updateInvoice = async (id: string, updates: any) => {
    const res = await fetch('/api/v1/erpnext/invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update invoice');
    }
    setData(prev => ({
      ...prev,
      invoices: ((prev as any).invoices || []).map((inv: any) => inv.id === id ? { ...inv, ...updates } : inv)
    }));
  };

  const deleteInvoice = async (id: string) => {
    const res = await fetch(`/api/erpnext/invoices?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete invoice');
    }
    setData(prev => ({ ...prev, invoices: ((prev as any).invoices || []).filter((inv: any) => inv.id !== id) }));
  };

  const createInvoiceFromQuotation = async (quotationId: string) => {
    const q = data.quotations.find(q => q.id === quotationId);
    if (!q) throw new Error('Quotation not found');
    return addInvoice({
      clientId: q.clientId,
      date: q.invoiceDate || q.date || Date.now(),
      dueDate: q.dueDate || Date.now() + 30 * 86400000,
      items: (q.items || []).filter((it: any) => !it._isWorkflowMetadata),
      subtotal: q.subtotal || 0,
      vatRate: 15,
      vatAmount: q.vatAmount || 0,
      total: q.total || 0,
      discount: q.discount || 0,
      grandTotal: q.grandTotal || 0,
      notes: q.notes || '',
      termsAndConditions: q.termsAndConditions || '',
      poNumber: q.poNumber || '',
      ticketNumber: q.ticketNumber || '',
      subject: q.subject || '',
      quotationRef: q.number,
      mwlStatus: 'draft',
      status: 'approved',
      salesStatus: 'PO recieved',
      workStatus: 'Work Done',
    });
  };

  const createCreditNote = async (invoiceId: string, reason: string) => {
    const res = await fetch('/api/v1/erpnext/invoices/credit-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create credit note');
    }
    const created = await res.json();
    // Refresh invoices list
    const refreshed = await fetch('/api/v1/erpnext/invoices').then(r => r.json()).catch(() => null);
    if (Array.isArray(refreshed)) {
      setData(prev => ({ ...prev, invoices: refreshed }));
    }
    return created;
  };

  return (
    <AppContext.Provider value={{ 
      ...data,
      invoices: (data as any).invoices || [],
      isLoaded,
      addClient, updateClient, deleteClient,
      addItem, updateItem, deleteItem,
      addQuotation, updateQuotation, deleteQuotation,
      loadMoreQuotations, loadMoreInventory,
      dateFilter, setDateFilter,
      updateDefaultNotes,
      updateSettings,
      addJournalEntry,
      addQuickTransaction,
      finalizeInvoice,
      clearInvoiceWithZATCA,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addPayrollRecord,
      updatePayrollRecord,
      updateJournalEntry,
      reconcileJournalEntry,
      addFixedAsset,
      runDepreciation,
      addPaymentReceipt,
      addExpense,
      updateExpenseStatus,
      deleteExpense,
      addSupplier, updateSupplier, deleteSupplier,
      addPurchaseInvoice, updatePurchaseInvoice, deletePurchaseInvoice,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      createInvoiceFromQuotation,
      createCreditNote,
      importData,
      exportData,
      login,
      logout,
      performIntegrityCheck: async () => {
        console.log('Running Data Integrity Check...');
        try {
          const res = await fetch('/api/v1/erpnext/clients');
          const serverData = await res.json();
          if (serverData.length !== data.clients.length) {
            console.warn(`Data Drift Detected: Server has ${serverData.length} clients, local has ${data.clients.length}`);
            return false;
          }
          return true;
        } catch (e) {
          return false;
        }
      },
      schemaWarning
    } as any}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
