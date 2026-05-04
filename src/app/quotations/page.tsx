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
  Trash2,
  Check,
  Clock,
  X,
  Send,
  FileCheck
} from 'lucide-react';
import styles from './quotations.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { OnDemandPDFDownload } from '@/components/OnDemandPDFDownload';
import { QuotationPDF } from '@/components/QuotationPDF';
import { ViewQuotationModal } from '@/components/ViewQuotationModal';
import { useState } from 'react';
import { formatCurrency } from '@/lib/format';

const StatusBar = ({ status, isInvoiced }: { status: string; isInvoiced: boolean }) => {
  const steps = [
    { id: 'draft', icon: Clock, label: 'Draft' },
    { id: 'sent', icon: Send, label: 'Sent' },
    { id: 'approved', icon: Check, label: 'Approved' },
    { id: 'invoiced', icon: FileCheck, label: 'Invoiced' },
  ];

  const getStepStatus = (stepId: string) => {
    if (isInvoiced && stepId === 'invoiced') return 'completed';
    if (status === 'approved' && stepId === 'approved') return 'completed';
    if ((status === 'sent' || status === 'approved') && stepId === 'sent') return 'completed';
    if (stepId === 'draft') return 'completed';
    
    if (status === 'rejected' && stepId === 'approved') return 'failed';
    
    return 'pending';
  };

  return (
    <div className={styles.statusBarContainer}>
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.id);
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className={clsx(styles.step, styles[stepStatus])} title={step.label}>
              <Icon size={12} />
            </div>
            {index < steps.length - 1 && (
              <div className={clsx(styles.connector, styles[getStepStatus(steps[index + 1].id) === 'completed' ? 'completed' : 'pending'])} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function QuotationsPage() {
  const { quotations = [], clients = [], updateQuotation, deleteQuotation, settings, isLoaded } = useApp();
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
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
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
          <h2 className={styles.title}>Quotation Management</h2>
          <p className={styles.subtitle}>Create, track, and manage your professional quotes.</p>
        </div>
        <Link href="/quotations/new" className={clsx('glass-button', styles.addButton)}>
          <Plus size={20} />
          <span>Create New</span>
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
          <span>Advanced Filter</span>
        </button>
      </div>

      <div className={clsx('glass-panel', styles.tableWrapper)}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('number')}>
                Ref No. <SortIcon column="number" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                Date <SortIcon column="date" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>
                Value <SortIcon column="total" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('status')}>
                Pipeline Status <SortIcon column="status" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoaded ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Fetching quotations...</span>
                  </div>
                </td>
              </tr>
            ) : filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  {search ? 'No matches found for your search.' : 'No quotations issued yet.'}
                </td>
              </tr>
            ) : (
              filteredQuotations.map((q) => (
                <tr key={q.id}>
                  <td className="font-bold text-white">
                    {q.number}
                    {q.revision > 0 && <span className="text-xs text-muted ml-1">v{q.revision + 1}</span>}
                  </td>
                  <td className="max-w-[200px] truncate">{clients.find(c => c.id === q.clientId)?.name || 'Unknown'}</td>
                  <td className="text-muted">{new Date(q.date).toLocaleDateString()}</td>
                  <td className="font-bold text-emerald-400">{formatCurrency(q.grandTotal || q.total)}</td>
                  <td>
                    <div className="flex flex-col gap-2">
                      <StatusBar status={q.status} isInvoiced={!!q.invoiceNumber} />
                      <select 
                        className={clsx(styles.statusSelect, styles[q.status])}
                        value={q.status}
                        onChange={(e) => updateQuotation(q.id, { status: e.target.value as any })}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn} 
                        title="Preview"
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
                        title="Archive"
                        onClick={() => {
                          if (confirm('Permanently delete this quotation record?')) {
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
