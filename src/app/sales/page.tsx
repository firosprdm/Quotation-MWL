'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, 
  Search, 
  Download, 
  Eye,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import styles from '../quotations/quotations.module.css';
import { clsx } from 'clsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotationPDF } from '@/components/QuotationPDF';
import { ViewQuotationModal } from '@/components/ViewQuotationModal';

export default function SalesPage() {
  const { quotations, clients, settings, updateQuotation } = useApp();
  const [viewQuotation, setViewQuotation] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
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
            aValue = a.salesStatus || 'PO pending';
            bValue = b.salesStatus || 'PO pending';
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
          <h2 className={styles.title}>Sales Dashboard</h2>
          <p className={styles.subtitle}>All approved quotations and closed deals.</p>
        </div>
        <div className={clsx('glass-panel', styles.statCard)}>
          <div className={styles.statIcon}>
            <TrendingUp size={24} className="text-green-400" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase font-bold">Total Revenue</label>
            <p className="text-xl font-bold text-white">SAR {totalSales.toLocaleString()}</p>
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
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('number')}>
                No. <SortIcon column="number" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                Approval Date <SortIcon column="date" />
              </th>
              <th className="cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>
                Grand Total <SortIcon column="total" />
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
                  {search ? 'No sales match your search.' : 'No sales recorded yet. Approve quotations to see them here.'}
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
                  <td className="font-bold text-green-400">SAR {q.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <select
                      className={clsx('glass-input', styles.statusSelect)}
                      value={q.salesStatus || 'PO pending'}
                      onChange={(e) => updateQuotation(q.id, { salesStatus: e.target.value as any })}
                    >
                      <option value="PO pending" className="text-gray-900">PO pending</option>
                      <option value="PO recieved" className="text-gray-900">PO recieved</option>
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
                      {clients.find(c => c.id === q.clientId) && (
                        <PDFDownloadLink 
                          document={<QuotationPDF quotation={q} client={clients.find(c => c.id === q.clientId)!} settings={settings} />} 
                          fileName={`Sale_${q.number}.pdf`}
                          className={styles.actionBtn}
                          title="Download PDF"
                        >
                          {/* @ts-ignore */}
                          {({ loading }) => <Download size={16} className={clsx(loading && "animate-pulse")} />}
                        </PDFDownloadLink>
                      )}
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
