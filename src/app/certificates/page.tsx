'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Eye, Pencil, Trash2, Award, Download, CheckCircle, Clock } from 'lucide-react';
import styles from '../quotations/quotations.module.css';
import { clsx } from 'clsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CertificatePDF } from '@/components/CertificatePDF';
import { ViewCertificateModal } from '@/components/ViewCertificateModal';
import { OnDemandPDFDownload } from '@/components/OnDemandPDFDownload';
import Link from 'next/link';
import { StatusChangeModal, StatusChangeData } from '@/components/StatusChangeModal';

export default function CertificatesPage() {
  const { quotations, clients, settings, updateQuotation, deleteQuotation, currentUser } = useApp();
  const [search, setSearch] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [viewingQuotation, setViewingQuotation] = React.useState<string | null>(null);
  const [pendingWorkChange, setPendingWorkChange] = React.useState<{ quotationId: string; quotationNumber: string; clientName: string } | null>(null);

  const statusOptions = [
    { value: 'Work pending', label: 'Work pending' },
    { value: 'Work On going', label: 'Work On going' },
    { value: 'Work Done', label: 'Work Done' },
  ];

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // As per requirement, show all approved quotations here
  const approvedQuotations = quotations.filter(q => q.status === 'approved');

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredQuotations = React.useMemo(() => {
    let items = approvedQuotations.filter(q => {
      const client = clients.find(c => c.id === q.clientId);
      const searchStr = `${q.number} ${client?.name || ''} ${q.poNumber || ''} ${q.ticketNumber || ''}`.toLowerCase();
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
          case 'reference':
            aValue = `${a.poNumber || ''} ${a.ticketNumber || ''}`;
            bValue = `${b.poNumber || ''} ${b.ticketNumber || ''}`;
            break;
          case 'status':
            aValue = a.workStatus || '';
            bValue = b.workStatus || '';
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
  }, [approvedQuotations, clients, search, sortConfig]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <span className="opacity-30">↕</span>;
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="fade-in">
      {viewingQuotation && (() => {
        const q = quotations.find(qt => qt.id === viewingQuotation);
        const client = clients.find(c => c.id === q?.clientId);
        if (!q) return null;
        return (
          <ViewCertificateModal
            quotation={q}
            client={client}
            onClose={() => setViewingQuotation(null)}
          />
        );
      })()}
      {pendingWorkChange && (
        <StatusChangeModal
          type="work-done"
          quotationNumber={pendingWorkChange.quotationNumber}
          clientName={pendingWorkChange.clientName}
          onConfirm={(data: StatusChangeData) => {
            updateQuotation(pendingWorkChange.quotationId, {
              workStatus: 'Work Done',
              completionDate: data.completionDate,
            } as any);
            setPendingWorkChange(null);
          }}
          onCancel={() => setPendingWorkChange(null)}
        />
      )}
      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Completion Certificates</h2>
          <p className="premium-subtitle">Generate and download certificates for approved projects.</p>
        </div>
        <div className="flex-1 max-w-md ml-auto">
          <input
            type="text"
            placeholder="Filter by Quotation, Client, PO or Ticket..."
            className="glass-input w-full px-4 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className={clsx('glass-panel', styles.tableWrapper)}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className="premium-label w-40 cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => requestSort('number')}>
                Quotation No. <SortIcon column="number" />
              </th>
               <th className="premium-label cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => requestSort('client')}>
                 Client <SortIcon column="client" />
               </th>
               <th className="premium-label whitespace-nowrap">PO Number</th>
               <th className="premium-label whitespace-nowrap">PO Date</th>
               <th className="premium-label whitespace-nowrap">Ticket Number</th>
               <th className="premium-label w-36 cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => requestSort('status')}>
                 Work Status <SortIcon column="status" />
               </th>
               <th className="premium-label whitespace-nowrap">Completed Date</th>
               <th className="premium-label w-32 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
               <tr>
                 <td colSpan={8} className={styles.emptyState}>
                   {search ? 'No certificates match your filter.' : 'No approved quotations available to certify.'}
                 </td>
               </tr>
            ) : (
              filteredQuotations.map((q) => {
                const client = clients.find(c => c.id === q.clientId);
                
                return (
                  <tr key={q.id}>
                    <td className="font-medium text-white whitespace-nowrap">
                      {q.number}
                      {q.revision > 0 && <span className="text-sm text-muted ml-1">-R{q.revision}</span>}
                    </td>
                    <td className="whitespace-nowrap text-white/70">{client?.name || 'Unknown'}</td>
                    <td className="whitespace-nowrap text-white/70 text-sm font-medium">{q.poNumber || '-'}</td>
                    <td className="whitespace-nowrap text-white/70 text-sm">{q.poDate ? new Date(q.poDate).toLocaleDateString() : '-'}</td>
                    <td className="whitespace-nowrap text-white/70 text-sm font-medium">{q.ticketNumber || '-'}</td>
                    <td className="text-center align-middle">
                      <div className="flex justify-center relative group">
                        {/* Visible Premium Badge with Days */}
                        <div className={clsx(
                          "flex items-center justify-center text-[10px] font-bold uppercase tracking-wider min-w-[130px] h-7 border rounded-lg px-2 text-center pointer-events-none transition-all group-hover:brightness-110",
                          q.workStatus === 'Work Done' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          q.workStatus === 'Work On going' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {(() => {
                            const days = Math.floor((Date.now() - (q.approvalDate || q.date)) / 86400000);
                            const label = q.workStatus === 'Work Done' ? 'COMPLETED' : 
                                          q.workStatus === 'Work On going' ? 'ON GOING' : 'WORK PENDING';
                            return (label === 'COMPLETED') ? label : `${label} (${days}D)`;
                          })()}
                          <div className="ml-1 opacity-40">▼</div>
                        </div>

                        {/* Invisible Select overlay - opens modal on Work Done */}
                        <select 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={q.workStatus || 'Work pending'}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            const currentStatus = q.workStatus;
                            
                            if (newStatus === 'Work Done' && currentStatus !== 'Work Done') {
                              // Open modal to capture completion date
                              const client = clients.find(c => c.id === q.clientId);
                              setPendingWorkChange({
                                quotationId: q.id,
                                quotationNumber: q.number,
                                clientName: client?.name || 'Unknown',
                              });
                              return;
                            }
                            
                            if (currentStatus === 'Work Done' && newStatus !== 'Work Done') {
                              // Reverting - clear completion data
                              updateQuotation(q.id, {
                                workStatus: newStatus,
                                completionDate: null,
                              } as any);
                              return;
                            }
                            
                            updateQuotation(q.id, { workStatus: newStatus } as any);
                          }}
                          disabled={currentUser?.role !== 'admin' && q.workStatus === 'Work Done'}
                        >
                          <option value="Work pending">Work pending</option>
                          <option value="Work On going">Work On going</option>
                          <option value="Work Done">Work Done</option>
                        </select>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-white/70 text-sm text-center font-medium">
                      {q.completionDate ? new Date(q.completionDate).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={styles.actionBtn} 
                          title="View"
                          onClick={() => setViewingQuotation(q.id)}
                        >
                          <Eye size={18} />
                        </button>
                        <Link 
                          href={`/quotations/edit/${q.id}`}
                          className={styles.actionBtn} 
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </Link>
                        {(() => {
                          if (client) {
                            return (
                              <OnDemandPDFDownload 
                                document={<CertificatePDF quotation={q} client={client} settings={settings} />} 
                                fileName={`Certificate_${q.number}.pdf`}
                                className={clsx(
                                  styles.downloadBtn,
                                  styles.certReady,
                                  'px-3 py-1.5 flex items-center gap-2'
                                )}
                                title="Download PDF"
                                icon={<><Download size={14} className={clsx(styles.downloadIcon)} /><span className="text-sm font-normal">Download</span></>}
                              />
                            );
                          }
                          return (
                            <button 
                              className={clsx(styles.downloadBtn, styles.certNotReady, "px-3 py-1.5 flex items-center gap-2 opacity-50 cursor-not-allowed")} 
                              title="Missing Client Information"
                              disabled
                            >
                              <Download size={14} className="text-red-400" />
                              <span className="text-sm font-normal text-red-400">Missing Client</span>
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
                              if (confirm('Are you sure you want to delete this completion record?')) {
                                deleteQuotation(q.id);
                              }
                            }}
                          >
                            <Trash2 size={18} className="pointer-events-none" />
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
