'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import styles from '@/app/bank-recon/bank-recon.module.css';

interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  ref?: string;
  matchedEntryId?: string;
}

export function BankReconciliation() {
  const { journalEntries, accounts, reconcileJournalEntry } = useApp();
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

      const mapped = jsonData.map(row => {
        const date = row.Date || row.date || row.TransactionDate || '';
        const desc = row.Description || row.desc || row.Details || '';
        const amount = row.Amount || row.amount || (row.Credit - row.Debit) || (row.Deposit - row.Withdrawal) || 0;
        
        const match = journalEntries.find(entry => {
          if (entry.reconciled) return false;
          const entryAmount = entry.lines.reduce((acc, l) => acc + (l.debit - l.credit), 0);
          const absAmount = Math.abs(amount);
          const entryAbsAmount = Math.abs(entryAmount);
          return Math.abs(absAmount - entryAbsAmount) < 0.01;
        });

        return {
          date,
          description: desc,
          amount: parseFloat(amount),
          ref: row.Reference || row.ref || '',
          matchedEntryId: match?.id
        };
      });

      setBankTransactions(mapped);
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReconcile = (index: number) => {
    const tx = bankTransactions[index];
    if (tx.matchedEntryId) {
      reconcileJournalEntry(tx.matchedEntryId, tx.ref || 'Bank Match');
      const newTx = [...bankTransactions];
      newTx.splice(index, 1);
      setBankTransactions(newTx);
    }
  };

  const unreconciledEntries = journalEntries.filter(e => !e.reconciled);

  return (
    <div className="animate-in fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="glass-panel min-h-[400px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <ShieldCheck className="text-blue-400" size={24} />
                Bank Transactions
              </h3>
              <div className="flex gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls"
                />
                <button 
                  className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import Bank Transactions"
                >
                  <Upload size={16} />
                </button>
              </div>
            </div>

            {bankTransactions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-medium text-sm text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all min-w-[180px] shadow-sm"
                >
                  <Upload size={18} /> Upload Statement
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-20 text-muted/30">
                        <Upload size={32} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xs uppercase tracking-widest font-normal">No transactions imported</p>
                      </td>
                    </tr>
                  ) : (
                    bankTransactions.map((tx, idx) => (
                      <tr key={idx} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5">
                        <td className="font-mono text-muted/60 whitespace-nowrap">{tx.date}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-white">{tx.description}</span>
                            {tx.matchedEntryId && (
                              <span className="text-emerald-400 uppercase mt-1 flex items-center gap-1 text-[10px]">
                                <CheckCircle2 size={10} /> Auto-suggest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={clsx("text-right font-mono", tx.amount > 0 ? "text-emerald-400" : "text-red-400")}>
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="text-right">
                          {tx.matchedEntryId ? (
                            <button 
                              onClick={() => handleReconcile(idx)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase hover:bg-emerald-500/20 transition-all shadow-sm"
                            >
                              Confirm
                            </button>
                          ) : (
                            <span className="text-muted/30 italic uppercase">Manual</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="glass-panel min-h-[400px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-purple-500/[0.02]">
              <h3 className="text-xl font-black flex items-center gap-3">
                <FileText className="text-purple-400" size={24} />
                Unreconciled
              </h3>
              <span className="text-xs font-medium text-muted uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                {bankTransactions.length} Imported
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Ref</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unreconciledEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-muted">
                        Ledger is clean!
                      </td>
                    </tr>
                  ) : (
                    unreconciledEntries.map(entry => {
                      const entryAmount = entry.lines.reduce((acc, l) => acc + (l.debit - l.credit), 0);
                      return (
                        <tr key={entry.id} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5">
                          <td className="font-mono text-muted/60 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="text-white">{entry.description}</td>
                          <td className="text-muted/60 whitespace-nowrap">{entry.reference || 'N/A'}</td>
                          <td className={clsx("text-right font-mono", entryAmount > 0 ? "text-emerald-400" : "text-red-400")}>
                            {formatCurrency(entryAmount)}
                          </td>
                          <td className="text-right">
                            <button className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase hover:bg-blue-500/20 transition-all shadow-sm">Match</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
