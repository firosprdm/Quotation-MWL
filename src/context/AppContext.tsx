'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, InventoryItem, Quotation, AppState, CompanySettings, JournalEntry, Account, FixedAsset, Employee, PayrollRecord } from '../types';
import { generateZatcaUUID, calculateInvoiceHash, generatePhase2TLV } from '@/lib/zatca-crypto';
import { generateUBL21XML } from '@/lib/ubl-generator';
import { signInvoiceAction } from '@/app/actions/zatca-sign';
import { supabase } from '@/lib/supabase';

interface AppContextType extends AppState {
  isLoaded: boolean;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  updateItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  
  addQuotation: (quotation: Omit<Quotation, 'id' | 'number'>) => void;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  
  updateDefaultNotes: (notes: string) => void;
  updateSettings: (settings: CompanySettings) => void;
  
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  addQuickTransaction: (params: { 
    type: 'income' | 'expense', 
    amount: number, 
    categoryAccountId: string, 
    sourceAccountId: string,
    description: string
  }) => void;
  finalizeInvoice: (id: string) => Promise<void>;
  
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addPayrollRecord: (record: Omit<PayrollRecord, 'id'>) => void;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;
  
  // Bank Recon & Fixed Assets
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  reconcileJournalEntry: (id: string, bankRef: string) => void;
  addFixedAsset: (asset: Omit<FixedAsset, 'id'>) => void;
  runDepreciation: (month: number, year: number) => void;
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
    inventory: [],
    quotations: [],
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
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          { data: clients }, 
          { data: inventory }, 
          { data: quotations }, 
          { data: accounts }, 
          { data: journalEntries },
          { data: employees },
          { data: payroll },
          { data: fixedAssets },
          { data: settings }
        ] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('quotations').select('*').order('date', { ascending: false }),
          supabase.from('accounts').select('*').order('code', { ascending: true }),
          supabase.from('journal_entries').select('*').order('date', { ascending: false }),
          supabase.from('employees').select('*'),
          supabase.from('payroll_records').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
          supabase.from('fixed_assets').select('*'),
          supabase.from('company_settings').select('*').single()
        ]);

        setData(prev => ({
          ...prev,
          clients: clients || [],
          inventory: inventory || [],
          quotations: quotations || [],
          accounts: accounts || [],
          journalEntries: journalEntries || [],
          employees: employees || [],
          payroll: payroll || [],
          fixedAssets: fixedAssets || [],
          settings: settings || prev.settings,
          defaultNotes: settings?.defaultNotes || prev.defaultNotes,
        }));
      } catch (e) {
        console.error('Failed to load data from Supabase', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setData(prev => ({ ...prev, clients: [newClient, ...prev.clients] }));
    const { error } = await supabase.from('clients').insert(newClient);
    if (error) throw error;
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => (c.id === id ? { ...c, ...client } : c)),
    }));
    const { error } = await supabase.from('clients').update(client).eq('id', id);
    if (error) throw error;
  };

  const deleteClient = async (id: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
    }));
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  };

  const addItem = async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setData(prev => ({ ...prev, inventory: [newItem, ...prev.inventory] }));
    const { error } = await supabase.from('inventory').insert(newItem);
    if (error) throw error;
  };

  const updateItem = async (id: string, item: Partial<InventoryItem>) => {
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => (i.id === id ? { ...i, ...item } : i)),
    }));
    const { error } = await supabase.from('inventory').update(item).eq('id', id);
    if (error) throw error;
  };

  const deleteItem = async (id: string) => {
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== id),
    }));
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw error;
  };

  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'number'>) => {
    const mwlQuotations = data.quotations.filter(q => q.number.startsWith('MWL-'));
    const maxNumber = mwlQuotations.reduce((max, q) => {
      const num = parseInt(q.number.split('-')[1]);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const number = `MWL-${(maxNumber + 1).toString().padStart(4, '0')}`;
    
    let invoiceNumber = quotation.invoiceNumber;
    if (!invoiceNumber && quotation.workStatus === 'Work Done') {
      const invQuotations = data.quotations.filter(q => q.invoiceNumber?.startsWith('INV-'));
      const maxInv = invQuotations.reduce((max, q) => {
        const num = parseInt(q.invoiceNumber!.split('-')[1]);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      invoiceNumber = `INV-${(maxInv + 1).toString().padStart(4, '0')}`;
    }

    const newQuotation: Quotation = {
      ...quotation,
      id: crypto.randomUUID(),
      number,
      invoiceNumber,
      status: quotation.status || 'sent',
      revision: quotation.revision || 0
    };
    setData(prev => ({ ...prev, quotations: [newQuotation, ...prev.quotations] }));
    
    await supabase.from('quotations').insert(newQuotation);
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    let newEntriesToPush: JournalEntry[] = [];
    let accountsToUpdate: Account[] = [];

    setData(prev => {
      const qIndex = prev.quotations.findIndex(q => q.id === id);
      if (qIndex === -1) return prev;

      const oldQ = prev.quotations[qIndex];
      const newQ = { ...oldQ, ...updates };
      
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

    const { error: qErr } = await supabase.from('quotations').update(updates).eq('id', id);
    if (qErr) throw qErr;

    if (newEntriesToPush.length > 0) {
      await supabase.from('journal_entries').insert(newEntriesToPush);
    }
    for (const acc of accountsToUpdate) {
      await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id);
    }
  };

  const deleteQuotation = async (id: string) => {
    setData(prev => ({
      ...prev,
      quotations: prev.quotations.filter(q => q.id !== id),
    }));
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) throw error;
  };

  const updateDefaultNotes = async (notes: string) => {
    setData(prev => ({ ...prev, defaultNotes: notes }));
    await supabase.from('company_settings').upsert({ id: 1, defaultNotes: notes });
  };

  const updateSettings = async (settings: CompanySettings) => {
    setData(prev => ({ ...prev, settings }));
    const { error } = await supabase.from('company_settings').upsert({ id: 1, ...settings });
    if (error) throw error;
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
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

    await supabase.from('journal_entries').insert(newEntry);
    for (const acc of accountsToUpdate) {
      await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id);
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
    const q = data.quotations.find(q => q.id === id);
    if (!q || q.uuid) return;

    const client = data.clients.find(c => c.id === q.clientId);
    if (!client) return;

    const finalizedInvoices = data.quotations.filter(quotation => !!quotation.uuid);
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

    let signature = 'PHNpZ25hdHVyZT4=';
    let publicKey = 'PHB1YmxpY2tleT4=';

    if (data.settings.zatca?.onboarded && data.settings.zatca.privateKey) {
      const signResult = await signInvoiceAction({
        hash: invoiceHash,
        privateKey: data.settings.zatca.privateKey
      });
      if (signResult.success) {
        signature = signResult.signature!;
        publicKey = signResult.publicKey!;
      }
    }

    const qrCode = generatePhase2TLV({
      sellerName: data.settings.name,
      vatNumber: data.settings.vatNumber,
      timestamp: new Date(q.invoiceDate || q.date).toISOString(),
      total: q.grandTotal.toFixed(2),
      vatTotal: q.vatAmount.toFixed(2),
      xmlHash: invoiceHash,
      signature,
      publicKey,
    });

    await updateQuotation(id, {
      uuid,
      icv,
      pih,
      invoiceHash,
      qrCode,
      zatcaStatus: 'pending'
    });
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    const newEmployee = { ...employee, id: crypto.randomUUID() };
    setData(prev => ({ ...prev, employees: [...prev.employees, newEmployee] }));
    const { error } = await supabase.from('employees').insert(newEmployee);
    if (error) throw error;
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    setData(prev => ({ ...prev, employees: prev.employees.map(e => e.id === id ? { ...e, ...employee } : e) }));
    const { error } = await supabase.from('employees').update(employee).eq('id', id);
    if (error) throw error;
  };

  const deleteEmployee = async (id: string) => {
    setData(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
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

      return {
        ...prev,
        payroll: [...prev.payroll, newRecord],
        accounts: newAccounts,
        journalEntries: newEntries
      };
    });

    await supabase.from('payroll_records').insert(newRecord);
    if (entriesToPush.length > 0) {
      await supabase.from('journal_entries').insert(entriesToPush);
    }
    for (const acc of accountsToUpdate) {
      await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id);
    }
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
      }

      return { ...prev, payroll: newPayroll, accounts: newAccounts, journalEntries: newEntries };
    });

    await supabase.from('payroll_records').update(updates).eq('id', id);
    if (entriesToPush.length > 0) {
      await supabase.from('journal_entries').insert(entriesToPush);
    }
    for (const acc of accountsToUpdate) {
      await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id);
    }
  };

  const updateJournalEntry = async (id: string, updates: Partial<JournalEntry>) => {
    setData(prev => ({
      ...prev,
      journalEntries: prev.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
    await supabase.from('journal_entries').update(updates).eq('id', id);
  };

  const reconcileJournalEntry = async (id: string, bankRef: string) => {
    await updateJournalEntry(id, { reconciled: true, bankRef });
  };

  const addFixedAsset = async (asset: Omit<FixedAsset, 'id'>) => {
    const newAsset = { ...asset, id: crypto.randomUUID() };
    setData(prev => ({ ...prev, fixedAssets: [...prev.fixedAssets, newAsset] }));
    await supabase.from('fixed_assets').insert(newAsset);
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

    if (entriesToPush.length > 0) {
      await supabase.from('journal_entries').insert(entriesToPush);
    }
    for (const acc of accountsToUpdate) {
      await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id);
    }
  };

  return (
    <AppContext.Provider value={{ 
      ...data, 
      isLoaded,
      addClient, updateClient, deleteClient,
      addItem, updateItem, deleteItem,
      addQuotation, updateQuotation, deleteQuotation,
      updateDefaultNotes,
      updateSettings,
      addJournalEntry,
      addQuickTransaction,
      finalizeInvoice,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addPayrollRecord,
      updatePayrollRecord,
      updateJournalEntry,
      reconcileJournalEntry,
      addFixedAsset,
      runDepreciation
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
