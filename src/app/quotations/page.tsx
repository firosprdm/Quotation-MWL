'use client';

import React from 'react';
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
import { useState } from 'react';

export default function QuotationsPage() {
  const { quotations, clients, updateQuotation, deleteQuotation, settings } = useApp();
  const [viewQuotation, setViewQuotation] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
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
  };

  return (
    <div className="fade-in">
      {viewQuotation && (
        <ViewQuotationModal 
          quotation={viewQuotation} 
          client={clients.find(c => c.id === viewQuotation.clientId)} 
          onClose={() => setViewQuotation(null)} 
        />
      )}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Quotations</h2>
          <p className={styles.subtitle}>All your issued and draft quotations.</p>
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
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('number')}>
                No. <SortIcon column="number" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                Date <SortIcon column="date" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>
                Total <SortIcon column="total" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('status')}>
                Status <SortIcon column="status" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  {search ? 'No quotations match your search.' : 'No quotations found.'}
                </td>
              </tr>
            ) : (
              filteredQuotations.map((q) => (
                <tr key={q.id}>
                  <td className="font-bold text-white">
                    {q.number}
                    {q.revision > 0 && <span className="text-xs text-muted ml-1">-R{q.revision}</span>}
                  </td>
                  <td>{clients.find(c => c.id === q.clientId)?.name || 'Unknown'}</td>
                  <td>{new Date(q.date).toLocaleDateString()}</td>
                  <td className="font-bold text-blue-400">SAR {q.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <select 
                      className={clsx(styles.status, styles[q.status])}
                      value={q.status}
                      onChange={(e) => updateQuotation(q.id, { status: e.target.value as any })}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
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
                      {clients.find(c => c.id === q.clientId) && (
                        <OnDemandPDFDownload 
                          document={<QuotationPDF quotation={q} client={clients.find(c => c.id === q.clientId)!} settings={settings} />} 
                          fileName={`Quotation_${q.number}.pdf`}
                          className={styles.actionBtn}
                          title="Download PDF"
                          icon={<Download size={16} />}
                        />
                      )}
                      <button 
                        className={clsx(styles.actionBtn, styles.deleteBtn)} 
                        title="Delete"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this quotation?')) {
                            deleteQuotation(q.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
