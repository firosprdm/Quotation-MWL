'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  Eye, 
  Pencil, 
  Trash2
} from 'lucide-react';
import styles from './quotations.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { OnDemandPDFDownload } from '@/components/OnDemandPDFDownload';
import { QuotationPDF } from '@/components/QuotationPDF';
import { ViewQuotationModal } from '@/components/ViewQuotationModal';
import { StatusChangeModal, StatusChangeData } from '@/components/StatusChangeModal';

export default function QuotationsPage() {
  const { quotations, clients, updateQuotation, deleteQuotation, settings, currentUser, loadMoreQuotations } = useApp();
  const [viewQuotation, setViewQuotation] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const [pendingChange, setPendingChange] = useState<{ quotationId: string; newStatus: string; quotationNumber: string; clientName: string } | null>(null);
  const PAGE_SIZE = 25;
  
  const statusOptions = [
    { value: 'sent', label: 'Sent' },
    { value: 'waiting', label: 'Waiting for approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'revised', label: 'Revised' },
  ];

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredQuotations = React.useMemo(() => {
    let items = quotations.filter(q => {
      const client = clients.find(c => c.id === q.clientId);
      const searchStr = `${q.number} ${client?.name || ''} ${q.ticketNumber || ''}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });

    if (sortConfig !== null) {
      const clientNameMap = new Map(clients.map(c => [c.id, c.name]));
      
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'number':
            aValue = a.number;
            bValue = b.number;
            break;
          case 'client':
            aValue = clientNameMap.get(a.clientId) || '';
            bValue = clientNameMap.get(b.clientId) || '';
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
            aValue = a.status;
            bValue = b.status;
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
  }, [quotations, clients, search, sortConfig]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <span className="opacity-30">↕</span>;
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / PAGE_SIZE));
  const pagedQuotations = filteredQuotations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when search changes
  React.useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="fade-in">
      {viewQuotation && (
        <ViewQuotationModal 
          quotation={viewQuotation} 
          client={clients.find(c => c.id === viewQuotation.clientId)} 
          onClose={() => setViewQuotation(null)} 
        />
      )}
      {pendingChange && (
        <StatusChangeModal
          type="approve-quotation"
          quotationNumber={pendingChange.quotationNumber}
          clientName={pendingChange.clientName}
          onConfirm={(data: StatusChangeData) => {
            updateQuotation(pendingChange.quotationId, {
              status: 'approved',
              approvalDate: data.approvalDate,
              salesStatus: 'PO pending',
              workStatus: 'Work pending',
              poNumber: '',
              poDate: null,
              completionDate: null
            } as any);
            setPendingChange(null);
          }}
          onCancel={() => setPendingChange(null)}
        />
      )}
      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Quotations</h2>
          <p className="premium-subtitle">All your issued and draft quotations.</p>
        </div>
        <Link href="/quotations/new" className={clsx('glass-button', styles.addButton)}>
          <Plus size={20} />
          <span>New Quotation</span>
        </Link>
      </header>

      <div className={styles.filters}>
        <div className={clsx('glass-panel', styles.searchBar)}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search by number or client..." 
            className={styles.searchInput} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="glass-button px-4 py-2 rounded-xl flex items-center gap-2">
          <Filter size={18} />
          Filter
        </button>
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
                Date <SortIcon column="date" />
              </th>
              <th className="premium-label">Approved Date</th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>
                Total <SortIcon column="total" />
              </th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('status')}>
                Status <SortIcon column="status" />
              </th>
              <th className="premium-label">Ticket No.</th>
              <th className="premium-label text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  {search ? 'No quotations match your search.' : 'No quotations found.'}
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
                  <td className="text-white/70">{new Date(q.date).toLocaleDateString()}</td>
                  <td className="text-white/70 font-medium">{q.approvalDate ? new Date(q.approvalDate).toLocaleDateString() : '-'}</td>
                  <td className="font-normal text-blue-400">{q.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="text-center">
                    <div className="flex justify-center relative group">
                      {/* Visible Premium Badge with Days */}
                      <div className={clsx(
                        "flex items-center justify-center text-[10px] font-bold uppercase tracking-wider min-w-[110px] h-7 border rounded-lg px-2 text-center pointer-events-none transition-all group-hover:brightness-110",
                        q.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                        q.status === 'rejected' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        q.status === 'revised'  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      )}>
                        {(() => {
                          const days = Math.floor((Date.now() - q.date) / 86400000);
                          const label = q.status === 'approved' ? 'APPROVED' : 
                                        q.status === 'rejected' ? 'REJECTED' : 
                                        q.status === 'revised'  ? 'REVISED' :
                                        q.status === 'waiting'  ? 'WAITING' : 'SENT';
                          return (q.status === 'approved' || q.status === 'rejected') ? label : `${label} (${days}D)`;
                        })()}
                        <div className="ml-1 opacity-40">▼</div>
                      </div>

                      {/* Invisible Select overlay - opens modal on approval */}
                      <select 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={q.status}
                        disabled={currentUser?.role === 'user' && q.status === 'approved'}
                        onChange={(e) => {
                          const newStatus = e.target.value as any;
                          if (currentUser?.role === 'user' && q.status === 'approved' && newStatus !== 'approved') {
                            return alert('Standard User cannot revert an Approved quotation.');
                          }

                          // Transition FROM Approved - clear downstream data immediately
                          if (q.status === 'approved' && newStatus !== 'approved') {
                            updateQuotation(q.id, {
                              status: newStatus,
                              salesStatus: 'PO pending',
                              poNumber: '',
                              poDate: null,
                              workStatus: 'Work pending',
                              completionDate: null,
                              approvalDate: null,
                              invoiceNumber: null,
                              invoiceDate: null,
                              paymentStatus: 'Payment Pending',
                              receivedAmount: 0,
                            } as any);
                            return;
                          }

                          // Transition TO Approved - open modal to capture approval date
                          if (newStatus === 'approved' && q.status !== 'approved') {
                            const client = clients.find(c => c.id === q.clientId);
                            setPendingChange({
                              quotationId: q.id,
                              newStatus,
                              quotationNumber: q.number,
                              clientName: client?.name || 'Unknown',
                            });
                            return;
                          }

                          // All other status changes - save immediately
                          updateQuotation(q.id, { status: newStatus });
                        }}
                      >
                        <option value="sent">Sent</option>
                        <option value="waiting">Waiting</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="revised">Revised</option>
                      </select>
                    </div>
                  </td>
                  <td className="text-white/70 text-sm font-mono">
                    {q.ticketNumber || '---'}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn} 
                        title="View"
                        onClick={() => setViewQuotation(q)}
                      >
                        <Eye size={18} className="icon-hover" />
                      </button>
                      <Link 
                        href={`/quotations/edit/${q.id}`}
                        className={styles.actionBtn} 
                        title="Edit"
                      >
                        <Pencil size={18} className="icon-hover" />
                      </Link>
                      {(() => {
                        const client = clients.find(c => c.id === q.clientId);
                        if (client) {
                          return (
                            <OnDemandPDFDownload 
                              document={<QuotationPDF quotation={q} client={client} settings={settings} />} 
                              fileName={`Quotation_${q.number}.pdf`}
                              className={styles.actionBtn}
                              title="Download PDF"
                              icon={<Download size={18} className="icon-hover" />}
                            />
                          );
                        }
                        return (
                          <button 
                            className={clsx(styles.actionBtn, "opacity-50 cursor-not-allowed text-red-400")} 
                            title="Missing Client Information"
                            disabled
                          >
                            <Download size={18} className="icon-hover" />
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
                            if (confirm('Are you sure you want to delete this quotation?')) {
                              deleteQuotation(q.id);
                            }
                          }}
                        >
                          <Trash2 size={18} className="icon-hover pointer-events-none" />
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

      {quotations.length >= 50 && quotations.length % 50 === 0 && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={async (e) => {
              const btn = e.currentTarget;
              btn.disabled = true;
              btn.innerHTML = 'Loading from Database...';
              await loadMoreQuotations();
              btn.innerHTML = 'Load More Database Records';
              btn.disabled = false;
            }}
            className="px-6 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all font-medium text-sm"
          >
            Load More Database Records
          </button>
        </div>
      )}


    </div>
  );
}
