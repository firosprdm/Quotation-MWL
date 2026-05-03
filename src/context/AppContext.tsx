'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, InventoryItem, Quotation, AppState, CompanySettings, JournalEntry, Account } from '../types';
import { generateZatcaUUID, calculateInvoiceHash, generatePhase2TLV } from '@/lib/zatca-crypto';
import { generateUBL21XML } from '@/lib/ubl-generator';
import { signInvoiceAction } from '@/app/actions/zatca-sign';
import { supabase } from '@/lib/supabase';

interface AppContextType extends AppState {
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
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, inventoryRes, quotationsRes, accountsRes, journalRes, settingsRes] = await Promise.all([
          supabase.from('clients').select('*').order('createdAt', { ascending: false }),
          supabase.from('inventory').select('*').order('createdAt', { ascending: false }),
          supabase.from('quotations').select('*').order('date', { ascending: false }),
          supabase.from('accounts').select('*').order('code', { ascending: true }),
          supabase.from('journal_entries').select('*').order('date', { ascending: false }),
          supabase.from('company_settings').select('*').eq('id', 1).single()
        ]);

        let loadedData: Partial<AppState> = {
          clients: clientsRes.data || [],
          inventory: inventoryRes.data || [],
          quotations: quotationsRes.data || [],
          accounts: accountsRes.data || [],
          journalEntries: journalRes.data || [],
          settings: settingsRes.data || data.settings
        };

        // Automatic Migration from LocalStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && loadedData.clients?.length === 0 && loadedData.inventory?.length === 0 && loadedData.quotations?.length === 0) {
          console.log('Migrating data from localStorage to Supabase...');
          try {
            const parsed = JSON.parse(saved);
            
            if (parsed.clients?.length) await supabase.from('clients').insert(parsed.clients);
            if (parsed.inventory?.length) await supabase.from('inventory').insert(parsed.inventory);
            if (parsed.quotations?.length) await supabase.from('quotations').insert(parsed.quotations);
            if (parsed.accounts?.length) await supabase.from('accounts').insert(parsed.accounts);
            if (parsed.journalEntries?.length) await supabase.from('journal_entries').insert(parsed.journalEntries);
            if (parsed.settings) await supabase.from('company_settings').upsert({ id: 1, ...parsed.settings });
            
            loadedData = {
              clients: parsed.clients || [],
              inventory: parsed.inventory || [],
              quotations: parsed.quotations || [],
              accounts: parsed.accounts || [],
              journalEntries: parsed.journalEntries || [],
              settings: parsed.settings || data.settings
            };
          } catch (e) {
            console.error('Failed to parse saved data during migration', e);
          }
        }

        // Ensure defaults for accounts
        if (!loadedData.accounts || loadedData.accounts.length === 0) {
          await supabase.from('accounts').insert(DEFAULT_ACCOUNTS);
          loadedData.accounts = DEFAULT_ACCOUNTS;
        }

        if (!settingsRes.data) {
          await supabase.from('company_settings').upsert({ id: 1, ...data.settings });
        }

        setData(prev => ({ ...prev, ...(loadedData as AppState) }));
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
    await supabase.from('clients').insert(newClient);
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => (c.id === id ? { ...c, ...client } : c)),
    }));
    await supabase.from('clients').update(client).eq('id', id);
  };

  const deleteClient = async (id: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
    }));
    await supabase.from('clients').delete().eq('id', id);
  };

  const addItem = async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setData(prev => ({ ...prev, inventory: [newItem, ...prev.inventory] }));
    await supabase.from('inventory').insert(newItem);
  };

  const updateItem = async (id: string, item: Partial<InventoryItem>) => {
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => (i.id === id ? { ...i, ...item } : i)),
    }));
    await supabase.from('inventory').update(item).eq('id', id);
  };

  const deleteItem = async (id: string) => {
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== id),
    }));
    await supabase.from('inventory').delete().eq('id', id);
  };

  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'number'>) => {
    const number = `QT-${(data.quotations.length + 1).toString().padStart(4, '0')}`;
    const newQuotation: Quotation = {
      ...quotation,
      id: crypto.randomUUID(),
      number,
    };
    setData(prev => ({ ...prev, quotations: [newQuotation, ...prev.quotations] }));
    await supabase.from('quotations').insert(newQuotation);
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    // We compute the new state first so we can push it to Supabase
    let newQ: Quotation | undefined;
    let newEntriesToPush: JournalEntry[] = [];
    let accountsToUpdate: Account[] = [];

    setData(prev => {
      const qIndex = prev.quotations.findIndex(q => q.id === id);
      if (qIndex === -1) return prev;

      const oldQ = prev.quotations[qIndex];
      newQ = { ...oldQ, ...updates };
      const newQuotations = [...prev.quotations];
      newQuotations[qIndex] = newQ;

      let newJournalEntries = [...prev.journalEntries];
      let newAccounts = [...prev.accounts];

      const arAccount = newAccounts.find(a => a.code === '1200');
      const salesAccount = newAccounts.find(a => a.code === '4000');
      const cashAccount = newAccounts.find(a => a.code === '1000');
      
      const client = prev.clients.find(c => c.id === newQ!.clientId);
      const clientName = client ? client.name : 'Client';

      // 1. Invoice Recognition (When work is marked Done)
      const justFinishedWork = oldQ.workStatus !== 'Work Done' && newQ.workStatus === 'Work Done';
      if (justFinishedWork && arAccount && salesAccount) {
        const entryAmount = newQ.grandTotal || newQ.total;
        
        const newEntry: JournalEntry = {
          id: crypto.randomUUID(),
          date: Date.now(),
          description: `Invoice Generated - ${clientName}`,
          reference: newQ.number,
          lines: [
            { accountId: arAccount.id, debit: entryAmount, credit: 0 },
            { accountId: salesAccount.id, debit: 0, credit: entryAmount }
          ]
        };
        newJournalEntries.unshift(newEntry);
        newEntriesToPush.push(newEntry);
        
        const arIndex = newAccounts.findIndex(a => a.id === arAccount.id);
        const salesIndex = newAccounts.findIndex(a => a.id === salesAccount.id);
        newAccounts[arIndex] = { ...newAccounts[arIndex], balance: newAccounts[arIndex].balance + entryAmount };
        newAccounts[salesIndex] = { ...newAccounts[salesIndex], balance: newAccounts[salesIndex].balance + entryAmount };
        
        accountsToUpdate.push(newAccounts[arIndex], newAccounts[salesIndex]);
      }

      // 2. Payment Recognition (When payment is marked Done)
      const justPaid = oldQ.paymentStatus !== 'Done' && newQ.paymentStatus === 'Done';
      if (justPaid && arAccount && cashAccount) {
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
        
        const cashIndex = newAccounts.findIndex(a => a.id === cashAccount.id);
        const arIndex = newAccounts.findIndex(a => a.id === arAccount.id);
        
        newAccounts[cashIndex] = { ...newAccounts[cashIndex], balance: newAccounts[cashIndex].balance + entryAmount };
        newAccounts[arIndex] = { ...newAccounts[arIndex], balance: newAccounts[arIndex].balance - entryAmount };

        accountsToUpdate.push(newAccounts[cashIndex], newAccounts[arIndex]);
      }

      return {
        ...prev,
        quotations: newQuotations,
        journalEntries: newJournalEntries,
        accounts: newAccounts
      };
    });

    // Supabase push
    if (newQ) await supabase.from('quotations').update(updates).eq('id', id);
    if (newEntriesToPush.length > 0) await supabase.from('journal_entries').insert(newEntriesToPush);
    for (const acc of accountsToUpdate) {
      await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id);
    }
  };

  const deleteQuotation = async (id: string) => {
    setData(prev => ({
      ...prev,
      quotations: prev.quotations.filter(q => q.id !== id),
    }));
    await supabase.from('quotations').delete().eq('id', id);
  };

  const updateDefaultNotes = async (notes: string) => {
    setData(prev => ({ ...prev, defaultNotes: notes }));
    // Optional: add defaultNotes to settings if needed
  };

  const updateSettings = async (settings: CompanySettings) => {
    setData(prev => ({ ...prev, settings }));
    await supabase.from('company_settings').upsert({ id: 1, ...settings });
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    
    let accountsToUpdate: Account[] = [];

    setData(prev => {
      const updatedEntries = [newEntry, ...prev.journalEntries];
      let updatedAccounts = [...prev.accounts];
      
      newEntry.lines.forEach(line => {
        const accountIndex = updatedAccounts.findIndex(a => a.id === line.accountId);
        if (accountIndex !== -1) {
          const account = updatedAccounts[accountIndex];
          let balanceChange = 0;
          
          if (account.type === 'Asset' || account.type === 'Expense') {
            balanceChange = line.debit - line.credit;
          } else {
            balanceChange = line.credit - line.debit;
          }
          
          updatedAccounts[accountIndex] = {
            ...account,
            balance: account.balance + balanceChange
          };
          accountsToUpdate.push(updatedAccounts[accountIndex]);
        }
      });
      
      return {
        ...prev,
        journalEntries: updatedEntries,
        accounts: updatedAccounts
      };
    });

    await supabase.from('journal_entries').insert(newEntry);
    for (const acc of accountsToUpdate) {
      await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id);
    }
  };

  const addQuickTransaction = ({ type, amount, categoryAccountId, sourceAccountId, description }: { 
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

    addJournalEntry({
      date: Date.now(),
      description,
      reference: 'Quick Add',
      lines
    });
  };

  const finalizeInvoice = async (id: string) => {
    const qIndex = data.quotations.findIndex(q => q.id === id);
    if (qIndex === -1) return;

    const q = data.quotations[qIndex];
    if (q.uuid) return; // Already finalized

    const client = data.clients.find(c => c.id === q.clientId);
    if (!client) return;

    // 1. Calculate ICV (Invoice Counter Value)
    const finalizedInvoices = data.quotations.filter(quotation => !!quotation.uuid);
    const icv = finalizedInvoices.length + 1;

    // 2. Get PIH (Previous Invoice Hash)
    let pih = 'NWZob3Jh'; 
    if (finalizedInvoices.length > 0) {
      const lastInvoice = finalizedInvoices.sort((a, b) => (b.icv || 0) - (a.icv || 0))[0];
      pih = lastInvoice.invoiceHash || 'NWZob3Jh';
    }

    // 3. Generate UUID
    const uuid = generateZatcaUUID();

    // 4. Generate XML & Hash
    let xml = generateUBL21XML({
      quotation: q,
      client,
      settings: data.settings,
      pih,
      icv,
      uuid
    });

    const invoiceHash = await calculateInvoiceHash(xml);

    // 5. Sign the Hash (Phase 2)
    let signature = 'PHNpZ25hdHVyZT4='; // Placeholder
    let publicKey = 'PHB1YmxpY2tleT4='; // Placeholder

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

    // 6. Generate Phase 2 QR
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

    updateQuotation(id, {
      uuid,
      icv,
      pih,
      invoiceHash,
      qrCode,
      zatcaStatus: 'pending'
    });
  };

  return (
    <AppContext.Provider value={{ 
      ...data, 
      addClient, updateClient, deleteClient,
      addItem, updateItem, deleteItem,
      addQuotation, updateQuotation, deleteQuotation,
      updateDefaultNotes,
      updateSettings,
      addJournalEntry,
      addQuickTransaction,
      finalizeInvoice
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
