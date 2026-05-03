import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { clsx } from 'clsx';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Scale, 
  Briefcase, 
  Clock, 
  FileSpreadsheet, 
  Calculator, 
  Building2, 
  Calendar, 
  Table as TableIcon, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FinancialReportPDF } from '@/components/FinancialReportPDF';
import * as XLSX from 'xlsx';
import styles from '@/app/accounts/accounts.module.css';

type ReportType = 'balance-sheet' | 'pnl' | 'trial-balance' | 'ksa-profitability' | 'ksa-wip' | 'ksa-ar-ageing' | 'ksa-vat' | 'ksa-zakat';
type DateRangeType = 'all' | 'month' | 'quarter' | 'year' | 'custom';

export function AccountingReports() {
  const { accounts: baseAccounts, settings, quotations, journalEntries } = useApp();
  const [reportType, setReportType] = useState<ReportType>('balance-sheet');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('year');
  const [customStartDate, setCustomStartDate] = useState(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Determine active start/end timestamps based on selection
  const { startTimestamp, endTimestamp } = useMemo(() => {
    const now = new Date();
    if (dateRangeType === 'month') {
      return { startTimestamp: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), endTimestamp: now.getTime() };
    }
    if (dateRangeType === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      return { startTimestamp: new Date(now.getFullYear(), quarter * 3, 1).getTime(), endTimestamp: now.getTime() };
    }
    if (dateRangeType === 'year') {
      return { startTimestamp: new Date(now.getFullYear(), 0, 1).getTime(), endTimestamp: now.getTime() };
    }
    if (dateRangeType === 'custom') {
      return { 
        startTimestamp: new Date(customStartDate).getTime(), 
        endTimestamp: new Date(customEndDate).getTime() + (1000 * 60 * 60 * 24) - 1 // end of day
      };
    }
    return { startTimestamp: 0, endTimestamp: Date.now() * 2 }; // 'all'
  }, [dateRangeType, customStartDate, customEndDate]);

  const dateRangeText = useMemo(() => {
    if (dateRangeType === 'all') return 'ALL TIME';
    if (dateRangeType === 'custom') return `FROM ${customStartDate} TO ${customEndDate}`;
    return `AS OF ${new Date(endTimestamp).toLocaleDateString().toUpperCase()}`;
  }, [dateRangeType, customStartDate, customEndDate, endTimestamp]);

  // Recalculate account balances dynamically from Journal Entries
  const accounts = useMemo(() => {
    return baseAccounts.map(acc => {
      let balance = 0;
      const isPeriodAccount = acc.type === 'Revenue' || acc.type === 'Expense';

      journalEntries.forEach(entry => {
        const isBeforeEnd = entry.date <= endTimestamp;
        const isAfterStart = entry.date >= startTimestamp;
        
        if ((!isPeriodAccount && isBeforeEnd) || (isPeriodAccount && isBeforeEnd && isAfterStart)) {
          entry.lines.forEach(line => {
            if (line.accountId === acc.id) {
              if (acc.type === 'Asset' || acc.type === 'Expense') {
                balance += line.debit - line.credit;
              } else {
                balance += line.credit - line.debit;
              }
            }
          });
        }
      });
      return { ...acc, balance };
    });
  }, [baseAccounts, journalEntries, startTimestamp, endTimestamp]);


  const assets = accounts.filter(a => a.type === 'Asset');
  const liabilities = accounts.filter(a => a.type === 'Liability');
  const equity = accounts.filter(a => a.type === 'Equity');
  const revenue = accounts.filter(a => a.type === 'Revenue');
  const expenses = accounts.filter(a => a.type === 'Expense');

  const totalAssets = assets.reduce((acc, a) => acc + a.balance, 0);
  const totalLiabilities = liabilities.reduce((acc, a) => acc + a.balance, 0);
  const totalEquityBase = equity.reduce((acc, a) => acc + a.balance, 0);
  
  const totalRevenue = revenue.reduce((acc, a) => acc + a.balance, 0);
  const totalExpenses = expenses.reduce((acc, a) => acc + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;
  
  const totalEquityAndLiabilities = totalLiabilities + totalEquityBase + netIncome;

  // --- KSA Reports Calculations ---
  const profitabilityData = useMemo(() => {
    return quotations.map(q => {
      const budget = q.grandTotal || q.total;
      const relatedEntries = journalEntries.filter(je => je.reference === q.number && je.date >= startTimestamp && je.date <= endTimestamp);
      let actualCost = 0;
      relatedEntries.forEach(entry => {
        entry.lines.forEach(line => {
          const acc = accounts.find(a => a.id === line.accountId);
          if (acc && (acc.type === 'Expense' || acc.code === '5000')) {
            actualCost += line.debit;
          }
        });
      });
      return {
        quote: q,
        budget,
        actualCost,
        margin: budget - actualCost,
        marginPercent: budget > 0 ? ((budget - actualCost) / budget) * 100 : 0
      };
    });
  }, [quotations, journalEntries, startTimestamp, endTimestamp, accounts]);

  const wipAccount = accounts.find(a => a.code === '1400') || { balance: 0 };
  const progressBillingsAccount = accounts.find(a => a.code === '2100') || { balance: 0 };
  const netWip = wipAccount.balance - progressBillingsAccount.balance;

  const arAccount = accounts.find(a => a.code === '1200') || { balance: 0 };
  const retentionAccount = accounts.find(a => a.code === '1210') || { balance: 0 };
  const currentAR = arAccount.balance; 

  const vatInputAccount = accounts.find(a => a.code === '1500') || { balance: 0 };
  const vatOutputAccount = accounts.find(a => a.code === '2200') || { balance: 0 };
  const netVatPayable = vatOutputAccount.balance - vatInputAccount.balance;

  const nonDeductibleEstimate = 0; 
  const zakatBaseEstimate = totalEquityBase + totalLiabilities + netIncome + nonDeductibleEstimate; 
  const zakatProvision = zakatBaseEstimate * 0.025;

  const extraData = {
    profitabilityData,
    wipBalance: wipAccount.balance,
    progressBillingsBalance: progressBillingsAccount.balance,
    netWip,
    currentAR,
    retentionBalance: retentionAccount.balance,
    vatInput: vatInputAccount.balance,
    vatOutput: vatOutputAccount.balance,
    netVatPayable,
    totalLiabilities,
    totalEquityBase,
    zakatBaseEstimate,
    zakatProvision,
    dateRangeText
  };

  const exportToExcel = () => {
    let data: any[] = [];
    let fileName = `Report_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    switch (reportType) {
      case 'balance-sheet':
        data = [
          ['ASSETS', ''],
          ...assets.map(a => [a.name, a.balance]),
          ['Total Assets', totalAssets],
          ['', ''],
          ['LIABILITIES', ''],
          ...liabilities.map(a => [a.name, a.balance]),
          ['Total Liabilities', totalLiabilities],
          ['', ''],
          ['EQUITY', ''],
          ...equity.map(a => [a.name, a.balance]),
          ['Current Year Earnings', netIncome],
          ['Total Equity', totalEquityBase + netIncome],
          ['', ''],
          ['TOTAL LIABILITIES & EQUITY', totalEquityAndLiabilities]
        ];
        break;
      case 'pnl':
        data = [
          ['REVENUE', ''],
          ...revenue.map(a => [a.name, a.balance]),
          ['Total Revenue', totalRevenue],
          ['', ''],
          ['EXPENSES', ''],
          ...expenses.map(a => [a.name, a.balance]),
          ['Total Expenses', totalExpenses],
          ['', ''],
          ['NET INCOME', netIncome]
        ];
        break;
      case 'trial-balance':
        data = [
          ['Code', 'Account Name', 'Debit', 'Credit'],
          ...accounts.filter(a => a.balance !== 0).map(acc => {
            const isDebit = acc.type === 'Asset' || acc.type === 'Expense';
            return [acc.code, acc.name, isDebit ? acc.balance : '', !isDebit ? acc.balance : ''];
          })
        ];
        break;
      case 'ksa-profitability':
        data = [
          ['Project Ref', 'Client/Project', 'Budget', 'Actual Cost', 'Margin', 'Margin %'],
          ...profitabilityData.map(d => [d.quote.number, d.quote.projectName || 'Untitled', d.budget, d.actualCost, d.margin, d.marginPercent.toFixed(1) + '%'])
        ];
        break;
      case 'ksa-wip':
        data = [
          ['Description', 'Amount'],
          ['Costs Incurred (WIP)', wipAccount.balance],
          ['Progress Billings', progressBillingsAccount.balance],
          ['Net WIP (Under/Over Billing)', netWip]
        ];
        break;
      case 'ksa-ar-ageing':
        data = [
          ['Description', 'Amount'],
          ['Standard Receivables', currentAR],
          ['Retention Receivables', retentionAccount.balance],
          ['Total Expected Cash Flow', currentAR + retentionAccount.balance]
        ];
        break;
      case 'ksa-vat':
        data = [
          ['Description', 'Amount'],
          ['Output VAT (Collected)', vatOutputAccount.balance],
          ['Input VAT (Paid)', vatInputAccount.balance],
          ['Net VAT Payable/Recoverable', netVatPayable]
        ];
        break;
      case 'ksa-zakat':
        data = [
          ['Description', 'Amount'],
          ['Net Income', netIncome],
          ['Equity & Liabilities Base', totalLiabilities + totalEquityBase],
          ['Estimated Zakat Base', zakatBaseEstimate],
          ['Estimated Zakat Provision (2.5%)', zakatProvision]
        ];
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet([[settings.name], [dateRangeText], [''], ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="animate-in fade-in pb-10">
      <div className={styles.reportControls}>
        {/* Row 1: Main Tabs & Date Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button className={clsx(styles.reportTab, reportType === 'balance-sheet' && styles.reportTabActive)} onClick={() => setReportType('balance-sheet')}>
              <Scale size={18} /> Balance Sheet
            </button>
            <button className={clsx(styles.reportTab, reportType === 'pnl' && styles.reportTabActive)} onClick={() => setReportType('pnl')}>
              <BarChart3 size={18} /> Profit & Loss
            </button>
            <button className={clsx(styles.reportTab, reportType === 'trial-balance' && styles.reportTabActive)} onClick={() => setReportType('trial-balance')}>
              <FileText size={18} /> Trial Balance
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 self-end sm:self-auto">
            <Calendar size={16} className="text-muted" />
            <select 
              className="bg-transparent border-none text-sm font-medium text-white/90 focus:ring-0 cursor-pointer outline-none py-0.5 pr-6"
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value as DateRangeType)}
            >
              <option value="month" className="bg-slate-900 text-white">This Month</option>
              <option value="quarter" className="bg-slate-900 text-white">This Quarter</option>
              <option value="year" className="bg-slate-900 text-white">This Year</option>
              <option value="all" className="bg-slate-900 text-white">All Time</option>
              <option value="custom" className="bg-slate-900 text-white">Custom Range</option>
            </select>
            
            {dateRangeType === 'custom' && (
              <div className="flex gap-2 items-center pl-3 border-l border-white/10 ml-1">
                <input type="date" className="bg-black/20 border border-white/10 rounded-lg text-xs px-2.5 py-1 text-white/80 outline-none" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                <span className="text-muted text-[10px] uppercase font-bold tracking-tighter">to</span>
                <input type="date" className="bg-black/20 border border-white/10 rounded-lg text-xs px-2.5 py-1 text-white/80 outline-none" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
              </div>
            )}
          </div>
        </div>
        
        {/* Row 2: KSA Specific Reports & Exports */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar max-w-full">
            <button className={clsx(styles.reportTab, reportType === 'ksa-profitability' && styles.reportTabActive)} onClick={() => setReportType('ksa-profitability')}>
              <Briefcase size={18} className={clsx(reportType === 'ksa-profitability' ? "text-blue-400" : "text-blue-400/60")} /> Project Profitability
            </button>
            <button className={clsx(styles.reportTab, reportType === 'ksa-wip' && styles.reportTabActive)} onClick={() => setReportType('ksa-wip')}>
              <Building2 size={18} className={clsx(reportType === 'ksa-wip' ? "text-emerald-400" : "text-emerald-400/60")} /> WIP Schedule
            </button>
            <button className={clsx(styles.reportTab, reportType === 'ksa-ar-ageing' && styles.reportTabActive)} onClick={() => setReportType('ksa-ar-ageing')}>
              <Clock size={18} className={clsx(reportType === 'ksa-ar-ageing' ? "text-orange-400" : "text-orange-400/60")} /> AR Ageing
            </button>
            <button className={clsx(styles.reportTab, reportType === 'ksa-vat' && styles.reportTabActive)} onClick={() => setReportType('ksa-vat')}>
              <FileSpreadsheet size={18} className={clsx(reportType === 'ksa-vat' ? "text-purple-400" : "text-purple-400/60")} /> ZATCA VAT Return
            </button>
            <button className={clsx(styles.reportTab, reportType === 'ksa-zakat' && styles.reportTabActive)} onClick={() => setReportType('ksa-zakat')}>
              <Calculator size={18} className={clsx(reportType === 'ksa-zakat' ? "text-pink-400" : "text-pink-400/60")} /> Zakat Lead
            </button>
          </div>

          <div className="flex gap-2 shrink-0 self-end xl:self-auto">
            <button onClick={exportToExcel} className={clsx(styles.downloadBtn, 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')}>
              <TableIcon size={18} /> Export XLS
            </button>
            <PDFDownloadLink
              // @ts-ignore
              document={<FinancialReportPDF type={reportType} accounts={accounts} settings={settings} extraData={extraData} />}
              fileName={`${reportType}-report.pdf`}
              className={styles.downloadBtn}
            >
              {/* @ts-ignore */}
              {({ loading }) => (
                <>
                  <Download size={18} className={clsx(loading && styles.downloadPulse)} />
                  {loading ? 'Generating...' : 'Export PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 max-w-5xl mx-auto border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 opacity-30" />
        
        <div className="text-center mb-8 border-b border-white/10 pb-6">
          <h2 className="text-xl font-medium uppercase tracking-[0.2em] mb-2 text-white">
            {reportType === 'balance-sheet' && 'Balance Sheet'}
            {reportType === 'pnl' && 'Profit & Loss Statement'}
            {reportType === 'trial-balance' && 'Trial Balance'}
            {reportType === 'ksa-profitability' && 'Project Profitability Report'}
            {reportType === 'ksa-wip' && 'Work In Progress (WIP) Schedule'}
            {reportType === 'ksa-ar-ageing' && 'Accounts Receivable Ageing'}
            {reportType === 'ksa-vat' && 'ZATCA VAT Return'}
            {reportType === 'ksa-zakat' && 'Zakat & Tax Lead Schedule'}
          </h2>
          <p className="text-muted font-medium tracking-[0.2em] text-[10px]">
            {dateRangeText}
          </p>
        </div>

        {/* Standard Reports */}
        {reportType === 'balance-sheet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className={clsx(styles.reportSectionTitle, 'text-blue-400/80')}>Assets</h3>
              <div className={styles.reportSection}>
                {assets.map(acc => (
                  <div key={acc.id} className={styles.reportRow}>
                    <span className="text-gray-400 font-medium">{acc.name}</span>
                    <span className="font-mono font-medium text-white">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className={clsx(styles.reportTotalRow, 'text-blue-400')}>
                <span>Total Assets</span>
                <span className="font-mono">{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div>
              <h3 className={clsx(styles.reportSectionTitle, 'text-red-400/80')}>Liabilities</h3>
              <div className={styles.reportSection}>
                {liabilities.map(acc => (
                  <div key={acc.id} className={styles.reportRow}>
                    <span className="text-gray-400 font-medium">{acc.name}</span>
                    <span className="font-mono font-medium text-white">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className={clsx(styles.reportTotalRow, 'text-red-400')}>
                <span>Total Liabilities</span>
                <span className="font-mono">{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <h3 className={clsx(styles.reportSectionTitle, 'text-purple-400/80')}>Equity</h3>
              <div className={styles.reportSection}>
                {equity.map(acc => (
                  <div key={acc.id} className={styles.reportRow}>
                    <span className="text-gray-400 font-medium">{acc.name}</span>
                    <span className="font-mono font-medium text-white">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className={clsx(styles.reportRow, 'text-emerald-400/80')}>
                  <span className="font-medium">Current Year Earnings</span>
                  <span className="font-mono font-medium">{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className={clsx(styles.reportTotalRow, 'text-purple-400')}>
                <span>Total Equity</span>
                <span className="font-mono">{(totalEquityBase + netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-medium border-t-2 border-white/10 pt-3 mt-4 text-white">
                <span className="uppercase tracking-widest">Total Liabilities & Equity</span>
                <span className="font-mono text-lg">{totalEquityAndLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {reportType === 'pnl' && (
          <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className={clsx(styles.reportSectionTitle, 'text-emerald-400/80')}>Revenue</h3>
            <div className={styles.reportSection}>
              {revenue.map(acc => (
                <div key={acc.id} className={styles.reportRow}>
                  <span className="text-gray-400 font-medium">{acc.name}</span>
                  <span className="font-mono font-medium text-white">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className={clsx(styles.reportTotalRow, 'text-emerald-400')}>
              <span>Total Revenue</span>
              <span className="font-mono">{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <h3 className={clsx(styles.reportSectionTitle, 'text-orange-400/80')}>Expenses</h3>
            <div className={styles.reportSection}>
              {expenses.map(acc => (
                <div key={acc.id} className={styles.reportRow}>
                  <span className="text-gray-400 font-medium">{acc.name}</span>
                  <span className="font-mono font-medium text-white">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className={clsx(styles.reportTotalRow, 'text-orange-400')}>
              <span>Total Expenses</span>
              <span className="font-mono">{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className={clsx(
              "flex justify-between items-center text-xl font-medium border-t-2 border-white/10 pt-4 mt-8 px-4 py-3 rounded-lg",
              netIncome >= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
            )}>
              <span className="uppercase tracking-widest text-sm">Net Income</span>
              <span className="font-mono text-2xl">{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {reportType === 'trial-balance' && (
          <div className={clsx(styles.tableWrapper, "animate-in fade-in slide-in-from-bottom-4 duration-500")}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="pl-5" style={{ width: '10%' }}>Code</th>
                  <th style={{ width: '50%' }}>Account Name</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Debit (SAR)</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Credit (SAR)</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => {
                  const isDebit = acc.type === 'Asset' || acc.type === 'Expense';
                  const debitVal = isDebit && acc.balance !== 0 ? acc.balance : null;
                  const creditVal = !isDebit && acc.balance !== 0 ? acc.balance : null;
                  
                  if (acc.balance === 0) return null;

                  return (
                    <tr key={acc.id} className="border-b border-white/5">
                      <td className="pl-5 py-2 font-mono text-[9px] text-blue-400/70 font-medium tracking-widest">{acc.code}</td>
                      <td className="py-2 text-[12px] font-medium text-white/90">{acc.name}</td>
                      <td className="py-2 text-right font-mono text-[11px] font-medium text-emerald-400">
                        {debitVal !== null ? debitVal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="py-2 pr-5 text-right font-mono text-[11px] font-medium text-orange-400">
                        {creditVal !== null ? creditVal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-black/30 border-t-2 border-white/10">
                  <td colSpan={2} className="p-3 text-right font-medium uppercase tracking-[0.2em] text-[10px] text-muted">TOTAL</td>
                  <td className="p-3 text-right font-mono font-medium text-emerald-400 text-sm">
                    {accounts.filter(a => a.type === 'Asset' || a.type === 'Expense').reduce((sum, a) => sum + a.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 pr-5 text-right font-mono font-medium text-orange-400 text-sm">
                    {accounts.filter(a => a.type === 'Liability' || a.type === 'Equity' || a.type === 'Revenue').reduce((sum, a) => sum + a.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* KSA New Reports */}
        {reportType === 'ksa-profitability' && (
          <div className={clsx(styles.tableWrapper, "animate-in fade-in slide-in-from-bottom-4 duration-500")}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="pl-5" style={{ width: '15%' }}>Project Ref</th>
                  <th style={{ width: '30%' }}>Client / Title</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Est. Revenue (SAR)</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Actual Cost (SAR)</th>
                  <th className="pr-5" style={{ width: '15%', textAlign: 'right' }}>Gross Margin</th>
                </tr>
              </thead>
              <tbody>
                {profitabilityData.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-muted font-medium">No active projects/quotations found.</td></tr>
                ) : profitabilityData.map(d => (
                  <tr key={d.quote.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="pl-5 py-3 font-mono text-xs text-blue-400 font-medium">{d.quote.number}</td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{d.quote.projectName || 'Untitled Project'}</span>
                        <span className="text-[10px] text-muted uppercase tracking-wider">{d.quote.status}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-sm font-medium text-emerald-400">{d.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right font-mono text-sm font-medium text-orange-400">{d.actualCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 pr-5 text-right font-mono text-sm font-medium">
                      <span className={clsx("px-2 py-1 rounded-lg", d.margin >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {d.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'ksa-wip' && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 border border-blue-500/20">
                  <Building2 size={24} />
                </div>
                <p className="text-xs text-muted font-medium uppercase tracking-widest mb-2 text-blue-400/80">Costs Incurred (WIP)</p>
                <p className="text-2xl font-mono font-medium text-white">{wipAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] text-muted mt-3 font-medium opacity-50 italic">Account 1400</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400 border border-purple-500/20">
                  <Receipt size={24} />
                </div>
                <p className="text-xs text-muted font-medium uppercase tracking-widest mb-2 text-purple-400/80">Progress Billings</p>
                <p className="text-2xl font-mono font-medium text-white">{progressBillingsAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] text-muted mt-3 font-medium opacity-50 italic">Account 2100</p>
              </div>
            </div>

            <div className={clsx(
              "p-10 rounded-2xl border flex flex-col items-center text-center transition-all duration-500",
              netWip > 0 ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]" : netWip < 0 ? "bg-orange-500/10 border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.05)]" : "bg-white/5 border-white/10"
            )}>
              <div className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-500",
                netWip > 0 ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : 
                netWip < 0 ? "bg-orange-500/20 border-orange-500/30 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]" : 
                "bg-white/10 border-white/20 text-white/40"
              )}>
                {netWip > 0 ? <TrendingUp size={32} /> : netWip < 0 ? <TrendingDown size={32} /> : <Scale size={32} />}
              </div>
              
              <h3 className="text-xs font-medium uppercase tracking-[0.3em] mb-4 opacity-70">
                {netWip > 0 ? "Under-Billing (Asset)" : netWip < 0 ? "Over-Billing (Liability)" : "Balanced WIP"}
              </h3>
              <p className={clsx(
                "text-4xl font-mono font-medium drop-shadow-md",
                netWip > 0 ? "text-emerald-400" : netWip < 0 ? "text-orange-400" : "text-white/60"
              )}>
                {Math.abs(netWip).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] font-medium text-white/40 mt-6 max-w-sm mx-auto leading-relaxed italic">
                {netWip > 0 ? "Costs incurred but not yet billed to the client." : netWip < 0 ? "Work billed to client but costs not yet incurred." : "All costs and billings are perfectly balanced."}
              </p>
            </div>
          </div>
        )}

        {reportType === 'ksa-ar-ageing' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-4">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs text-muted font-medium uppercase tracking-wider mb-2 text-blue-400">Standard Receivables</p>
                <p className="text-2xl font-mono font-medium text-white">{currentAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] text-muted mt-2 font-medium italic">Account 1200 - Due invoices</p>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs text-muted font-medium uppercase tracking-wider mb-2 text-orange-400">Retention Receivables</p>
                <p className="text-2xl font-mono font-medium text-white">{retentionAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] text-muted mt-2 font-medium italic">Account 1210 - Held until warranty</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center border-l-4 border-l-emerald-500/50">
              <span className="text-sm font-medium uppercase tracking-widest text-white/70">Total Expected Cash Flow</span>
              <span className="text-xl font-mono font-medium text-emerald-400">{ (currentAR + retentionAccount.balance).toLocaleString(undefined, { minimumFractionDigits: 2 }) }</span>
            </div>
          </div>
        )}

        {reportType === 'ksa-vat' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 text-red-400 border border-red-500/20">
                  <TrendingDown size={24} />
                </div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Output VAT</p>
                <span className="text-2xl font-mono font-medium text-white">{vatOutputAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <p className="text-[10px] text-muted mt-3 italic">Tax Collected</p>
              </div>
              
              <div className="p-8 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp size={24} />
                </div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Input VAT</p>
                <span className="text-2xl font-mono font-medium text-white">{vatInputAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <p className="text-[10px] text-muted mt-3 italic">Tax Paid</p>
              </div>
            </div>

            <div className={clsx(
              "flex flex-col items-center text-center p-10 rounded-2xl border transition-all duration-500",
              netVatPayable > 0 ? "bg-red-500/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.05)]" : "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.05)]"
            )}>
              <div className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-500",
                netVatPayable > 0 ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              )}>
                <FileSpreadsheet size={32} />
              </div>
              <div>
                <p className={clsx("text-xs font-medium uppercase tracking-[0.3em] mb-4", netVatPayable > 0 ? "text-red-400" : "text-emerald-400")}>
                  {netVatPayable > 0 ? "Net Tax Payable" : "Net Tax Recoverable"}
                </p>
              </div>
              <span className={clsx("text-4xl font-mono font-medium drop-shadow-md", netVatPayable > 0 ? "text-red-400" : "text-emerald-400")}>
                {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-white/30 mt-6 font-medium italic">Official ZATCA / Fatoora filing amount</p>
            </div>
          </div>
        )}

        {reportType === 'ksa-zakat' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 border border-blue-500/20">
                  <TrendingUp size={24} />
                </div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Net Income</p>
                <span className="text-2xl font-mono font-medium text-white">{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-8 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400 border border-purple-500/20">
                  <Scale size={24} />
                </div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Capital Base</p>
                <span className="text-2xl font-mono font-medium text-white">{(totalLiabilities + totalEquityBase).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="p-10 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl border border-pink-500/20 flex flex-col items-center text-center shadow-[0_0_40px_rgba(236,72,153,0.05)]">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-6 text-pink-400">
                <Calculator size={32} />
              </div>
              <p className="text-xs font-medium text-pink-400 uppercase tracking-[0.3em] mb-4">Estimated Zakat Provision (2.5%)</p>
              <span className="text-4xl font-mono font-medium text-white drop-shadow-md">{zakatProvision.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <div className="mt-8 pt-6 border-t border-white/5 w-full">
                <div className="flex justify-between items-center text-[11px] text-white/40 uppercase tracking-widest px-4">
                  <span>Zakat Base Estimate</span>
                  <span className="font-mono text-white/60">{zakatBaseEstimate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-muted font-medium mt-6 max-w-lg mx-auto">
              This is a lead schedule simulation based on standard balances. Official Zakat declarations require statutory auditing and adjustments for exact days in the Hijri or Gregorian year.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
