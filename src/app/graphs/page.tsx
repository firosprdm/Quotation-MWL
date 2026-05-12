'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import styles from '../reports/reports.module.css';
import { formatCurrency } from '@/lib/format';
import { clsx } from 'clsx';
import { Calendar, Download, X, Eye, FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotationPDF } from '@/components/QuotationPDF';
import { ViewQuotationModal } from '@/components/ViewQuotationModal';

export default function GraphsPage() {
  const { isLoaded, journalEntries, accounts, quotations, clients, settings } = useApp();
  const [period, setPeriod] = useState(6); // Default 6 months
  const [selectedDetails, setSelectedDetails] = useState<{ title: string; type: 'quotations' | 'entries'; items: any[] } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<any>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!isLoaded) return { monthly: [], aging: [], expenses: [], clientRevenue: [], vat: [] };

    // Get period labels
    const monthLabels = [...Array(period)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }).reverse();

    // 1. Monthly Trends
    const monthly = monthLabels.map(month => {
      let inflow = 0;
      let outflow = 0;
      let revenue = 0;
      let expenses = 0;
      const monthEntries: any[] = [];
      const monthQuotes: any[] = [];

      journalEntries.forEach(je => {
        const jeDate = new Date(je.date);
        const jeMonth = jeDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (jeMonth === month) {
          monthEntries.push(je);
          const lines = Array.isArray(je.lines) ? je.lines : (typeof je.lines === 'string' ? JSON.parse(je.lines) : []);
          lines.forEach((line: any) => {
            const acc = accounts.find(a => a.id === line.accountId);
            if (!acc) return;
            if (acc.code === '1000' || acc.code === '1010') {
              inflow += line.debit;
              outflow += line.credit;
            }
            if (acc.type === 'Revenue') revenue += line.credit;
            if (acc.type === 'Expense') expenses += line.debit;
          });
        }
      });

      quotations.forEach(q => {
        const qDate = new Date(q.date);
        if (qDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) === month && q.status === 'approved') {
          monthQuotes.push(q);
        }
      });

      return { 
        month, inflow, outflow, revenue, expenses, netCash: inflow - outflow,
        _entries: monthEntries,
        _quotes: monthQuotes
      };
    });

    // 2. A/R Aging
    const today = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const agingData = [
      { name: 'Current (0-30)', value: 0, color: '#10b981', _items: [] as any[] },
      { name: '31-60 Days', value: 0, color: '#f59e0b', _items: [] as any[] },
      { name: '61-90 Days', value: 0, color: '#f43f5e', _items: [] as any[] },
      { name: '90+ Days', value: 0, color: '#7f1d1d', _items: [] as any[] },
    ];

    quotations.filter(q => q.status === 'approved' && q.paymentStatus !== 'Done').forEach(q => {
      const ageDays = (today - q.date) / dayInMs;
      if (ageDays <= 30) { agingData[0].value += q.grandTotal; agingData[0]._items.push(q); }
      else if (ageDays <= 60) { agingData[1].value += q.grandTotal; agingData[1]._items.push(q); }
      else if (ageDays <= 90) { agingData[2].value += q.grandTotal; agingData[2]._items.push(q); }
      else { agingData[3].value += q.grandTotal; agingData[3]._items.push(q); }
    });

    // 3. Expense Breakdown
    const expenseAccounts = accounts.filter(a => a.type === 'Expense' && a.balance > 0);
    const expenses = expenseAccounts.map(a => ({
      name: a.name,
      value: a.balance,
      _items: journalEntries.filter(je => {
        const lines = Array.isArray(je.lines) ? je.lines : (typeof je.lines === 'string' ? JSON.parse(je.lines) : []);
        return lines.some((l: any) => l.accountId === a.id);
      })
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // 4. Revenue by Client
    const clientRevMap: Record<string, { total: number; quotes: any[] }> = {};
    quotations.filter(q => q.status === 'approved').forEach(q => {
      if (!clientRevMap[q.clientId]) clientRevMap[q.clientId] = { total: 0, quotes: [] };
      clientRevMap[q.clientId].total += q.grandTotal;
      clientRevMap[q.clientId].quotes.push(q);
    });
    const clientRevenue = Object.entries(clientRevMap).map(([id, data]) => ({
      name: clients.find(c => c.id === id)?.name || 'Unknown',
      revenue: data.total,
      _items: data.quotes
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // 5. VAT Liability Trend
    const vat = monthLabels.map(month => {
      let outputVat = 0;
      let inputVat = 0;
      const vatJe: any[] = [];
      journalEntries.forEach(je => {
        const jeMonth = new Date(je.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (jeMonth === month) {
          const lines = Array.isArray(je.lines) ? je.lines : (typeof je.lines === 'string' ? JSON.parse(je.lines) : []);
          const hasVat = lines.some((l: any) => {
            const acc = accounts.find(a => a.id === l.accountId);
            return acc?.code === '2200' || acc?.code === '1500';
          });
          if (hasVat) {
            vatJe.push(je);
            lines.forEach((line: any) => {
              const acc = accounts.find(a => a.id === line.accountId);
              if (acc?.code === '2200') outputVat += line.credit;
              if (acc?.code === '1500') inputVat += line.debit;
            });
          }
        }
      });
      return { month, liability: outputVat - inputVat, _items: vatJe };
    });

    return { monthly, aging: agingData.filter(d => d.value > 0), expenses, clientRevenue, vat };
  }, [isLoaded, journalEntries, accounts, quotations, clients, period]);

  const handleChartClick = (data: any, titlePrefix: string, type: 'quotations' | 'entries') => {
    if (!data) return;
    const payload = data.activePayload?.[0]?.payload || data;
    const items = type === 'quotations' ? (payload._quotes || payload._items) : payload._entries || payload._items;
    
    if (items && items.length > 0) {
      setSelectedDetails({
        title: `${titlePrefix}: ${payload.month || payload.name}`,
        type,
        items
      });
    }
  };

  if (!isLoaded) return <div className="p-8 text-white">Loading Financial Engine...</div>;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#6366f1'];

  return (
    <div className="fade-in space-y-8 pb-12 relative">
      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Financial Performance Graphs</h2>
          <p className="premium-subtitle">Real-time synchronization with General Ledger. Click bars to view details.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
          {[3, 6, 12, 24].map(m => (
            <button
              key={m}
              onClick={() => setPeriod(m)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                period === m ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white'
              )}
            >
              {m}M
            </button>
          ))}
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Calendar size={16} className="text-muted mr-2 ml-1" />
        </div>
      </header>

      {/* View Modal Integration */}
      {viewQuotation && (
        <ViewQuotationModal 
          quotation={viewQuotation} 
          client={clients.find(c => c.id === viewQuotation.clientId)} 
          onClose={() => setViewQuotation(null)} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Cash Flow Trend */}
        <div className="glass-panel p-6 hover:border-primary/30 transition-colors group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="premium-label !text-white !text-sm">Cash Flow Trend</h3>
            <span className="premium-label !text-primary !text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">Click to Inspect</span>
          </div>
          <div className="h-[300px] cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthly} onClick={(e) => handleChartClick(e, 'Cash Flow Documents', 'entries')}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Legend />
                <Bar dataKey="inflow" name="Cash In" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Cash Out" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Revenue vs Expenses */}
        <div className="glass-panel p-6 hover:border-primary/30 transition-colors group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="premium-label !text-white !text-sm">Revenue vs Expenses</h3>
            <span className="premium-label !text-primary !text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">Inspect Revenue</span>
          </div>
          <div className="h-[300px] cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.monthly} onClick={(e) => handleChartClick(e, 'Approved Revenue Items', 'quotations')}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.1} />
                <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" barSize={20} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. A/R Aging */}
        <div className="glass-panel p-6 hover:border-primary/30 transition-colors group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="premium-label !text-white !text-sm">Accounts Receivable Aging</h3>
            <span className="premium-label !text-primary !text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">See Unpaid Invoices</span>
          </div>
          <div className="h-[300px] cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.aging} layout="vertical" onClick={(e) => handleChartClick(e, 'Overdue Quotations', 'quotations')}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Bar dataKey="value" name="Amount Overdue">
                  {chartData.aging.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Expense Breakdown */}
        <div className="glass-panel p-6 hover:border-primary/30 transition-colors group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="premium-label !text-white !text-sm">Top Expense Categories</h3>
            <span className="premium-label !text-primary !text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">View Vouchers</span>
          </div>
          <div className="h-[300px] cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.expenses}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(e) => handleChartClick(e, 'Expense Journal Entries', 'entries')}
                >
                  {chartData.expenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Revenue by Client */}
        <div className="glass-panel p-6 hover:border-primary/30 transition-colors group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="premium-label !text-white !text-sm">Top Revenue by Client</h3>
            <span className="premium-label !text-primary !text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">Client Quotations</span>
          </div>
          <div className="h-[300px] cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.clientRevenue} layout="vertical" onClick={(e) => handleChartClick(e, 'Client Documents', 'quotations')}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={120} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. VAT Liability Tracking */}
        <div className="glass-panel p-6 hover:border-primary/30 transition-colors group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="premium-label !text-white !text-sm">VAT Liability (ZATCA)</h3>
            <span className="premium-label !text-primary !text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">VAT Vouchers</span>
          </div>
          <div className="h-[300px] cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.vat} onClick={(e) => handleChartClick(e, 'VAT Related Entries', 'entries')}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Legend />
                <Line type="stepAfter" dataKey="liability" name="VAT Liability" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border-primary/20">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-xl font-medium text-white">{selectedDetails.title}</h3>
                <p className="text-sm text-muted mt-1">Underlying {selectedDetails.type === 'quotations' ? 'Quotations & Invoices' : 'Journal Entries'}</p>
              </div>
              <button onClick={() => setSelectedDetails(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} className="text-muted hover:text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[12px] text-muted uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Ref/Number</th>
                    <th className="pb-4">Description</th>
                    <th className="pb-4 text-right">Amount</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedDetails.items.filter(Boolean).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 text-sm text-muted">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 text-sm font-medium text-white">
                        {item.number || (item.id ? item.id.substring(0,8) : 'N/A')}
                      </td>
                      <td className="py-4 text-sm text-muted max-w-xs truncate">
                        {item.description || item.projectName || item.subject || 'General Entry'}
                      </td>
                      <td className="py-4 text-sm font-medium text-white text-right">
                        {formatCurrency(item.grandTotal || (item.lines?.reduce((s:any, l:any)=> s + l.debit, 0) || 0))}
                      </td>
                      <td className="py-4 text-right">
                        {selectedDetails.type === 'quotations' ? (
                          <div className="flex justify-end gap-2">
                            {isMounted && item.clientId && (
                              (() => {
                                const client = clients.find(c => c.id === item.clientId);
                                if (!client) return <span className="text-[12px] text-red-400">Client Missing</span>;
                                return (
                                  <>
                                    <button onClick={() => setViewQuotation(item)} className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors">
                                      <Eye size={16} />
                                    </button>
                                    <PDFDownloadLink
                                      document={<QuotationPDF quotation={item} client={client} settings={settings} />}
                                      fileName={`Quote_${item.number || 'Draft'}.pdf`}
                                      className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors"
                                    >
                                      {/* @ts-ignore */}
                                      {({ loading }) => <Download size={16} className={loading ? 'animate-pulse' : ''} />}
                                    </PDFDownloadLink>
                                  </>
                                );
                              })()
                            )}
                          </div>
                        ) : (
                          <button className="p-2 hover:bg-white/10 rounded-lg text-muted transition-colors">
                            <Eye size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center">
              <p className="text-sm text-muted">Total items: {selectedDetails.items.length}</p>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-primary px-6 py-2 rounded-xl text-white font-medium hover:scale-105 transition-all shadow-lg shadow-primary/20"
              >
                <FileText size={18} />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


