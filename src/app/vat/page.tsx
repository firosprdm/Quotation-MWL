'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { clsx } from 'clsx';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Calendar,
  Download,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import * as XLSX from 'xlsx';
import { VatAuditReport } from '@/components/VatAuditReport';

export default function VATModule() {
  const { accounts, journalEntries, settings } = useApp();
  const [period, setPeriod] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'M' | 'Y'>('Y');
  
  const [year, setYear] = useState(new Date().getFullYear());

  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = year;
    
    switch (period) {
      case 'Y':
        return { start: new Date(currentYear, 0, 1, 0, 0, 0).getTime(), end: new Date(currentYear, 11, 31, 23, 59, 59).getTime() };
      case 'Q1':
        return { start: new Date(currentYear, 0, 1, 0, 0, 0).getTime(), end: new Date(currentYear, 2, 31, 23, 59, 59).getTime() };
      case 'Q2':
        return { start: new Date(currentYear, 3, 1, 0, 0, 0).getTime(), end: new Date(currentYear, 5, 30, 23, 59, 59).getTime() };
      case 'Q3':
        return { start: new Date(currentYear, 6, 1, 0, 0, 0).getTime(), end: new Date(currentYear, 8, 30, 23, 59, 59).getTime() };
      case 'Q4':
        return { start: new Date(currentYear, 9, 1, 0, 0, 0).getTime(), end: new Date(currentYear, 11, 31, 23, 59, 59).getTime() };
      case 'M':
        return { 
          start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).getTime(), 
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime() 
        };
      default:
        return { start: new Date(currentYear, 0, 1).getTime(), end: new Date(currentYear, 11, 31).getTime() };
    }
  }, [period, year]);

  const vatStats = useMemo(() => {
    let outputVat = 0;
    let inputVat = 0;
    let taxableSales = 0;
    let taxablePurchases = 0;

    journalEntries.forEach(entry => {
      if (entry.date >= dateRange.start && entry.date <= dateRange.end) {
        entry.lines.forEach(line => {
          const acc = accounts.find(a => a.id === line.accountId);
          if (acc?.code === '2200') outputVat += line.credit - line.debit;
          if (acc?.code === '1500') inputVat += line.debit - line.credit;
          if (acc?.code === '4000') taxableSales += line.credit - line.debit;
          // Estimate taxable purchases from expenses with VAT
          if (acc?.type === 'Expense' || acc?.code === '5000') {
             // If this entry has a VAT line, then this line is a taxable purchase
             const hasVat = entry.lines.some(l => accounts.find(a => a.id === l.accountId)?.code === '1500');
             if (hasVat) taxablePurchases += line.debit - line.credit;
          }
        });
      }
    });

    return { outputVat, inputVat, taxableSales, taxablePurchases, netPayable: outputVat - inputVat };
  }, [accounts, journalEntries, dateRange]);

  const exportVAT = () => {
    const data = [
      ['ZATCA VAT RETURN FORM', ''],
      ['Taxpayer', settings.name],
      ['Tax Registration Number (TRN)', (settings.zatca as any)?.trn || 'NOT SET'],
      ['Tax Period', period],
      [''],
      ['VAT ON SALES (OUTPUT)', 'AMOUNT (SAR)', 'VAT (15%)'],
      ['1. Standard Rated Sales', vatStats.taxableSales, vatStats.outputVat],
      ['2. Zero Rated Sales', 0, 0],
      ['3. Exempt Sales', 0, 0],
      ['Total Sales', vatStats.taxableSales, vatStats.outputVat],
      [''],
      ['VAT ON PURCHASES (INPUT)', 'AMOUNT (SAR)', 'VAT (15%)'],
      ['1. Standard Rated Purchases', vatStats.taxablePurchases, vatStats.inputVat],
      ['2. Zero Rated Purchases', 0, 0],
      ['Total Purchases', vatStats.taxablePurchases, vatStats.inputVat],
      [''],
      ['NET VAT PAYABLE', '', vatStats.netPayable]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VAT Return");
    XLSX.writeFile(wb, `VAT_Return_${period}_${year}.xlsx`);
  };

  return (
    <div className="fade-in pb-20">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="premium-title">KSA VAT Module</h2>
          <p className="premium-subtitle">Regulatory tax compliance and ZATCA reporting suite.</p>
        </div>
        <div className="flex gap-4">
           <select 
            className="glass-input !w-32 !h-12 !px-4"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
              <option key={y} value={y} className="bg-slate-900">{y}</option>
            ))}
          </select>
          <select 
            className="glass-input !w-48 !h-12 !px-4"
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
          >
            <option value="Y">Full Year</option>
            <option value="Q1">Q1 (Jan - Mar)</option>
            <option value="Q2">Q2 (Apr - Jun)</option>
            <option value="Q3">Q3 (Jul - Sep)</option>
            <option value="Q4">Q4 (Oct - Dec)</option>
            <option value="M">Current Month</option>
          </select>
          <button onClick={exportVAT} className="glass-button bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Download size={20} />
            <span>Export Return</span>
          </button>
        </div>
      </header>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-500/10 transition-colors" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
              <TrendingDown size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Output VAT</h3>
          </div>
          <p className="text-3xl font-normal text-white tracking-tighter">{formatCurrency(vatStats.outputVat)}</p>
          <p className="text-[12px] text-muted mt-2 font-medium">TAX COLLECTED ON SALES</p>
        </div>

        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Input VAT</h3>
          </div>
          <p className="text-3xl font-normal text-white tracking-tighter">{formatCurrency(vatStats.inputVat)}</p>
          <p className="text-[12px] text-muted mt-2 font-medium">TAX PAID ON EXPENSES</p>
        </div>

        <div className={clsx(
          "glass-panel p-8 relative overflow-hidden group border-l-4",
          vatStats.netPayable > 0 ? "border-l-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "border-l-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className={clsx(
              "w-12 h-12 rounded-xl flex items-center justify-center border",
              vatStats.netPayable > 0 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            )}>
              <Scale size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Net Tax Payable</h3>
          </div>
          <p className={clsx("text-3xl font-normal tracking-tighter", vatStats.netPayable > 0 ? "text-red-400" : "text-emerald-400")}>
            {formatCurrency(Math.abs(vatStats.netPayable))}
          </p>
          <p className="text-[12px] text-muted mt-2 font-medium">{vatStats.netPayable > 0 ? 'PAYABLE TO ZATCA' : 'RECOVERABLE FROM ZATCA'}</p>
        </div>
      </div>

      {/* Official Form Style */}
      <div className="glass-panel p-10 max-w-4xl mx-auto border border-white/10 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
        
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              <h3 className="text-xl font-medium text-white tracking-[0.2em] uppercase">ZATCA VAT Return Form</h3>
            </div>
            <p className="text-sm text-muted font-medium">Standard Rated (15%) · {settings.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tax Registration No.</p>
            <p className="text-lg font-mono text-white/90">{(settings.zatca as any)?.trn || '--- --- ---'}</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Output VAT Section */}
          <section>
            <h4 className="text-[12px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[14px]">1</span>
              VAT on Sales (Output Tax)
            </h4>
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-white/5 mb-4">
              <div className="col-span-6">Description</div>
              <div className="col-span-3 text-right">Amount (Excl. VAT)</div>
              <div className="col-span-3 text-right">VAT Amount</div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-white/5 transition-colors rounded-xl items-center">
                <div className="col-span-6 text-sm text-white/80">Standard Rated Sales (15%)</div>
                <div className="col-span-3 text-right font-mono text-white/60">{formatNumber(vatStats.taxableSales)}</div>
                <div className="col-span-3 text-right font-mono text-emerald-400">{formatNumber(vatStats.outputVat)}</div>
              </div>
              <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-white/5 transition-colors rounded-xl items-center opacity-40">
                <div className="col-span-6 text-sm text-white/80">Zero Rated Sales / Exempt</div>
                <div className="col-span-3 text-right font-mono text-white/60">0.00</div>
                <div className="col-span-3 text-right font-mono text-emerald-400">0.00</div>
              </div>
              <div className="grid grid-cols-12 gap-4 px-4 py-4 bg-white/5 border border-white/10 rounded-xl items-center font-bold">
                <div className="col-span-6 text-[12px] text-white uppercase tracking-widest">Total Output Tax</div>
                <div className="col-span-3 text-right font-mono text-white">{formatNumber(vatStats.taxableSales)}</div>
                <div className="col-span-3 text-right font-mono text-emerald-400 border-b-2 border-emerald-500/50">{formatNumber(vatStats.outputVat)}</div>
              </div>
            </div>
          </section>

          {/* Input VAT Section */}
          <section>
            <h4 className="text-[12px] font-bold text-purple-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[14px]">2</span>
              VAT on Purchases (Input Tax)
            </h4>
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-white/5 mb-4">
              <div className="col-span-6">Description</div>
              <div className="col-span-3 text-right">Amount (Excl. VAT)</div>
              <div className="col-span-3 text-right">VAT Amount</div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-white/5 transition-colors rounded-xl items-center">
                <div className="col-span-6 text-sm text-white/80">Standard Rated Purchases (15%)</div>
                <div className="col-span-3 text-right font-mono text-white/60">{formatNumber(vatStats.taxablePurchases)}</div>
                <div className="col-span-3 text-right font-mono text-red-400">{formatNumber(vatStats.inputVat)}</div>
              </div>
              <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-white/5 transition-colors rounded-xl items-center opacity-40">
                <div className="col-span-6 text-sm text-white/80">Zero Rated Purchases / Imports</div>
                <div className="col-span-3 text-right font-mono text-white/60">0.00</div>
                <div className="col-span-3 text-right font-mono text-red-400">0.00</div>
              </div>
              <div className="grid grid-cols-12 gap-4 px-4 py-4 bg-white/5 border border-white/10 rounded-xl items-center font-bold">
                <div className="col-span-6 text-[12px] text-white uppercase tracking-widest">Total Input Tax</div>
                <div className="col-span-3 text-right font-mono text-white">{formatNumber(vatStats.taxablePurchases)}</div>
                <div className="col-span-3 text-right font-mono text-red-400 border-b-2 border-red-500/50">{formatNumber(vatStats.inputVat)}</div>
              </div>
            </div>
          </section>

          {/* Net VAT Section */}
          <section className="pt-8 border-t border-white/10">
            <div className={clsx(
              "p-8 rounded-2xl border flex justify-between items-center",
              vatStats.netPayable > 0 ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"
            )}>
              <div>
                <h5 className="text-lg font-medium text-white mb-1 uppercase tracking-widest">Net VAT Account</h5>
                <p className="text-sm text-muted font-medium italic">Tax Payable or (Refundable) for the period</p>
              </div>
              <div className="text-right">
                <p className={clsx(
                  "text-4xl font-mono font-medium",
                  vatStats.netPayable > 0 ? "text-red-400" : "text-emerald-400"
                )}>
                  {formatNumber(Math.abs(vatStats.netPayable))}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">SAR · SAUDI RIYAL</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 flex items-center gap-4 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <AlertCircle size={24} className="text-blue-400 shrink-0" />
          <p className="text-[13px] text-blue-200/70 font-medium leading-relaxed">
            This report is an automated estimate based on your ledger activity. Before final submission via the 
            <span className="text-blue-400 mx-1">ERAD (ZATCA) Portal</span>, please reconcile all tax accounts (1500 & 2200) 
            with your physical purchase and sales invoices.
          </p>
        </div>
      </div>

      {/* Transaction Audit Trail */}
      <VatAuditReport start={dateRange.start} end={dateRange.end} />
    </div>
  );
}
