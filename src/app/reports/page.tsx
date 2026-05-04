'use client';

import React from 'react';
import { AccountingReports } from '@/components/AccountingReports';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import styles from './reports.module.css';
import { clsx } from 'clsx';
import { TrendingUp, ArrowUpRight, ShieldCheck, FileText } from 'lucide-react';

export default function ReportsPage() {
  const { accounts } = useApp();

  const totalRevenue = accounts.find(a => a.code === '4000')?.balance || 0;
  const totalExpenses = accounts.filter(a => a.type === 'Expense').reduce((s, a) => s + a.balance, 0);
  const vatOutput = accounts.find(a => a.code === '2200')?.balance || 0;
  const vatInput = accounts.find(a => a.code === '1500')?.balance || 0;

  return (
    <div className={clsx("fade-in", styles.container)}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Financial Command Center</h2>
          <p className={styles.subtitle}>Executive summary and comprehensive Saudi regulatory audit suite.</p>
        </div>
      </header>

      {/* Executive Summary Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-panel p-6 flex items-center gap-4 rounded-[20px] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-[1.02] cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">Yearly Revenue (Net)</p>
            <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center gap-4 rounded-[20px] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-[1.02] cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowUpRight size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">Operating Profit</p>
            <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalRevenue - totalExpenses)}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center gap-4 rounded-[20px] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-[1.02] cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">ZATCA VAT Liability</p>
            <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(vatOutput - vatInput)}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center gap-4 rounded-[20px] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-[1.02] cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">Income Tax (20%)</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency((totalRevenue - totalExpenses) > 0 ? (totalRevenue - totalExpenses) * 0.20 : 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <AccountingReports />
      </div>
    </div>
  );
}
