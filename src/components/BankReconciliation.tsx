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
        <div className="lg:col-span-7">
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
                  className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Import
                </button>
              </div>
            </div>

            {bankTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center px-10">
                <div className="w-20 h-20 rounded-full bg-blue-500/5 flex items-center justify-center border border-blue-500/10 mb-6">
                  <Upload size={32} className="text-blue-400/50" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Statement Required</h4>
                <p className="text-muted text-sm max-w-xs italic">Upload your bank statement to begin matching.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={clsx(styles.table, styles.compactTable)}>
                  <thead>
                    <tr>
                      <th className="pl-5" style={{ width: '15%' }}>Date</th>
                      <th style={{ width: '45%' }}>Description</th>
                      <th className="text-right" style={{ width: '20%' }}>Amount</th>
                      <th className="text-right pr-5" style={{ width: '20%' }}>Match</th>
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
                        <td className="pl-5 text-[10px] font-mono text-muted/60">{tx.date}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-white text-[13px] tracking-tight truncate max-w-[180px]">{tx.description}</span>
                            {tx.matchedEntryId && (
                              <span className="text-[8px] text-emerald-400 font-bold uppercase mt-1 flex items-center gap-1">
                                <CheckCircle2 size={8} /> Auto-suggest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          <span className={clsx(
                            "px-2 py-0.5 rounded border font-mono text-[11px]",
                            tx.amount > 0 ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" : "text-red-400 bg-red-500/5 border-red-500/10"
                          )}>
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="pr-5 text-right">
                          {tx.matchedEntryId ? (
                            <button 
                              onClick={() => handleReconcile(idx)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase hover:bg-emerald-500/20 transition-all shadow-sm"
                            >
                              Confirm
                            </button>
                          ) : (
                            <span className="text-[9px] text-muted/30 italic">Manual</span>
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

        <div className="lg:col-span-5">
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

            <div className="p-4 space-y-3">
              {unreconciledEntries.length === 0 ? (
                <div className="py-20 text-center text-muted flex flex-col items-center gap-4">
                  <CheckCircle2 size={40} className="text-emerald-500/20" />
                  <p className="text-xs uppercase tracking-widest font-bold">Ledger is clean!</p>
                </div>
              ) : (
                unreconciledEntries.map(entry => {
                  const entryAmount = entry.lines.reduce((acc, l) => acc + (l.debit - l.credit), 0);
                  return (
                    <div key={entry.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-mono text-muted uppercase tracking-[0.2em]">{new Date(entry.date).toLocaleDateString()}</span>
                        <span className={clsx(
                          "font-mono font-bold text-xs",
                          entryAmount > 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {formatCurrency(entryAmount)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-2 leading-tight">{entry.description}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[8px] text-muted font-black uppercase">Ref: {entry.reference || 'N/A'}</span>
                        <button className="text-[8px] text-blue-400 font-black uppercase hover:text-blue-300 transition-colors">Match</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
