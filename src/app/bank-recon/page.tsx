'use client';

import React, { useState } from 'react';
import { 
  Banknote, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Search,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/format';
import styles from './bank-recon.module.css';

interface TransactionMatch {
  transaction: {
    date: string;
    description: string;
    amount: number;
    type: string;
  };
  suggestedMatch: any | null;
  otherOptions: any[];
  status?: 'matched' | 'unmatched' | 'confirmed';
}

export default function BankReconPage() {
  const [matches, setMatches] = useState<TransactionMatch[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const transactions = data.map((row: any) => ({
          date: row.Date || row.date || row.Date_Value || '',
          description: row.Description || row.description || row.Narrative || '',
          amount: parseFloat(row.Amount || row.amount || row.Credit || row.Debit || '0') * (row.Debit ? -1 : 1),
          type: row.Amount > 0 ? 'CR' : 'DR'
        })).filter(t => t.description && t.amount !== 0);

        setIsReconciling(true);
        const res = await fetch('/api/v1/bank/reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions })
        });
        const matchedData = await res.json();
        setMatches(matchedData);
      } catch (err) {
        alert('Error processing file: ' + err);
      } finally {
        setIsUploading(false);
        setIsReconciling(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmMatch = (index: number) => {
    const newMatches = [...matches];
    newMatches[index].status = 'confirmed';
    setMatches(newMatches);
  };

  return (
    <div className="fade-in">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="premium-title">Bank Reconciliation</h2>
          <p className="premium-subtitle">Match your bank statements with ERPNext ledger entries.</p>
        </div>
        
        <div className="flex gap-4">
          <input 
            type="file" 
            id="bank-upload" 
            className="hidden" 
            onChange={handleFileUpload} 
            accept=".csv,.xlsx,.xls" 
          />
          <label 
            htmlFor="bank-upload" 
            className="glass-button bg-blue-500/10 text-blue-400 border-blue-500/20 cursor-pointer"
          >
            <Upload size={20} />
            <span>Upload Bank Statement</span>
          </label>
        </div>
      </header>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 glass-panel rounded-[32px] border-dashed border-white/10">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/5 flex items-center justify-center text-blue-400/50 mb-6">
            <Banknote size={40} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No Statement Active</h3>
          <p className="text-muted max-w-sm text-center">Upload a CSV or Excel export from your bank to begin the smart reconciliation process.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-6">
            <p className="text-sm font-medium text-slate-400">
              Found <span className="text-white">{matches.length}</span> transactions. 
              Smart Match suggested <span className="text-emerald-400">{matches.filter(m => m.suggestedMatch).length}</span> pairings.
            </p>
            <button 
              onClick={() => setMatches([])}
              className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
            >
              <RotateCcw size={14} /> Reset Workspace
            </button>
          </div>

          <div className="space-y-4">
            {matches.map((match, idx) => (
              <div 
                key={idx} 
                className={clsx(
                  "glass-panel p-6 flex items-center gap-8 border-l-4 transition-all duration-300",
                  match.status === 'confirmed' ? "border-l-emerald-500 opacity-60" :
                  match.suggestedMatch ? "border-l-blue-500" : "border-l-amber-500/50"
                )}
              >
                <div className="w-1/3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{match.transaction.date}</p>
                  <p className="text-white font-medium mb-1 truncate" title={match.transaction.description}>
                    {match.transaction.description}
                  </p>
                  <p className={clsx(
                    "text-xl font-mono font-semibold",
                    match.transaction.amount > 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {formatCurrency(match.transaction.amount)}
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight size={24} className="text-slate-600" />
                </div>

                <div className="flex-1 flex items-center gap-4">
                  {match.suggestedMatch ? (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex-1 flex items-center justify-between group hover:border-blue-500/40 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={14} className="text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Recommended Match</span>
                        </div>
                        <p className="text-white font-medium">{match.suggestedMatch.partner_name || 'Unknown Client'}</p>
                        <p className="text-sm text-slate-400">{match.suggestedMatch.name} · {match.suggestedMatch.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-mono text-white">{formatCurrency(match.suggestedMatch.amount_total)}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">LEDGER AMOUNT</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 flex-1 flex flex-col items-center justify-center text-slate-500">
                      <AlertCircle size={20} className="mb-1" />
                      <span className="text-[12px] font-medium">No Direct Match Found</span>
                    </div>
                  )}
                </div>

                <div className="w-32 flex justify-end">
                  {match.status === 'confirmed' ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-widest">
                      <Check size={16} /> Reconciled
                    </div>
                  ) : (
                    <button 
                      onClick={() => confirmMatch(idx)}
                      disabled={!match.suggestedMatch}
                      className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        match.suggestedMatch 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white" 
                          : "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed"
                      )}
                    >
                      <Check size={24} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
