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
  Pencil, 
  Trash2, 
  Plus, 
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileClock,
  XCircle
} from 'lucide-react';
import styles from '../quotations/quotations.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InvoicePDF } from '@/components/InvoicePDF';
import { ViewQuotationModal } from '@/components/ViewQuotationModal';
import { RecordPaymentModal } from '@/components/RecordPaymentModal';
import QRCode from 'qrcode';
import { formatCurrency } from '@/lib/format';

import { pdf } from '@react-pdf/renderer';

// ── Invoice lifecycle helpers ─────────────────────────────────────────────────
function getInvoiceStage(q: any): 'draft' | 'edited' | 'confirmed' | 'zatca_done' {
  if (q.zatcaStatus === 'cleared') return 'zatca_done';
  if (q.isVerified) return 'confirmed';
  if (q.isEdited) return 'edited';
  return 'draft';
}

const STAGE_CONFIG = {
  draft: {
    label: 'Draft',
    icon: <FileClock size={12} />,
    cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  edited: {
    label: 'Edited',
    icon: <FileText size={12} />,
    cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  confirmed: {
    label: 'Confirmed',
    icon: <FileCheck2 size={12} />,
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  zatca_done: {
    label: 'ZATCA Done',
    icon: <ShieldCheck size={12} />,
    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
};

// ── PDF Download Button ───────────────────────────────────────────────────────
const ZATCADownloadButton = ({ q, client, settings, className }: any) => {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    let newWindow: Window | null = null;
    if (typeof window !== 'undefined' && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      newWindow = window.open('', '_blank');
      if (newWindow) newWindow.document.write('Generating Invoice PDF, please wait...');
    }

    try {
      let qrDataUrl = null;
      if (q.qrCode) qrDataUrl = await QRCode.toDataURL(q.qrCode, { margin: 1, width: 200 });
      const blob = await pdf(
        <InvoicePDF quotation={q} client={client} settings={settings} qrDataUrl={qrDataUrl} />
      ).toBlob();
      
      const url = window.URL.createObjectURL(blob);
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        const link = window.document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.setAttribute('download', `${q.invoiceNumber || q.number}.pdf`);
        window.document.body.appendChild(link);
        link.click();
        setTimeout(() => { window.document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
      }
    } catch (e: any) {
      console.error('PDF Generation Error:', e);
      if (newWindow) newWindow.close();
      alert(`Failed to generate PDF: ${e && e.message ? e.message : String(e)}`);
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
      <Download size={16} className={clsx(loading && 'animate-pulse')} />
    </button>
  );
};

// ── Confirm Dialog Modal ──────────────────────────────────────────────────────
function ConfirmDialog({ q, client, onConfirm, onCancel }: { q: any; client: any; onConfirm: () => void; onCancel: () => void }) {
  const [activeQ, setActiveQ] = React.useState(q);

  React.useEffect(() => {
    const hasRealItems = (activeQ.items || []).some((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata);
    if (!hasRealItems) {
      fetch(`/api/v1/erpnext/quotations?id=${q.id}`)
        .then(res => res.json())
        .then(fullQ => {
          if (fullQ && fullQ.items && fullQ.items.length > 0) {
            setActiveQ({ ...q, items: fullQ.items });
          }
        })
        .catch(() => {});
    }
  }, [q.id]);

  React.useEffect(() => {
    setActiveQ((prev: any) => {
      const realPrevCount = (prev.items || []).filter((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata).length;
      const realNewCount = (q.items || []).filter((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata).length;
      return {
        ...q,
        items: realPrevCount > realNewCount ? prev.items : q.items
      };
    });
  }, [q]);

  const lineItems = (activeQ.items || []).filter((i: any) => !i._isWorkflowMetadata);
  const subtotal = activeQ.subtotal || lineItems.reduce((s: number, i: any) => s + (i.total || 0), 0);
  const discount = activeQ.discount || 0;
  const netAmount = subtotal - discount;
  const vatAmount = activeQ.vatAmount ?? (netAmount * 0.15);
  const grandTotal = activeQ.grandTotal ?? (netAmount + vatAmount);
  const invDate = activeQ.invoiceDate || activeQ.date;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-10" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div className="relative w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[92vh] flex flex-col">
        <div className="glass-panel border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[92vh]">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                <ClipboardCheck size={24} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-wide">Verify Invoice Against PO</h2>
                <p className="text-sm text-white/40">Review all details carefully before confirming</p>
              </div>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg font-light">✕</button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-8 py-8 space-y-8">

            {/* Reference + Dates */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Quotation Ref</p>
                <p className="text-white font-mono font-semibold text-base">{q.number || '—'}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Invoice Date</p>
                <p className="text-white text-base">{invDate ? new Date(invDate).toLocaleDateString('en-GB') : '—'}</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 mb-2">PO Number</p>
                <p className="text-blue-300 font-mono font-semibold text-base">{q.poNumber || '—'}</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 mb-2">Ticket Number</p>
                <p className="text-amber-300 font-mono font-semibold text-base">{q.ticketNumber || '—'}</p>
              </div>
            </div>

            {/* Client Details */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Client Details</p>
              <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                <div>
                  <span className="text-white/40 text-xs">Name</span>
                  <p className="text-white font-medium text-sm mt-0.5">{client?.name || '—'}</p>
                </div>
                {client?.vatNumber && (
                  <div>
                    <span className="text-white/40 text-xs">VAT No.</span>
                    <p className="text-white font-mono text-sm mt-0.5">{client.vatNumber}</p>
                  </div>
                )}
                {client?.otherId && (
                  <div>
                    <span className="text-white/40 text-xs">CR No.</span>
                    <p className="text-white font-mono text-sm mt-0.5">{client.otherId}</p>
                  </div>
                )}
                {client?.phone && (
                  <div>
                    <span className="text-white/40 text-xs">Phone</span>
                    <p className="text-white text-sm mt-0.5">{client.phone}</p>
                  </div>
                )}
                {(client?.address || client?.splitAddress) && (
                  <div className="col-span-3">
                    <span className="text-white/40 text-xs">Address</span>
                    <p className="text-white/70 text-sm leading-relaxed mt-0.5">
                      {client.splitAddress
                        ? `${client.splitAddress.buildingNumber || ''} ${client.splitAddress.streetName || ''}, ${client.splitAddress.district || ''}, ${client.splitAddress.city || ''} ${client.splitAddress.postalCode || ''}`
                        : client.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subject preview */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
               <h3 className="text-xs font-bold text-blue-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                 <CheckCircle2 size={14} />
                 Subject
               </h3>
               <p className="text-white font-medium text-sm">{activeQ.subject || q.subject || 'Standard Project Services'}</p>
               {(activeQ.subjectAr || q.subjectAr) && (
                 <p className="text-muted text-xs mt-1 font-arabic" dir="rtl">{activeQ.subjectAr || q.subjectAr}</p>
               )}
            </div>

            {/* Line Items */}
            {lineItems.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 bg-white/3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Line Items ({lineItems.length})</p>
                </div>
                <table className="w-full">
                  <colgroup>
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '21%' }} />
                    <col style={{ width: '21%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3">
                      <th className="px-8 py-5 text-left text-[11px] uppercase tracking-wider text-white/40 font-bold">Description</th>
                      <th className="px-6 py-5 text-center text-[11px] uppercase tracking-wider text-white/40 font-bold w-24">Unit</th>
                      <th className="px-6 py-5 text-center text-[11px] uppercase tracking-wider text-white/40 font-bold w-24">Qty</th>
                      <th className="px-6 py-5 text-right text-[11px] uppercase tracking-wider text-white/40 font-bold w-36">Unit Price</th>
                      <th className="px-8 py-5 text-right text-[11px] uppercase tracking-wider text-white/40 font-bold w-36">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className={`border-b border-white/5 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.03]'} hover:bg-white/[0.08]`}>
                        <td className="px-8 py-6 text-white/85 text-sm leading-snug">{item.description || '—'}</td>
                        <td className="px-6 py-6 text-center text-white/60 text-sm">{item.unit || 'Nos'}</td>
                        <td className="px-6 py-6 text-center text-white/80 text-sm font-medium">{item.quantity}</td>
                        <td className="px-6 py-6 text-right text-white/60 text-sm font-mono">{formatCurrency(item.price)}</td>
                        <td className="px-8 py-6 text-right text-white text-sm font-mono font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Financial Summary</p>
              </div>
              <div className="divide-y divide-white/5">
                <div className="flex justify-between px-8 py-4">
                  <span className="text-white/50 text-sm">Subtotal</span>
                  <span className="text-white font-mono text-sm">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between px-6 py-4">
                    <span className="text-rose-400/70 text-sm">Discount</span>
                    <span className="text-rose-400 font-mono text-sm">− {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between px-8 py-4">
                  <span className="text-white/50 text-sm">Net Amount</span>
                  <span className="text-white font-mono text-sm">{formatCurrency(netAmount)}</span>
                </div>
                <div className="flex justify-between px-8 py-4">
                  <span className="text-white/50 text-sm">VAT (15%)</span>
                  <span className="text-white font-mono text-sm">{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between px-8 py-6 bg-emerald-500/5">
                  <span className="text-white font-bold text-sm uppercase tracking-wider">Grand Total</span>
                  <span className="text-emerald-400 text-xl font-mono font-bold">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Confirmation note */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300/80 leading-relaxed">
              ✅ By clicking <strong className="text-emerald-300">Confirm &amp; Edit</strong>, you confirm the above details match your Purchase Order. You will be taken to the invoice editor to make any final adjustments. Saving there will mark this invoice as <strong className="text-emerald-300">Confirmed</strong>.
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
            <button onClick={onCancel} className="flex-1 glass-button !justify-center text-white/60 hover:text-white">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle2 size={18} />
              Confirm &amp; Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const {
    quotations = [], clients = [], settings, updateQuotation, deleteQuotation,
    finalizeInvoice, clearInvoiceWithZATCA, loadMoreQuotations, isLoaded,
    currentUser, paymentReceipts = []
  } = useApp();
  const router = useRouter();

  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [integratingId, setIntegratingId] = useState<string | null>(null);
  const [zatcaError, setZatcaError] = useState<string | null>(null);
  const [zatcaSuccess, setZatcaSuccess] = useState<boolean>(false);

  const invoiceQuotations = useMemo(() =>
    quotations.filter(q =>
      q.status === 'approved' &&
      (q.salesStatus === 'PO recieved' || !!q.poNumber) &&
      (q.workStatus === 'Work Done' || q.workStatus === 'completed')
    ), [quotations]);

  const requestSort = (key: string) => {
    setSortConfig(prev =>
      prev?.key === key && prev.direction === 'asc'
        ? { key, direction: 'desc' }
        : { key, direction: 'asc' }
    );
  };

  const filteredInvoices = useMemo(() => {
    let items = invoiceQuotations.filter(q => {
      const client = clients.find(c => c.id === q.clientId);
      const searchStr = `${q.number} ${q.invoiceNumber || ''} ${client?.name || ''} ${q.ticketNumber || ''}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });

    if (sortConfig) {
      items.sort((a, b) => {
        let aVal: any, bVal: any;
        const dir = sortConfig.direction === 'asc' ? 1 : -1;
        switch (sortConfig.key) {
          case 'number': aVal = a.invoiceNumber || ''; bVal = b.invoiceNumber || ''; break;
          case 'client': aVal = clients.find(c => c.id === a.clientId)?.name || ''; bVal = clients.find(c => c.id === b.clientId)?.name || ''; break;
          case 'date': aVal = a.invoiceDate || a.date || 0; bVal = b.invoiceDate || b.date || 0; break;
          case 'total': aVal = a.grandTotal || 0; bVal = b.grandTotal || 0; break;
          default: return 0;
        }
        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
        return 0;
      });
    }
    return items;
  }, [invoiceQuotations, clients, search, sortConfig]);

  const SortIcon = ({ column }: { column: string }) =>
    sortConfig?.key !== column ? <span className="opacity-30">↕</span> :
    sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;

  const downloadXML = async (q: any) => {
    if (!q.uuid) return;
    try {
      const { generateUBL21XML } = await import('@/lib/ubl-generator');
      const client = clients.find(c => c.id === q.clientId);
      if (!client) return;
      const xml = generateUBL21XML({ quotation: q, client, settings, pih: q.pih, icv: q.icv, uuid: q.uuid });
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${q.invoiceNumber || q.number}_ZATCA.xml`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error('XML download failed', e); }
  };

  const totalInvoiced = filteredInvoices.reduce((acc, q) => acc + q.grandTotal, 0);

  return (
    <div className="fade-in">
      {viewInvoice && (
        <ViewQuotationModal
          quotation={viewInvoice}
          client={clients.find(c => c.id === viewInvoice.clientId)}
          onClose={() => setViewInvoice(null)}
          mode="invoice"
        />
      )}

      {showPaymentModal && <RecordPaymentModal onClose={() => setShowPaymentModal(false)} />}

      {confirmTarget && (
        <ConfirmDialog
          q={confirmTarget}
          client={clients.find(c => c.id === confirmTarget.clientId)}
          onConfirm={() => {
            router.push(`/invoices/edit/${confirmTarget.id}?confirm=true`);
            setConfirmTarget(null);
          }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {(zatcaError || zatcaSuccess) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setZatcaError(null); setZatcaSuccess(false); }} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {zatcaError ? (
              <>
                <div className="px-6 py-8 text-center border-b border-white/5">
                  <div className="mx-auto w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mb-5 border border-rose-500/20">
                    <XCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Integration Error</h3>
                  <p className="text-rose-200/70 text-sm leading-relaxed">{zatcaError}</p>
                </div>
                <div className="px-6 py-4 bg-white/[0.02] flex justify-end">
                  <button onClick={() => setZatcaError(null)} className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl transition-all font-medium text-sm w-full">
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-8 text-center border-b border-white/5">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-5 border border-emerald-500/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">ZATCA Cleared Successfully</h3>
                  <p className="text-emerald-200/70 text-sm leading-relaxed">Invoice number generated and successfully recorded with ZATCA Phase 2 limits.</p>
                </div>
                <div className="px-6 py-4 bg-white/[0.02] flex justify-end">
                  <button onClick={() => setZatcaSuccess(false)} className="px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl transition-all font-medium text-sm w-full">
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Invoices</h2>
          <p className="premium-subtitle">Manage tax invoices for completed and PO-received projects.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className={clsx('glass-panel', styles.statCard, '!py-2 !px-4')}>
            <div className={clsx(styles.statIcon, '!w-10 !h-10')}>
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <div>
              <label className="premium-label">Total Invoiced</label>
              <p className="text-xl font-normal text-white leading-tight">{formatCurrency(totalInvoiced)}</p>
            </div>
          </div>
          <button onClick={() => setShowPaymentModal(true)} className={clsx('glass-button', styles.addButton, 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30')}>
            <Receipt size={20} />
            <span>Payment Entry</span>
          </button>
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
            placeholder="Search by invoice no., client or ticket..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={clsx('glass-panel', styles.tableWrapper)}>
        <table className={styles.table}>
          <thead>
            <tr>
              {/* Invoice No — only show when ZATCA done */}
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('number')}>
                Invoice No. <SortIcon column="number" />
              </th>
              {/* Quotation No */}
              <th className="premium-label">Quotation No.</th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('client')}>
                Client <SortIcon column="client" />
              </th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                Date <SortIcon column="date" />
              </th>
              <th className="premium-label cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>
                Grand Total <SortIcon column="total" />
              </th>
              <th className="premium-label">Ticket No.</th>
              {/* Invoice Status — new column */}
              <th className="premium-label">Invoice Status</th>
              <th className="premium-label text-center">Actions</th>
              {/* Payment Status — last, compact */}
              <th className="premium-label text-[10px] whitespace-nowrap">Pay Status</th>
            </tr>
          </thead>
          <tbody>
            {!isLoaded ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading invoices...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  {search ? 'No invoices match your search.' : 'No invoices ready. Projects must be "PO Received" and "Work Done".'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map(q => {
                const stage = getInvoiceStage(q);
                const stageCfg = STAGE_CONFIG[stage];
                const invDate = q.invoiceDate || q.date;
                const received = q.receivedAmount || 0;
                const total = q.grandTotal;
                const isPaid = q.paymentStatus === 'Done' || received >= total - 0.01;
                const isPartial = !isPaid && received > 0;
                const daysDiff = Math.floor((Date.now() - invDate) / (1000 * 60 * 60 * 24));
                const isOverdue = !isPaid && daysDiff > 30;
                const client = clients.find(c => c.id === q.clientId);

                return (
                  <tr key={q.id}>
                    {/* Invoice Number — only after ZATCA */}
                    <td className="font-mono text-white text-sm">
                      {(() => {
                        const metadata: any = (q.items || []).find((it: any) => it._isWorkflowMetadata) || {};
                        const invNo = q.invoiceNumber || metadata.invoiceNumber;
                        if (stage === 'zatca_done' && invNo) {
                          return <span className="text-blue-300 font-semibold">{invNo}</span>;
                        }
                        return <span className="text-white/20 italic text-xs">Pending</span>;
                      })()}
                    </td>

                    {/* Quotation Number */}
                    <td className="font-mono text-white/80 text-xs font-semibold">
                      {q.number || '---'}
                    </td>

                    <td className="text-white/70">{client?.name || 'Unknown'}</td>
                    <td className="text-white/70 text-sm">{new Date(invDate).toLocaleDateString()}</td>
                    <td className="font-normal text-emerald-400">{formatCurrency(q.grandTotal)}</td>

                    {/* Ticket No */}
                    <td className="text-white/60 text-xs font-mono">{q.ticketNumber || '---'}</td>

                    {/* Invoice Status */}
                    <td>
                      <div className={clsx(
                        'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap',
                        stageCfg.cls
                      )}>
                        {stageCfg.icon}
                        {stageCfg.label}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 flex-nowrap">

                        {/* View */}
                        <button
                          className={clsx(styles.actionBtn, 'hover:text-sky-400 hover:border-sky-400/40 hover:bg-sky-400/10 transition-all duration-200 group')}
                          title="View Invoice"
                          onClick={() => setViewInvoice(q)}
                        >
                          <Eye size={15} className="group-hover:scale-110 transition-transform duration-200" />
                        </button>

                        {/* Edit — available until ZATCA Done */}
                        {stage !== 'zatca_done' && (
                          <Link
                            href={`/invoices/edit/${q.id}`}
                            className={clsx(styles.actionBtn, 'hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-400/10 transition-all duration-200 group')}
                            title="Edit Invoice"
                          >
                            <Pencil size={15} className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200" />
                          </Link>
                        )}

                        {/* Confirm — not yet confirmed */}
                        {stage !== 'confirmed' && stage !== 'zatca_done' && (
                          <button
                            className={clsx(styles.actionBtn, 'hover:text-emerald-400 hover:border-emerald-400/40 hover:bg-emerald-400/10 transition-all duration-200 group')}
                            title="Verify with PO & Confirm"
                            onClick={() => setConfirmTarget(q)}
                          >
                            <CheckCircle2 size={15} className="group-hover:scale-110 transition-transform duration-200" />
                          </button>
                        )}

                        {/* ZATCA Integration — confirmed only */}
                        {stage === 'confirmed' && (
                          <button
                            className={clsx(
                              styles.actionBtn,
                              'text-blue-400 border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/50 transition-all duration-200 group',
                              !integratingId && 'animate-pulse'
                            )}
                            disabled={integratingId === q.id}
                            title="ZATCA Integration — Generate Invoice No. + Clear"
                            onClick={async () => {
                              if (!settings.zatca?.onboarded) {
                                setZatcaError('ZATCA Onboarding not complete. Please go to Settings and complete the onboarding process first.');
                                return;
                              }

                              setIntegratingId(q.id);
                              try {
                                if (!q.uuid) await finalizeInvoice(q.id);
                                const result = await clearInvoiceWithZATCA(q.id);
                                
                                if (result && !result.success) {
                                  setZatcaError(result.error || 'Unknown error');
                                } else {
                                  setZatcaSuccess(true);
                                }
                              } catch (e: any) {
                                setZatcaError(e.message || JSON.stringify(e));
                              } finally {
                                setIntegratingId(null);
                              }
                            }}
                          >
                            {integratingId === q.id
                              ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              : <Zap size={15} className="group-hover:scale-125 transition-transform duration-200" />
                            }
                          </button>
                        )}

                        {/* ZATCA Done indicator */}
                        {stage === 'zatca_done' && (
                          <span className={clsx(styles.actionBtn, 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 cursor-default')} title="ZATCA Cleared">
                            <ShieldCheck size={15} />
                          </span>
                        )}

                        {/* Downloads — only after ZATCA */}
                        {stage === 'zatca_done' && (
                          <>
                            <button
                              className={clsx(styles.actionBtn, 'hover:text-blue-400 hover:border-blue-400/40 hover:bg-blue-400/10 transition-all duration-200 group')}
                              title="Download ZATCA XML"
                              onClick={() => downloadXML(q)}
                            >
                              <FileCode size={15} className="group-hover:scale-110 transition-transform duration-200" />
                            </button>
                            {client && (
                              <ZATCADownloadButton
                                q={q}
                                client={client}
                                settings={settings}
                                className={clsx(styles.actionBtn, 'hover:text-purple-400 hover:border-purple-400/40 hover:bg-purple-400/10 transition-all duration-200')}
                              />
                            )}
                          </>
                        )}

                        {/* Delete — admin, not ZATCA done */}
                        {currentUser?.role === 'admin' && stage !== 'zatca_done' && (
                          <button
                            type="button"
                            className={clsx(styles.actionBtn, styles.deleteBtn, 'hover:scale-110 transition-transform duration-200 group')}
                            title="Delete Invoice"
                            onClick={e => {
                              e.preventDefault(); e.stopPropagation();
                              if (confirm('Delete this invoice? This cannot be undone.')) deleteQuotation(q.id);
                            }}
                          >
                            <Trash2 size={15} className="pointer-events-none group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Payment Status — compact, last column */}
                    <td className="text-center">
                      <div className={clsx(
                        'inline-flex items-center justify-center text-[9px] font-bold uppercase tracking-wider h-6 px-2 rounded-md border whitespace-nowrap',
                        isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        isPartial ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}>
                        {isPaid ? 'Paid' : isOverdue ? `Overdue` : isPartial ? 'Partial' : 'Pending'}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {quotations.length >= 50 && quotations.length % 50 === 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={async e => {
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
