'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Award, Download, CheckCircle, Clock } from 'lucide-react';
import styles from '../quotations/quotations.module.css';
import { clsx } from 'clsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CertificatePDF } from '@/components/CertificatePDF';

export default function CertificatesPage() {
  const { quotations, clients, settings, updateQuotation } = useApp();
  const [search, setSearch] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
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
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Completion Certificates</h2>
          <p className={styles.subtitle}>Generate and download certificates for approved projects.</p>
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
              <th className="w-40 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('number')}>
                Quotation No. <SortIcon column="number" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="w-[300px] cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('reference')}>
                Reference (PO/Ticket) <SortIcon column="reference" />
              </th>
              <th className="w-48 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('status')}>
                Work Status <SortIcon column="status" />
              </th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  {search ? 'No certificates match your filter.' : 'No approved quotations available to certify.'}
                </td>
              </tr>
            ) : (
              filteredQuotations.map((q) => {
                const client = clients.find(c => c.id === q.clientId);
                const isCompleted = q.workStatus === 'Work Done';
                
                return (
                  <tr key={q.id}>
                    <td className="font-bold text-white">
                      {q.number}
                      {q.revision > 0 && <span className="text-xs text-muted ml-1">-R{q.revision}</span>}
                    </td>
                    <td>{client?.name || 'Unknown'}</td>
                    <td>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted uppercase font-bold w-16">PO #</span>
                          <input
                            type="text"
                            placeholder="Enter PO..."
                            className={clsx('glass-input', styles.smallInput)}
                            value={q.poNumber || ''}
                            onChange={(e) => updateQuotation(q.id, { poNumber: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted uppercase font-bold w-16">Ticket #</span>
                          <input
                            type="text"
                            placeholder="Enter Ticket..."
                            className={clsx('glass-input', styles.smallInput)}
                            value={q.ticketNumber || ''}
                            onChange={(e) => updateQuotation(q.id, { ticketNumber: e.target.value })}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className={clsx(
                          'glass-input', 
                          styles.statusSelect,
                          q.workStatus === 'Work Done' ? styles.workDone : 
                          q.workStatus === 'Work On going' ? styles.workOngoing : 
                          styles.workPending
                        )}
                        value={q.workStatus || 'Work pending'}
                        onChange={(e) => updateQuotation(q.id, { workStatus: e.target.value as any })}
                      >
                        <option value="Work pending">Work pending</option>
                        <option value="Work On going">Work On going</option>
                        <option value="Work Done">Work Done</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        {client ? (
                          <PDFDownloadLink 
                            document={<CertificatePDF quotation={q} client={client} settings={settings} />} 
                            fileName={`Certificate_${q.number}.pdf`}
                            className={clsx(
                              styles.downloadBtn,
                              isCompleted ? styles.certReady : styles.certNotReady
                            )}
                          >
                            {/* @ts-ignore */}
                            {({ loading }) => (
                              <>
                                <Download size={18} className={styles.downloadIcon} />
                                <span>{loading ? 'Generating...' : 'Download Certificate'}</span>
                              </>
                            )}
                          </PDFDownloadLink>
                        ) : (
                          <span className="text-sm text-red-400">Client Missing</span>
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
