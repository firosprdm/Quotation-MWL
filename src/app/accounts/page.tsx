'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  BookOpen,
  FileText,
  Plus,
  Zap,
  Check,
  Sparkles,
  Download,
  Upload,
  FileUp
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { clsx } from 'clsx';
import { JournalEntryForm } from '@/components/JournalEntryForm';
import { QuickAddModal } from '@/components/QuickAddModal';
import { BankReconciliation } from '@/components/BankReconciliation';
import { FixedAssetRegister } from '@/components/FixedAssetRegister';
import { ShieldCheck, Building2 } from 'lucide-react';
import styles from './accounts.module.css';
import { formatCurrency, formatNumber } from '@/lib/format';

export default function AccountsPage() {
  const { accounts, journalEntries } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'recon' | 'assets'>('dashboard');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  // Calculate summaries
  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((acc, a) => acc + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((acc, a) => acc + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((acc, a) => acc + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'Revenue').reduce((acc, a) => acc + a.balance, 0);
  const totalExpense = accounts.filter(a => a.type === 'Expense').reduce((acc, a) => acc + a.balance, 0);
  
  const netProfit = totalRevenue - totalExpense;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Journal Entries Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableColumn = ["Date", "Description / Ref", "Account", "Debit (SAR)", "Credit (SAR)"];
    const tableRows: any[] = [];

    journalEntries.forEach(entry => {
      const entryDate = new Date(entry.date).toLocaleDateString();
      const desc = entry.description + (entry.reference ? ` (REF: ${entry.reference})` : '');
      
      entry.lines.forEach((line, index) => {
        const acc = accounts.find(a => a.id === line.accountId);
        const accountStr = acc ? `${acc.code} - ${acc.name}` : 'Unknown';
        const debitStr = line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '';
        const creditStr = line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '';
        
        if (index === 0) {
          tableRows.push([entryDate, desc, accountStr, debitStr, creditStr]);
        } else {
          tableRows.push(["", "", accountStr, debitStr, creditStr]);
        }
      });
      // Optional separator row for readability in PDF
      tableRows.push(["", "", "", "", ""]);
    });

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    doc.save(`Journal_Entries_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportXLSX = () => {
    const rows: any[] = [];
    
    journalEntries.forEach(entry => {
      const entryDate = new Date(entry.date).toLocaleDateString();
      const desc = entry.description + (entry.reference ? ` (REF: ${entry.reference})` : '');
      
      entry.lines.forEach((line, index) => {
        const acc = accounts.find(a => a.id === line.accountId);
        
        rows.push({
          "Entry Date": index === 0 ? entryDate : "",
          "Description / Reference": index === 0 ? desc : "",
          "Account Code": acc ? acc.code : "",
          "Account Name": acc ? acc.name : "",
          "Account Type": acc ? acc.type : "",
          "Debit (SAR)": line.debit > 0 ? line.debit : null,
          "Credit (SAR)": line.credit > 0 ? line.credit : null,
          "Entry ID": index === 0 ? entry.id : ""
        });
      });
      // Blank row
      rows.push({});
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal Entries");
    
    XLSX.writeFile(workbook, `Journal_Entries_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImportJournals = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      console.log('Imported Journal Data:', data);
      alert('Journal import feature logic being initialized with Supabase sync...');
    };
    reader.readAsBinaryString(file);
  };

  const handleExportCOA = () => {
    const worksheet = XLSX.utils.json_to_sheet(accounts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chart of Accounts");
    XLSX.writeFile(workbook, `Chart_of_Accounts_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImportCOA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      console.log('Imported COA Data:', data);
      alert('Chart of Accounts import logic being initialized with Supabase sync...');
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fade-in pb-20">
      {/* SVG Gradients Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="zap-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="plus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      {showEntryForm && (
        <JournalEntryForm onClose={() => setShowEntryForm(false)} />
      )}
      {showQuickAdd && (
        <QuickAddModal onClose={() => setShowQuickAdd(false)} />
      )}

      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Accounts</h2>
          <p className={styles.subtitle}>Manage your chart of accounts and double-entry bookkeeping.</p>
        </div>
        <div className="flex gap-4">
          <button 
            className="group relative flex items-center gap-5 px-7 py-5 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-blue-500/10 hover:from-emerald-500/20 hover:to-blue-500/20 transition-all duration-700 transform hover:-translate-y-2 active:scale-95 border border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] overflow-hidden"
            onClick={() => setShowQuickAdd(true)}
          >
            {/* Animated Neon Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 via-transparent to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative w-16 h-16 grid place-items-center">
              {/* Rotating Gradient Ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-400 via-cyan-300 to-blue-500 animate-[spin_3s_linear_infinite] opacity-60 blur-md group-hover:blur-xl transition-all duration-500" />
              <div className="absolute inset-[2px] rounded-2xl bg-slate-950 grid place-items-center z-10 overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                <Zap 
                  size={36} 
                  className="relative z-10 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-125 transition-all duration-500 group-hover:animate-[bounce_1s_infinite] drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" 
                />
                {/* Internal Sparkle */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Sparkles size={16} className="absolute top-1 left-1 text-yellow-300 animate-ping drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]" />
                  <Sparkles size={12} className="absolute bottom-2 right-1 text-cyan-300 animate-pulse drop-shadow-[0_0_5px_rgba(103,232,249,0.8)]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start leading-tight pr-4 relative z-20">
              <span className="text-[16px] font-medium uppercase tracking-[0.15em] text-emerald-100 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-300">Quick Add</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] font-medium text-emerald-400/80 uppercase tracking-[0.25em]">Instant Entry</span>
              </div>
            </div>
          </button>
          
          <button 
            className="group relative flex items-center gap-5 px-7 py-5 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-700 transform hover:-translate-y-2 active:scale-95 border border-purple-500/30 hover:border-purple-400/60 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden"
            onClick={() => setShowEntryForm(true)}
          >
            {/* Animated Neon Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative w-16 h-16 grid place-items-center">
              {/* Rotating Gradient Ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-400 to-indigo-400 animate-[spin_4s_linear_infinite_reverse] opacity-60 blur-md group-hover:blur-xl transition-all duration-500" />
              <div className="absolute inset-[2px] rounded-2xl bg-slate-950 grid place-items-center z-10 overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors" />
                <Plus 
                  size={36} 
                  className="relative z-10 text-purple-400 group-hover:text-purple-300 group-hover:scale-125 group-hover:rotate-180 transition-all duration-700 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" 
                />
                {/* Internal Sparkle */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Sparkles size={14} className="absolute top-2 right-1 text-pink-300 animate-ping drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]" />
                  <Sparkles size={12} className="absolute bottom-1 left-2 text-indigo-300 animate-pulse drop-shadow-[0_0_5px_rgba(129,140,248,0.8)]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start leading-tight pr-4 relative z-20">
              <span className="text-[16px] font-medium uppercase tracking-[0.15em] text-purple-100 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] transition-all duration-300">Journal Entry</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
                <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-[0.25em]">Double Entry</span>
              </div>
            </div>
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={clsx(styles.tab, activeTab === 'dashboard' && styles.tabActive)}
          onClick={() => setActiveTab('dashboard')}
        >
          <Wallet size={18} /> Overview
        </button>
        <button 
          className={clsx(styles.tab, activeTab === 'journal' && styles.tabActive)}
          onClick={() => setActiveTab('journal')}
        >
          <BookOpen size={18} /> Journal Entries
        </button>
        <button 
          className={clsx(styles.tab, activeTab === 'recon' && styles.tabActive)}
          onClick={() => setActiveTab('recon')}
        >
          <ShieldCheck size={18} /> Bank Recon
        </button>
        <button 
          className={clsx(styles.tab, activeTab === 'assets' && styles.tabActive)}
          onClick={() => setActiveTab('assets')}
        >
          <Building2 size={18} /> Fixed Assets
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in">
          {/* Top KPI Cards */}
          <div className={styles.kpiGrid}>
            <div 
              className={clsx(
                'glass-panel', 
                styles.kpiCard, 
                accountFilter === 'Asset' && styles.kpiActive,
                "cursor-pointer hover:scale-[1.02] transition-all duration-300"
              )}
              onClick={() => setAccountFilter(accountFilter === 'Asset' ? null : 'Asset')}
            >
              <div className={clsx(styles.kpiIcon, styles.iconBlue)}>
                <Wallet size={28} />
              </div>
              <div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Total Assets</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalAssets)}</p>
              </div>
              {accountFilter === 'Asset' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
            </div>

            <div 
              className={clsx(
                'glass-panel', 
                styles.kpiCard, 
                accountFilter === 'Liability' && styles.kpiActive,
                "cursor-pointer hover:scale-[1.02] transition-all duration-300"
              )}
              onClick={() => setAccountFilter(accountFilter === 'Liability' ? null : 'Liability')}
            >
              <div className={clsx(styles.kpiIcon, styles.iconRed)}>
                <TrendingDown size={28} />
              </div>
              <div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Total Liabilities</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalLiabilities)}</p>
              </div>
              {accountFilter === 'Liability' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
            </div>

            <div 
              className={clsx(
                'glass-panel', 
                styles.kpiCard, 
                accountFilter === 'Equity' && styles.kpiActive,
                "cursor-pointer hover:scale-[1.02] transition-all duration-300"
              )}
              onClick={() => setAccountFilter(accountFilter === 'Equity' ? null : 'Equity')}
            >
              <div className={clsx(styles.kpiIcon, styles.iconPurple)}>
                <Scale size={28} />
              </div>
              <div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Equity</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalEquity)}</p>
              </div>
              {accountFilter === 'Equity' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />}
            </div>

            <div 
              className={clsx(
                'glass-panel', 
                styles.kpiCard, 
                accountFilter === 'Profit' && styles.kpiActive,
                "cursor-pointer hover:scale-[1.02] transition-all duration-300"
              )}
              onClick={() => setAccountFilter(accountFilter === 'Profit' ? null : 'Profit')}
            >
              <div className={clsx(styles.kpiIcon, styles.iconGreen)}>
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Net Profit</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(netProfit)}</p>
              </div>
              {accountFilter === 'Profit' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />}
            </div>
          </div>

          {/* Chart of Accounts Table */}
          <div className={clsx('glass-panel', styles.tableWrapper)}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Wallet className="text-blue-400" size={24} />
                <div className="flex flex-col">
                  <span>Chart of Accounts</span>
                  {accountFilter && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/60 mt-0.5">
                      Filtered by {accountFilter === 'Profit' ? 'Revenue & Expenses' : accountFilter}
                    </span>
                  )}
                </div>
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => document.getElementById('import-coa-input')?.click()}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all text-white/70 shadow-sm"
                  title="Import Chart of Accounts"
                >
                  <Upload size={14} /> Import
                </button>
                <input 
                  id="import-coa-input" 
                  type="file" 
                  hidden 
                  accept=".xlsx,.xls,.csv" 
                  onChange={handleImportCOA} 
                />
                <button 
                  onClick={handleExportCOA}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all text-white/70 shadow-sm"
                  title="Export Chart of Accounts"
                >
                  <Download size={14} /> Export
                </button>
                {accountFilter && (
                  <button 
                    onClick={() => setAccountFilter(null)}
                    className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted hover:text-white"
                  >
                    View All
                  </button>
                )}
              </div>
            </div>
            <table className={clsx(styles.table, styles.compactTable)}>
              <thead>
                <tr>
                  <th className="pl-5" style={{ width: '10%' }}>Code</th>
                  <th style={{ width: '50%' }}>Account Name</th>
                  <th style={{ width: '20%' }}>Type</th>
                  <th className="pr-5" style={{ width: '20%', textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts
                  .filter(acc => {
                    if (!accountFilter) return true;
                    if (accountFilter === 'Profit') return acc.type === 'Revenue' || acc.type === 'Expense';
                    return acc.type === accountFilter;
                  })
                  .map(acc => (
                    <tr key={acc.id} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5">
                      <td className="pl-5">
                        <span className="font-mono text-[9px] text-blue-400/60 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                          {acc.code}
                        </span>
                      </td>
                      <td>
                        <span className="text-white text-[13px] tracking-tight">{acc.name}</span>
                      </td>
                      <td>
                        <span className={clsx(
                          styles.badge,
                          acc.type === 'Asset' && styles.badgeAsset,
                          acc.type === 'Liability' && styles.badgeLiability,
                          acc.type === 'Equity' && styles.badgeEquity,
                          acc.type === 'Revenue' && styles.badgeRevenue,
                          acc.type === 'Expense' && styles.badgeExpense,
                          "text-[9px] px-1.5 py-0.5 uppercase tracking-tighter"
                        )}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="pr-5 text-right">
                        <span className={clsx(
                          "font-mono text-[11px] tracking-tight px-2 py-0.5 rounded border",
                          acc.balance > 0 ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" : 
                          acc.balance < 0 ? "text-red-400 bg-red-500/5 border-red-500/10" : 
                          "text-muted/20 bg-white/5 border-transparent"
                        )}>
                          {acc.balance !== 0 ? acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className={clsx('glass-panel', styles.tableWrapper, 'animate-in fade-in')}>
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="text-purple-400" size={20} />
              Journal Entries
            </h3>
            <div className="flex gap-3">
              <button 
                onClick={() => document.getElementById('import-journal-input')?.click()}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400 transition-all text-white/70 shadow-sm"
              >
                <Upload size={14} /> Import XLS
              </button>
              <input 
                id="import-journal-input" 
                type="file" 
                hidden 
                accept=".xlsx,.xls,.csv" 
                onChange={handleImportJournals} 
              />
              <button 
                onClick={handleExportXLSX}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all text-white/70 shadow-sm"
              >
                <Download size={14} /> Export XLS
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all text-white/70 shadow-sm"
              >
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
          <table className={clsx(styles.table, styles.compactTable)}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '30%' }}>Description</th>
                <th style={{ width: '25%' }}>Account</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Debit</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-muted">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <BookOpen size={32} className="text-muted/30" />
                      </div>
                      <p className="font-normal tracking-wide">No journal entries recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                journalEntries.map((entry, idx) => (
                  <React.Fragment key={entry.id}>
                    {/* Compact Entry Header */}
                    <tr className={clsx(styles.entryHeader, "border-l-4 border-blue-500/60 bg-white/[0.03]")}>
                      <td className="pl-5 text-[10px] text-blue-400">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td colSpan={2}>
                        <div className="flex items-center gap-4">
                          <span className="text-white text-[13px] tracking-tight">
                            {entry.description}
                          </span>
                          {entry.reference && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 uppercase tracking-widest">
                              REF: {entry.reference}
                            </span>
                          )}
                        </div>
                      </td>
                      <td></td>
                      <td className="pr-5 text-right">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest">ID: {entry.id.slice(0, 8)}</span>
                      </td>
                    </tr>
                    
                    {/* Individual Lines - Ultra Compact */}
                    {entry.lines.map((line, lIdx) => {
                      const acc = accounts.find(a => a.id === line.accountId);
                      return (
                        <tr key={`${entry.id}-${lIdx}`} className={clsx(styles.journalLine, "hover:bg-white/[0.05]")}>
                          <td className="pl-5"></td>
                          <td></td>
                          <td>
                            <div className="flex items-center gap-3 py-1 border-l-2 border-white/5 px-4">
                              <div className={clsx(
                                "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                                line.debit > 0 ? "text-emerald-500 bg-emerald-500" : "text-orange-500 bg-orange-500"
                              )} />
                              <div className="flex flex-col">
                                <span className="text-[12px] text-white/90 tracking-wide">
                                  {acc ? `${acc.code} — ${acc.name}` : 'Unknown Account'}
                                </span>
                                <span className="text-[9px] text-muted/60 uppercase tracking-wider mt-0.5">
                                  {acc?.type}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="text-right">
                            {line.debit > 0 && (
                              <span className="font-mono text-[11px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 bg-emerald-500/5">
                                {line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </td>
                          <td className="pr-5 text-right">
                            {line.credit > 0 && (
                              <span className="font-mono text-[11px] text-orange-400 px-2 py-0.5 rounded border border-orange-500/10 bg-orange-500/5">
                                {line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}      {activeTab === 'recon' && (
        <BankReconciliation />
      )}

      {activeTab === 'assets' && (
        <FixedAssetRegister />
      )}

    </div>
  );
}
