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
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { clsx } from 'clsx';
import { JournalEntryForm } from '@/components/JournalEntryForm';
import { QuickAddModal } from '@/components/QuickAddModal';
import { BankReconciliation } from '@/components/BankReconciliation';
import { FixedAssetRegister } from '@/components/FixedAssetRegister';
import { ShieldCheck, Building2, Activity } from 'lucide-react';
import styles from './accounts.module.css';
import { formatCurrency, formatNumber } from '@/lib/format';

export default function AccountsPage() {
  const { accounts, journalEntries, settings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'recon' | 'assets' | 'zatca'>('dashboard');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [journalPage, setJournalPage] = useState(1);
  const entriesPerPage = 50;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importData, exportData } = useApp(); // Assuming these might exist or we add them
  const [zatcaOtp, setZatcaOtp] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [localMode, setLocalMode] = useState<'sandbox' | 'simulation' | 'production'>(settings.zatca?.mode || 'sandbox');

  const handleZatcaModeSelect = async (e: React.MouseEvent, mode: 'sandbox' | 'simulation' | 'production') => {
    e.preventDefault();
    setLocalMode(mode);
    try {
      const newSettings = { 
        ...settings, 
        zatca: { 
          onboarded: false,
          ...(settings.zatca || {}), 
          mode 
        } 
      };
      await updateSettings(newSettings);
    } catch (err: any) {
      console.error('Mode Selection Error:', err);
      alert('Failed to change mode: ' + err.message);
      setLocalMode(settings.zatca?.mode || 'sandbox');
    }
  };

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('This will overwrite current local data. Continue?')) {
          // Logic to import data into context
          // Since we might not have a direct 'importData' in context yet, 
          // we'll need to add it or manually update local storage/supabase.
          // For now, let's assume we'll add it to context.
          if (importData) {
            await importData(json);
            alert('Data imported successfully!');
            window.location.reload();
          } else {
            alert('Import function not implemented in context yet.');
          }
        }
      } catch (err) {
        alert('Error parsing file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    const dataToExport = {
      ...exportData(),
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Full_System_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleExportAccounts = () => {
    const rows = accounts.map(acc => ({
      "Code": acc.code,
      "Name": acc.name,
      "Type": acc.type,
      "Balance (SAR)": acc.balance
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chart of Accounts");
    XLSX.writeFile(workbook, `Chart_of_Accounts_${new Date().toISOString().slice(0,10)}.xlsx`);
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

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".json" 
        onChange={handleFileChange} 
      />

      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <button 
          onClick={handleExportJSON}
          className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl group"
          title="Export JSON Backup"
        >
          <FileJson size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <button 
          onClick={handleImportClick}
          className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl group"
          title="Import JSON Backup"
        >
          <Upload size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <button 
          onClick={handleExportAccounts}
          className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-emerald-500/20 transition-all shadow-xl group"
          title="Export Chart of Accounts"
        >
          <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform text-emerald-400" />
        </button>
      </div>

      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Financial Ledger</h2>
          <p className="premium-subtitle">Manage your chart of accounts and double-entry bookkeeping.</p>
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
                <span className="text-[12px] font-medium text-emerald-400/80 uppercase tracking-[0.25em]">Instant Entry</span>
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
                <span className="text-[12px] font-medium text-purple-400/80 uppercase tracking-[0.25em]">Double Entry</span>
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
        <button 
          className={clsx(styles.tab, activeTab === 'zatca' && styles.tabActive, styles.tabZatca)}
          onClick={() => setActiveTab('zatca')}
        >
          <ShieldCheck size={18} /> ZATCA Hub
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
                <p className="premium-label mb-1">Total Assets</p>
                <p className="text-2xl font-normal text-white tracking-tighter">{formatCurrency(totalAssets)}</p>
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
              <div className={clsx(styles.kpiIcon, styles.iconRed, "icon-hover")}>
                <TrendingDown size={32} />
              </div>
              <div>
                <p className="premium-label mb-1">Total Liabilities</p>
                <p className="text-2xl font-normal text-white tracking-tighter">{formatCurrency(totalLiabilities)}</p>
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
              <div className={clsx(styles.kpiIcon, styles.iconPurple, "icon-hover")}>
                <Scale size={32} />
              </div>
              <div>
                <p className="premium-label mb-1">Equity</p>
                <p className="text-2xl font-normal text-white tracking-tighter">{formatCurrency(totalEquity)}</p>
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
              <div className={clsx(styles.kpiIcon, styles.iconGreen, "icon-hover")}>
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="premium-label mb-1">Net Profit</p>
                <p className="text-2xl font-normal text-emerald-400 tracking-tighter">{formatCurrency(netProfit)}</p>
              </div>
              {accountFilter === 'Profit' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />}
            </div>
          </div>

          {/* Chart of Accounts Table */}
          <div className={clsx('glass-panel', styles.tableWrapper)}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="premium-card-title flex items-center gap-3">
                <Wallet className="text-blue-400" size={24} />
                <div className="flex flex-col">
                  <span>Chart of Accounts</span>
                  {accountFilter && (
                    <span className="text-[12px] font-medium uppercase tracking-widest text-blue-400/60 mt-0.5">
                      Filtered by {accountFilter === 'Profit' ? 'Revenue & Expenses' : accountFilter}
                    </span>
                  )}
                </div>
              </h3>
              {accountFilter && (
                <button 
                  onClick={() => setAccountFilter(null)}
                  className="text-[12px] font-medium uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted hover:text-white"
                >
                  View All
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className="premium-label">Account Code</th>
                    <th className="premium-label">Account Name</th>
                    <th className="premium-label">Type</th>
                    <th className="premium-label text-right">Balance (SAR)</th>
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
                      <tr key={acc.id}>
                        <td className="font-mono text-blue-400/80">{acc.code}</td>
                        <td className="text-white font-medium">{acc.name}</td>
                        <td>
                          <span className={clsx(
                            "inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest min-w-[80px] h-6 border rounded-lg px-2 text-center",
                            acc.type === 'Asset' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                            acc.type === 'Liability' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            acc.type === 'Equity' && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                            acc.type === 'Revenue' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            acc.type === 'Expense' && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}>
                            {acc.type}
                          </span>
                        </td>
                        <td className={clsx(
                          "font-mono text-right font-medium",
                          acc.balance > 0 ? "text-emerald-400" : 
                          acc.balance < 0 ? "text-red-400" : 
                          "text-muted"
                        )}>
                          {acc.balance !== 0 ? acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className={clsx('glass-panel', styles.tableWrapper, 'animate-in fade-in')}>
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="premium-card-title flex items-center gap-2">
              <BookOpen className="text-purple-400" size={20} />
              Journal Entries
            </h3>
            <div className="flex gap-3">
              <button 
                onClick={handleExportXLSX}
                className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all text-white/70 shadow-sm"
              >
                <Download size={14} /> Export XLS
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all text-white/70 shadow-sm"
              >
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="premium-label">Date</th>
                  <th className="premium-label">Description</th>
                  <th className="premium-label">Ref</th>
                  <th className="premium-label">Account</th>
                  <th className="premium-label text-right">Debit</th>
                  <th className="premium-label text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-muted">
                      No journal entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const totalPages = Math.ceil(journalEntries.length / entriesPerPage);
                    const paginatedEntries = journalEntries.slice((journalPage - 1) * entriesPerPage, journalPage * entriesPerPage);
                    
                    return (
                      <React.Fragment>
                        {paginatedEntries.flatMap(entry => 
                          entry.lines.map((line, idx) => {
                            const acc = accounts.find(a => a.id === line.accountId);
                            return (
                              <tr key={`${entry.id}-${idx}`}>
                                {idx === 0 ? (
                                  <>
                                    <td rowSpan={entry.lines.length} className="font-mono text-blue-400 align-top">
                                      {new Date(entry.date).toLocaleDateString()}
                                    </td>
                                    <td rowSpan={entry.lines.length} className="align-top text-white font-normal">
                                      {entry.description}
                                    </td>
                                    <td rowSpan={entry.lines.length} className="align-top">
                                      {entry.reference && (
                                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[12px] font-medium uppercase border border-blue-500/20">
                                          {entry.reference}
                                        </span>
                                      )}
                                    </td>
                                  </>
                                ) : null}
                                <td>
                                  <span className="text-white/80">{acc?.code} — {acc?.name}</span>
                                  <span className="ml-2 text-[12px] text-muted/50 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">{acc?.type}</span>
                                </td>
                                <td className="text-right font-mono text-emerald-400">
                                  {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="text-right font-mono text-orange-400">
                                  {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </React.Fragment>
                    );
                  })()
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {journalEntries.length > entriesPerPage && (
              <div className="flex justify-between items-center p-4 border-t border-white/5">
                <span className="text-sm text-muted">
                  Showing {(journalPage - 1) * entriesPerPage + 1} to {Math.min(journalPage * entriesPerPage, journalEntries.length)} of {journalEntries.length} entries
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setJournalPage(p => Math.max(1, p - 1))}
                    disabled={journalPage === 1}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setJournalPage(p => Math.min(Math.ceil(journalEntries.length / entriesPerPage), p + 1))}
                    disabled={journalPage === Math.ceil(journalEntries.length / entriesPerPage)}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}      {activeTab === 'recon' && (
        <BankReconciliation />
      )}

      {activeTab === 'assets' && (
        <FixedAssetRegister />
      )}

      {activeTab === 'zatca' && (
        <div className="animate-in fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              type="button"
              className={clsx(
                'glass-panel p-8 flex flex-col items-center justify-center text-center cursor-pointer border-2 transition-all duration-500 ease-out relative overflow-hidden',
                localMode === 'sandbox' 
                  ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-[1.02] ring-1 ring-blue-500 z-10' 
                  : 'border-white/5 hover:border-white/20 hover:scale-[1.01] hover:bg-white/5'
              )}
              onClick={(e) => handleZatcaModeSelect(e, 'sandbox')}
            >
              {localMode === 'sandbox' && <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/5 to-blue-500/10 animate-pulse pointer-events-none" />}
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-400 mb-4 ring-4 ring-blue-500/10">
                <Zap size={24} />
              </div>
              <h4 className="text-lg font-medium mb-2">Sandbox</h4>
              <p className="text-sm text-muted leading-relaxed max-w-[200px]">Common pre-configured testing environment for developers.</p>
            </button>

            <button 
              type="button"
              className={clsx(
                'glass-panel p-8 flex flex-col items-center justify-center text-center cursor-pointer border-2 transition-all duration-500 ease-out relative overflow-hidden',
                localMode === 'simulation' 
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,34,0.3)] scale-[1.02] ring-1 ring-orange-500 z-10' 
                  : 'border-white/5 hover:border-white/20 hover:scale-[1.01] hover:bg-white/5'
              )}
              onClick={(e) => handleZatcaModeSelect(e, 'simulation')}
            >
              {localMode === 'simulation' && <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/0 via-orange-500/5 to-orange-500/10 animate-pulse pointer-events-none" />}
              <div className="p-3 rounded-full bg-orange-500/20 text-orange-400 mb-4 ring-4 ring-orange-500/10">
                <Activity size={24} />
              </div>
              <h4 className="text-lg font-medium mb-2">Simulation</h4>
              <p className="text-sm text-muted leading-relaxed max-w-[200px]">Unique testing environment specifically for your solution.</p>
            </button>

            <button 
              type="button"
              className={clsx(
                'glass-panel p-8 flex flex-col items-center justify-center text-center cursor-pointer border-2 transition-all duration-500 ease-out relative overflow-hidden',
                localMode === 'production' 
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02] ring-1 ring-emerald-500 z-10' 
                  : 'border-white/5 hover:border-white/20 hover:scale-[1.01] hover:bg-white/5'
              )}
              onClick={(e) => handleZatcaModeSelect(e, 'production')}
            >
              {localMode === 'production' && <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/5 to-emerald-500/10 animate-pulse pointer-events-none" />}
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-4 ring-4 ring-emerald-500/10">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-lg font-medium mb-2">Production</h4>
              <p className="text-sm text-muted leading-relaxed max-w-[200px]">Live environment for reporting real fiscal transactions.</p>
            </button>
          </div>

          <div className="glass-panel p-10 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col items-center mb-10 relative z-10">
              <div className={clsx(
                "px-4 py-1.5 rounded-full border flex items-center gap-2 font-medium text-[12px] uppercase tracking-widest mb-6 shadow-sm",
                settings.zatca?.onboarded ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-orange-500/10 border-orange-500/30 text-orange-400"
              )}>
                <div className={clsx("w-1.5 h-1.5 rounded-full", settings.zatca?.onboarded ? "bg-emerald-400" : "bg-orange-400 animate-pulse")} />
                {settings.zatca?.onboarded ? "Onboarded" : "Pending Onboarding"}
              </div>
              <h3 className="text-2xl font-medium mb-3 tracking-tight">Solution Onboarding</h3>
              <p className="text-sm text-muted max-w-md leading-relaxed">Securely register this environment with ZATCA by providing the OTP generated from your Fatoora Portal.</p>
            </div>

            <div className="w-full max-w-md space-y-8 relative z-10">
              <div className="space-y-4">
                <label className="text-[12px] text-muted font-medium uppercase tracking-[0.2em]">Fatoora Portal OTP</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="ENTER 6-DIGIT OTP"
                    className="glass-input w-full px-4 py-3 font-mono text-lg tracking-[0.5em] text-center uppercase shadow-inner"
                    maxLength={6}
                    value={zatcaOtp}
                    onChange={(e) => setZatcaOtp(e.target.value)}
                  />
                  <button 
                    className="glass-button w-full bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] py-3 font-medium tracking-widest text-sm uppercase active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={isOnboarding || zatcaOtp.length < 5}
                    onClick={async () => {
                      if (!zatcaOtp) return;
                      setIsOnboarding(true);
                      try {
                        const res = await fetch('/api/zatca/onboard', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            otp: zatcaOtp,
                            vatNumber: settings.vatNumber || '311111111111113',
                            companyName: settings.name,
                            address: settings.address,
                            branchName: 'Main',
                            mode: settings.zatca?.mode || 'sandbox'
                          })
                        });

                        const data = await res.json();
                        
                        if (!res.ok) {
                          alert(`ZATCA API Error: ${data.error || 'Failed to onboard'}\nCheck console for details.`);
                          console.warn('ZATCA API Details:', data.details || data);
                        } else {
                          // Success! Save the actual CSID and Secret
                          await updateSettings({ 
                            ...settings, 
                            zatca: { 
                              ...settings.zatca, 
                              onboarded: true,
                              privateKey: data.privateKey,
                              csr: data.csr,
                              certificate: data.binarySecurityToken,
                              secret: data.secret
                            } 
                          });
                          alert('Success! Real CSR Generated and Journal Onboarded for ' + (settings.zatca?.mode || 'sandbox').toUpperCase() + ' mode.');
                          setZatcaOtp('');
                        }
                      } catch (err: any) {
                        alert('Network Error: ' + err.message);
                      } finally {
                        setIsOnboarding(false);
                      }
                    }}
                  >
                    {isOnboarding ? 'Connecting...' : 'Onboard Now'}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center mt-8">
                <div className="mb-3 p-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20"><Sparkles size={12} className="text-yellow-400" /></div>
                <p className="text-sm text-muted/80 leading-relaxed font-light">
                  <strong className="font-normal text-slate-300">Important:</strong> Once onboarded, you can begin using the selected environment immediately. 
                  Ensure your VAT Number and Company Details are strictly correct in the General Settings before continuing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
