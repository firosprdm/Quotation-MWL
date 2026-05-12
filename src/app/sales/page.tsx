'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, 
  Search, 
  Download, 
  Eye,
  ShoppingCart,
  TrendingUp,
  Pencil,
  Trash2
} from 'lucide-react';
import styles from '../quotations/quotations.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotationPDF } from '@/components/QuotationPDF';
import { ViewQuotationModal } from '@/components/ViewQuotationModal';
import { OnDemandPDFDownload } from '@/components/OnDemandPDFDownload';
import { formatCurrency, formatNumber } from '@/lib/format';
import { StatusChangeModal, StatusChangeData } from '@/components/StatusChangeModal';

export default function SalesPage() {
  const { quotations, clients, settings, updateQuotation, deleteQuotation, currentUser } = useApp();
  const [viewQuotation, setViewQuotation] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [pendingPoChange, setPendingPoChange] = useState<{ quotationId: string; quotationNumber: string; clientName: string } | null>(null);
  const PAGE_SIZE = 25;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => { setPage(1); }, [search]);
  
  // Helper: normalize salesStatus to a canonical value
  const normalizeSalesStatus = (q: any) => {
    const s = (q.salesStatus || '').toLowerCase();
    const hasPO = s === 'po recieved' || s === 'po received' || !!q.poNumber;
    return hasPO ? 'PO recieved' : 'PO pending';
  };

  // Helper: display label
  const salesStatusLabel = (q: any) => {
    const norm = normalizeSalesStatus(q);
    return norm === 'PO recieved' ? 'PO Received' : 'PO Pending';
  };
  
  const salesStatusOptions = [
    { value: 'PO pending', label: 'PO Pending' },
    { value: 'PO recieved', label: 'PO Received' },
  ];
  
  // Filter for approved quotations only
  const salesQuotations = quotations.filter(q => q.status === 'approved');

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredQuotations = React.useMemo(() => {
    let items = salesQuotations.filter(q => {
      const client = clients.find(c => c.id === q.clientId);
      const searchStr = `${q.number} ${client?.name || ''}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });

    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'number':
            aValue = a.number;
            bValue = b.number;
            break;
          case 'client':
            aValue = clients.find(c => c.id === a.clientId)?.name || '';
            bValue = clients.find(c => c.id === b.clientId)?.name || '';
            break;
          case 'date':
            aValue = a.date;
            bValue = b.date;
            break;
          case 'total':
            aValue = a.grandTotal;
            bValue = b.grandTotal;
            break;
          case 'status':
            aValue = normalizeSalesStatus(a);
            bValue = normalizeSalesStatus(b);
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
  }, [salesQuotations, clients, search, sortConfig]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <span className="opacity-30">↕</span>;
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const totalSales = filteredQuotations.reduce((acc, q) => acc + q.grandTotal, 0);
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / PAGE_SIZE));
  const pagedQuotations = filteredQuotations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="fade-in">
      {viewQuotation && (
        <ViewQuotationModal 
          quotation={viewQuotation} 
          client={clients.find(c => c.id === viewQuotation.clientId)} 
          onClose={() => setViewQuotation(null)} 
        />
      )}
      {pendingPoChange && (
        <StatusChangeModal
          type="po-received"
          quotationNumber={pendingPoChange.quotationNumber}
          clientName={pendingPoChange.clientName}
          onConfirm={(data: StatusChangeData) => {
            updateQuotation(pendingPoChange.quotationId, {
              salesStatus: 'PO recieved',
              poNumber: data.poNumber,
              poDate: data.poDate,
            } as any);
            setPendingPoChange(null);
          }}
          onCancel={() => setPendingPoChange(null)}
        />
      )}
      
      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Sales Dashboard</h2>
          <p className="premium-subtitle">All approved quotations and closed deals.</p>
        </div>
        <div className={clsx('glass-panel', styles.statCard)}>
          <div className={styles.statIcon}>
            <TrendingUp size={24} className="text-green-400" />
          </div>
          <div>
            <label className="premium-label">Total Revenue</label>
            <p className="text-xl font-normal text-white">{formatCurrency(totalSales)}</p>
          </div>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={clsx('glass-panel', styles.searchBar)}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search sales by number or client..." 
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
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('number')}>
                No. <SortIcon column="number" />
              </th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                Approval Date <SortIcon column="date" />
              </th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>
                Grand Total <SortIcon column="total" />
              </th>
              <th className="premium-label">PO Status</th>
              <th className="premium-label">PO Number</th>
              <th className="premium-label">PO Date</th>
              <th className="premium-label">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  {search ? 'No sales match your search.' : 'No sales recorded yet. Approve quotations to see them here.'}
                </td>
              </tr>
            ) : (
              pagedQuotations.map((q) => (
                <tr key={q.id}>
                  <td className="font-normal text-white">
                    {q.number}
                    {q.revision > 0 && <span className="text-sm text-muted ml-1">-R{q.revision}</span>}
                  </td>
                  <td className="text-white/70">{clients.find(c => c.id === q.clientId)?.name || 'Unknown'}</td>
                  <td className="text-white/70">{new Date(q.approvalDate || q.date).toLocaleDateString()}</td>
                  <td className="font-normal text-green-400">{formatCurrency(q.grandTotal)}</td>
                  <td className="text-center">
                    <div className="flex justify-center relative group">
                      {/* Visible Premium Badge with Days */}
                      <div className={clsx(
                        "flex items-center justify-center text-[10px] font-bold uppercase tracking-wider min-w-[120px] h-7 border rounded-lg px-2 text-center pointer-events-none transition-all group-hover:brightness-110",
                        normalizeSalesStatus(q) === 'PO recieved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {(() => {
                          const days = Math.floor((Date.now() - (q.approvalDate || q.date)) / 86400000);
                          const label = normalizeSalesStatus(q) === 'PO recieved' ? 'PO RECEIVED' : 'AWAITING PO';
                          return (label === 'PO RECEIVED') ? label : `${label} (${days}D)`;
                        })()}
                        <div className="ml-1 opacity-40">▼</div>
                      </div>

                      {/* Invisible Select overlay - opens modal on PO Received */}
                      <select 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={normalizeSalesStatus(q)}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          const currentStatus = normalizeSalesStatus(q);
                          
                          if (newStatus === 'PO recieved' && currentStatus !== 'PO recieved') {
                            // Open modal to capture PO details
                            const client = clients.find(c => c.id === q.clientId);
                            setPendingPoChange({
                              quotationId: q.id,
                              quotationNumber: q.number,
                              clientName: client?.name || 'Unknown',
                            });
                            return;
                          }
                          
                          if (currentStatus === 'PO recieved' && newStatus !== 'PO recieved') {
                            // Revert - clear PO data
                            updateQuotation(q.id, {
                              salesStatus: newStatus,
                              poNumber: '',
                              poDate: null,
                            } as any);
                            return;
                          }

                          updateQuotation(q.id, { salesStatus: newStatus } as any);
                        }}
                      >
                        <option value="PO pending">Awaiting PO</option>
                        <option value="PO recieved">PO Received</option>
                      </select>
                    </div>
                  </td>
                  <td className="text-white/70 text-sm font-medium text-center">{q.poNumber || '-'}</td>
                  <td className="text-white/70 text-sm text-center">{q.poDate ? new Date(q.poDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn} 
                        title="View"
                        onClick={() => setViewQuotation(q)}
                      >
                        <Eye size={16} />
                      </button>
                      <Link 
                        href={`/quotations/edit/${q.id}`}
                        className={styles.actionBtn} 
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      {(() => {
                        const client = clients.find(c => c.id === q.clientId);
                        if (client) {
                          return (
                            <OnDemandPDFDownload 
                              document={<QuotationPDF quotation={q} client={client} settings={settings} />} 
                              fileName={`Sale_${q.number}.pdf`}
                              className={styles.actionBtn}
                              title="Download PDF"
                              icon={<Download size={16} />}
                            />
                          );
                        }
                        return (
                          <button 
                            className={clsx(styles.actionBtn, "opacity-50 cursor-not-allowed text-red-400")} 
                            title="Missing Client Information"
                            disabled
                          >
                            <Download size={16} />
                          </button>
                        );
                      })()}
                      {currentUser?.role === 'admin' && (
                        <button 
                          type="button"
                          className={clsx(styles.actionBtn, styles.deleteBtn)} 
                          title="Delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this sales record?')) {
                              deleteQuotation(q.id);
                            }
                          }}
                        >
                          <Trash2 size={16} className="pointer-events-none" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-muted">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredQuotations.length)} of {filteredQuotations.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="glass-button px-3 py-1.5 text-sm disabled:opacity-30"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span className="text-sm font-medium text-white px-3">{page} / {totalPages}</span>
            <button
              className="glass-button px-3 py-1.5 text-sm disabled:opacity-30"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
