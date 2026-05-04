'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, 
  Search, 
  Download, 
  Eye,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Zap,
  FileCode,
  Plus
} from 'lucide-react';
import styles from '../quotations/quotations.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { InvoicePDF } from '@/components/InvoicePDF';
import { ViewQuotationModal } from '@/components/ViewQuotationModal';
import QRCode from 'qrcode';
import { formatCurrency, formatNumber } from '@/lib/format';

const ZATCADownloadButton = ({ q, client, settings, className }: any) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      let qrDataUrl = null;
      if (q.qrCode) {
        qrDataUrl = await QRCode.toDataURL(q.qrCode, { margin: 1, width: 200 });
      }

      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(
        <InvoicePDF 
          quotation={q} 
          client={client} 
          settings={settings} 
          qrDataUrl={qrDataUrl} 
        />
      ).toBlob();

      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', `Invoice_${q.invoiceNumber || q.number}.pdf`);
      
      window.document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error('PDF Generation Error:', e);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      className={className} 
      disabled={loading}
      title="Download Invoice PDF"
    >
      <Receipt size={16} className={clsx(loading && "animate-pulse")} />
    </button>
  );
};

export default function InvoicesPage() {
  const { quotations = [], clients = [], settings, updateQuotation, finalizeInvoice, isLoaded } = useApp();
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Filter for approved quotations that are PO Received AND Work Done
  const invoiceQuotations = useMemo(() => {
    return quotations.filter(q => 
      q.status === 'approved' && 
      q.salesStatus === 'PO recieved' && 
      q.workStatus === 'Work Done'
    );
  }, [quotations]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredInvoices = useMemo(() => {
    let items = invoiceQuotations.filter(q => {
      const client = clients.find(c => c.id === q.clientId);
      const searchStr = `${q.number} ${client?.name || ''} ${q.invoiceNumber || ''}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });

    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'number':
            aValue = a.invoiceNumber || 'PENDING';
            bValue = b.invoiceNumber || 'PENDING';
            break;
          case 'client':
            aValue = clients.find(c => c.id === a.clientId)?.name || '';
            bValue = clients.find(c => c.id === b.clientId)?.name || '';
            break;
          case 'date':
            aValue = a.invoiceDate || a.date;
            bValue = b.invoiceDate || b.date;
            break;
          case 'total':
            aValue = a.grandTotal;
            bValue = b.grandTotal;
            break;
          case 'payment':
            aValue = a.paymentStatus || 'Payment Pending';
            bValue = b.paymentStatus || 'Payment Pending';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [invoiceQuotations, clients, search, sortConfig]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <span className="opacity-30">↕</span>;
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const downloadXML = async (q: any) => {
    if (!q.uuid) return;
    try {
      const { generateUBL21XML } = await import('@/lib/ubl-generator');
      const client = clients.find(c => c.id === q.clientId);
      if (!client) return;

      const xml = generateUBL21XML({
        quotation: q,
        client,
        settings,
        pih: q.pih,
        icv: q.icv,
        uuid: q.uuid
      });

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${q.invoiceNumber || q.number}_ZATCA.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate XML for download', e);
    }
  };

  const totalInvoiced = filteredInvoices.reduce((acc, q) => acc + q.grandTotal, 0);

  return (
    <div className="fade-in">
      {viewInvoice && (
        <ViewQuotationModal 
          quotation={viewInvoice} 
          client={clients.find(c => c.id === viewInvoice.clientId)} 
          onClose={() => setViewInvoice(null)} 
        />
      )}
      
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Invoices</h2>
          <p className={styles.subtitle}>Manage tax invoices for completed and PO-received projects.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className={clsx('glass-panel', styles.statCard, '!py-2 !px-4')}>
            <div className={clsx(styles.statIcon, '!w-10 !h-10')}>
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Invoiced</label>
              <p className="text-lg font-bold text-white leading-tight">{formatCurrency(totalInvoiced)}</p>
            </div>
          </div>
          <Link href="/quotations/new?type=invoice" className={clsx('glass-button', styles.addButton, 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30')}>
            <Plus size={20} />
            <span>Create Invoice</span>
          </Link>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={clsx('glass-panel', styles.searchBar)}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search invoices by number or client..." 
            className={styles.searchInput} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={clsx('glass-panel', styles.tableWrapper)}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('number')}>
                Invoice No. <SortIcon column="number" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                Date <SortIcon column="date" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>
                Grand Total <SortIcon column="total" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('payment')}>
                Payment Status <SortIcon column="payment" />
              </th>
              <th>ZATCA</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoaded ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading invoices...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  {search ? 'No invoices match your search.' : 'No invoices ready. Projects must be "PO Recieved" and "Work Done".'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((q) => {
                const invDate = q.invoiceDate || q.date;
                const isOverdue = q.paymentStatus !== 'Done' && (Date.now() - invDate > 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={q.id}>
                    <td className="font-bold text-white">
                      {q.invoiceNumber || (q.uuid ? 'GENERATING...' : 'PENDING')}
                    </td>
                    <td>{clients.find(c => c.id === q.clientId)?.name || 'Unknown'}</td>
                    <td>{new Date(invDate).toLocaleDateString()}</td>
                    <td className="font-bold text-emerald-400">{formatCurrency(q.grandTotal)}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-3 h-3 rounded-full',
                          q.paymentStatus === 'Done' ? styles.paymentDone : (isOverdue ? styles.paymentOverdue : styles.paymentPending)
                        )} />
                        <select
                          className={clsx(
                            'glass-input flex-1', 
                            styles.statusSelect,
                            q.paymentStatus === 'Done' ? 'status-done' : (isOverdue ? 'status-overdue' : 'status-pending')
                          )}
                          value={q.paymentStatus === 'Done' ? 'Done' : (isOverdue ? 'OVERDUE' : 'Pending')}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateQuotation(q.id, { paymentStatus: val === 'Done' ? 'Done' : 'Payment Pending' });
                          }}
                        >
                          <option value="Pending" disabled={q.paymentStatus === 'Done'} className="text-gray-900">Pending</option>
                          <option value="OVERDUE" disabled={q.paymentStatus === 'Done'} className="text-gray-900">OVERDUE</option>
                          <option value="Done" className="text-gray-900">Done</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      {q.uuid ? (
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                          <ShieldCheck size={12} />
                          Ready
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-orange-400 font-medium bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
                          <Zap size={12} />
                          Pending
                        </div>
                      )}
                    </td>
                    <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn} 
                        title="View"
                        onClick={() => setViewInvoice(q)}
                      >
                        <Eye size={16} />
                      </button>
                      {clients.find(c => c.id === q.clientId) && (
                        <ZATCADownloadButton 
                          q={q} 
                          client={clients.find(c => c.id === q.clientId)!} 
                          settings={settings}
                          className={styles.actionBtn}
                        />
                      )}
                      {q.uuid && (
                        <button 
                          className={clsx(styles.actionBtn, "text-emerald-400 hover:bg-emerald-400/10 border-emerald-400/30")}
                          title="Download ZATCA XML"
                          onClick={() => downloadXML(q)}
                        >
                          <FileCode size={16} />
                        </button>
                      )}
                      {!q.uuid && (
                        <button 
                          className={clsx(styles.actionBtn, "text-orange-400 border-orange-400/30 hover:bg-orange-400/10")} 
                          title="Finalize & Sign (ZATCA)"
                          onClick={() => {
                            if (confirm('Finalizing will generate the tamper-proof ZATCA chain (UUID, ICV, PIH). Proceed?')) {
                              finalizeInvoice(q.id);
                            }
                          }}
                        >
                          <ShieldCheck size={16} />
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
