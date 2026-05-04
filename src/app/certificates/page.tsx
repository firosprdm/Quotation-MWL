'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Award, Download, CheckCircle, Clock } from 'lucide-react';
import styles from '../quotations/quotations.module.css';
import { clsx } from 'clsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CertificatePDF } from '@/components/CertificatePDF';

export default function CertificatesPage() {
  const { quotations, clients, settings, updateQuotation, currentUser } = useApp();
  const [search, setSearch] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

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
              <th className="w-40 cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => requestSort('number')}>
                Quotation No. <SortIcon column="number" />
              </th>
              <th className="w-[300px] cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => requestSort('reference')}>
                Reference (PO/Ticket) <SortIcon column="reference" />
              </th>
              <th className="w-36 cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => requestSort('status')}>
                Work Status <SortIcon column="status" />
              </th>
              <th className="w-32 text-right whitespace-nowrap">Action</th>
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
                    <td className="font-bold text-white whitespace-nowrap">
                      {q.number}
                      {q.revision > 0 && <span className="text-xs text-muted ml-1">-R{q.revision}</span>}
                    </td>
                    <td className="whitespace-nowrap truncate max-w-[300px]">{client?.name || 'Unknown'}</td>
                    <td className="whitespace-nowrap align-middle">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted uppercase font-bold">PO</span>
                          <input
                            type="text"
                            placeholder="Enter PO..."
                            className="glass-input w-52 py-1 px-3 text-xs h-8"
                            value={q.poNumber || ''}
                            onChange={(e) => updateQuotation(q.id, { poNumber: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted uppercase font-bold">Ticket</span>
                          <input
                            type="text"
                            placeholder="Enter Ticket..."
                            className="glass-input w-52 py-1 px-3 text-xs h-8"
                            value={q.ticketNumber || ''}
                            onChange={(e) => updateQuotation(q.id, { ticketNumber: e.target.value })}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap align-middle">
                      <select
                        className={clsx(
                          'glass-input w-full py-1 px-2 text-xs h-8', 
                          styles.statusSelect,
                          q.workStatus === 'Work Done' ? 'status-done' : 
                          q.workStatus === 'Work On going' ? 'status-ongoing' : 
                          'status-pending'
                        )}
                        value={q.workStatus || 'Work pending'}
                        onChange={(e) => updateQuotation(q.id, { workStatus: e.target.value as any })}
                        disabled={currentUser?.role !== 'admin' && q.workStatus === 'Work Done'}
                      >
                        <option value="Work pending" className="text-gray-900">Work pending</option>
                        <option value="Work On going" className="text-gray-900">Work On going</option>
                        <option value="Work Done" className="text-gray-900">Work Done</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap align-middle">
                      <div className="flex justify-end">
                        {isMounted && client ? (
                          <PDFDownloadLink 
                            document={<CertificatePDF quotation={q} client={client} settings={settings} />} 
                            fileName={`Certificate_${q.number}.pdf`}
                            className={clsx(
                              styles.downloadBtn,
                              isCompleted ? styles.certReady : styles.certNotReady,
                              'px-3 py-1.5' // Tighter padding for button
                            )}
                          >
                            {/* @ts-ignore */}
                            {({ loading }) => (
                              <div className="flex items-center gap-2">
                                <Download size={14} className={styles.downloadIcon} />
                                <span className="text-xs font-semibold">{loading ? 'Gen...' : 'Download'}</span>
                              </div>
                            )}
                          </PDFDownloadLink>
                        ) : client ? (
                          <div className="px-3 py-1.5 h-8 w-24 bg-slate-800/50 rounded animate-pulse" />
                        ) : (
                          <span className="text-xs text-red-400">Missing</span>
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
