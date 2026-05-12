'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Check, Receipt, CreditCard, Calendar, Hash, FileText, AlertCircle, CheckCircle2, Clock, ChevronRight, Zap } from 'lucide-react';
import styles from './ViewQuotationModal.module.css';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';

interface Props {
  onClose: () => void;
}

export function RecordPaymentModal({ onClose }: Props) {
  const { clients, quotations, addPaymentReceipt } = useApp();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [bankReference, setBankReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  const unpaidInvoices = useMemo(() => {
    if (!selectedClientId) return [];
    return quotations.filter(q => {
      const isApproved = q.status === 'approved';
      const isPoReceived = q.salesStatus === 'PO recieved';
      const isWorkDone = q.workStatus === 'Work Done' || q.workStatus === 'completed';
      const isUnpaid = q.paymentStatus !== 'Done' && q.paymentStatus !== 'paid';

      return (
        q.clientId === selectedClientId &&
        isApproved &&
        isPoReceived &&
        isWorkDone &&
        isUnpaid
      );
    });
  }, [quotations, selectedClientId]);

  const totalAmount = useMemo(() =>
    Math.round(Object.values(selectedInvoices).reduce((sum, amt) => sum + amt, 0) * 100) / 100,
    [selectedInvoices]
  );

  const totalOutstanding = useMemo(() =>
    Math.round(unpaidInvoices.reduce((sum, inv) => sum + (inv.grandTotal - (inv.receivedAmount || 0)), 0) * 100) / 100,
    [unpaidInvoices]
  );

  const allSelected = unpaidInvoices.length > 0 && unpaidInvoices.every(inv => selectedInvoices[inv.id] !== undefined);

  const toggleInvoice = (inv: any) => {
    setSelectedInvoices(prev => {
      const next = { ...prev };
      if (next[inv.id] !== undefined) {
        delete next[inv.id];
      } else {
        const remaining = inv.grandTotal - (inv.receivedAmount || 0);
        // Round to 2 decimal places to avoid floating-point display issues
        next[inv.id] = Math.round(remaining * 100) / 100;
      }
      return next;
    });
  };

  const selectAll = () => {
    if (allSelected) {
      setSelectedInvoices({});
    } else {
      const all: Record<string, number> = {};
      unpaidInvoices.forEach(inv => {
        const remaining = inv.grandTotal - (inv.receivedAmount || 0);
        // Round to 2 decimal places
        all[inv.id] = Math.round(remaining * 100) / 100;
      });
      setSelectedInvoices(all);
    }
  };

  const updateAmount = (id: string, amount: number) => {
    // Round to 2 decimal places to prevent floating-point accumulation
    setSelectedInvoices(prev => ({ ...prev, [id]: Math.round(amount * 100) / 100 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allocations = Object.entries(selectedInvoices).map(([id, amt]) => ({
      invoiceId: id,
      amount: amt
    }));
    if (!selectedClientId || allocations.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addPaymentReceipt({
        clientId: selectedClientId,
        amountReceived: totalAmount,
        paymentDate: new Date(paymentDate).getTime(),
        paymentMethod,
        bankReference,
        allocations,
        notes
      });
      onClose();
    } catch (err: any) {
      console.error('Payment Error FULL:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      console.log('Payload Data:', {
        clientId: selectedClientId,
        amountReceived: totalAmount,
        paymentDate: new Date(paymentDate).getTime(),
        paymentMethod,
        bankReference,
        allocations
      });
      const errorMsg = err.message || err.error_description || (typeof err === 'string' ? err : 'Check console for full error details');
      alert(`Failed to record payment: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = Object.keys(selectedInvoices).length;
  const fullPayCount = Object.entries(selectedInvoices).filter(([id, amt]) => {
    const inv = unpaidInvoices.find(i => i.id === id);
    return inv && amt >= (inv.grandTotal - (inv.receivedAmount || 0)) - 0.01;
  }).length;
  const partialPayCount = Object.entries(selectedInvoices).filter(([id, amt]) => {
    const inv = unpaidInvoices.find(i => i.id === id);
    return inv && amt < (inv.grandTotal - (inv.receivedAmount || 0)) - 0.01 && amt > 0;
  }).length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <style>{`
        @keyframes postPaymentPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 30px 10px rgba(16, 185, 129, 0.25); }
        }
        @keyframes postPaymentShine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .post-payment-btn {
          position: relative;
          overflow: hidden;
          animation: postPaymentPulse 2s ease-in-out infinite;
        }
        .post-payment-btn:not(:disabled) {
          animation: postPaymentPulse 2s ease-in-out infinite, pulse-scale 3s ease-in-out infinite;
        }
        .post-payment-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: postPaymentShine 2s ease-in-out infinite;
        }
        .post-payment-btn:hover {
          animation: none;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 0 40px 10px rgba(16, 185, 129, 0.4);
        }
        .post-payment-btn:disabled {
          animation: none;
          box-shadow: none;
          transform: none;
        }
        .post-payment-btn:disabled::before {
          animation: none;
          display: none;
        }
        .animated-gradient-icon {
          animation: rainbow 8s linear infinite, float 3s ease-in-out infinite;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div
        className={clsx('glass-panel', styles.modal)}
        style={{ maxWidth: '1100px', width: '96vw', height: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-fuchsia-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Receipt size={30} className="animated-gradient-icon" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight uppercase">Payment Entry</h2>
              <p className="text-sm text-slate-400 mt-0.5">ALLOCATE PAYMENTS ACROSS MULTIPLE INVOICES · SYSTEM AUTOMATION ENABLED</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1">Status</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Post Ready</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/5" />
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap size={24} className="animated-gradient-icon animate-pulse" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Top fields — compact 4-column layout */}
          <div className="px-8 pt-5 pb-4 grid grid-cols-4 gap-4 flex-shrink-0">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Client</label>
              <select
                className="glass-input w-full text-xs uppercase"
                value={selectedClientId}
                onChange={e => { setSelectedClientId(e.target.value); setSelectedInvoices({}); }}
                required
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
                ))}
              </select>
              {selectedClient && (
                <p className="text-sm text-slate-500">{selectedClient.email} · {unpaidInvoices.length} pending invoice{unpaidInvoices.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} /> Payment Date</label>
              <input type="date" className="glass-input w-full text-xs uppercase" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><CreditCard size={12} /> Method</label>
              <select className="glass-input w-full text-xs uppercase" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="Bank Transfer" className="text-gray-900">Bank Transfer</option>
                <option value="Cash" className="text-gray-900">Cash</option>
                <option value="Cheque" className="text-gray-900">Cheque</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Hash size={12} /> Bank / Transfer Reference</label>
              <input type="text" placeholder="e.g. TRF-98231, Cheque #445" className="glass-input w-full text-xs uppercase" value={bankReference} onChange={e => setBankReference(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12} /> Notes (Optional)</label>
              <input type="text" placeholder="Internal note..." className="glass-input w-full text-sm" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="px-8 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                <FileText size={18} className="text-fuchsia-400" /> Outstanding Invoices
                {unpaidInvoices.length > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20 uppercase tracking-widest">
                    {unpaidInvoices.length} invoice{unpaidInvoices.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              {unpaidInvoices.length > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {selectedCount} / {unpaidInvoices.length} selected
                  </span>
                  <button type="button" onClick={selectAll} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider">
                    {allSelected ? '✕ Deselect All' : '✓ Select All'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 min-h-0">
              {!selectedClientId ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                  <Receipt size={56} className="mb-5 opacity-15" />
                  <p className="text-base">Select a client to view their outstanding invoices</p>
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                  <CheckCircle2 size={56} className="mb-5 text-emerald-500/25" />
                  <p className="text-base">No outstanding invoices for this client</p>
                </div>
              ) : (
                <table className="w-full text-center border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
                    <tr className="bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
                      <th className="py-5 px-4 w-12 text-center">
                        <div
                          className={clsx("w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer transition-all mx-auto",
                            allSelected ? "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "border-white/20 hover:border-white/40 bg-white/5"
                          )}
                          onClick={selectAll}
                        >
                          {allSelected && <Check size={13} strokeWidth={3} className="text-white" />}
                        </div>
                      </th>
                      <th className="py-5 px-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ref Number</th>
                      <th className="py-5 px-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Project / Subject</th>
                      <th className="py-5 px-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Invoice Total</th>
                      <th className="py-5 px-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Amount Received</th>
                      <th className="py-5 px-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Balance Due</th>
                      <th className="py-5 px-3 text-center text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em] w-48">Payment Amount</th>
                      <th className="py-5 pr-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] w-32">Alloc. State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidInvoices.map(inv => {
                      const alreadyPaid = inv.receivedAmount || 0;
                      const balance = inv.grandTotal - alreadyPaid;
                      const isSelected = selectedInvoices[inv.id] !== undefined;
                      const payAmt = selectedInvoices[inv.id] || 0;
                      const isFullPayment = isSelected && payAmt >= balance - 0.01;
                      const isPartialPayment = isSelected && payAmt < balance - 0.01 && payAmt > 0;
                      const isOverpay = isSelected && payAmt > balance + 0.01;

                      return (
                        <tr
                          key={inv.id}
                          className={clsx(
                            "border-b border-white/[0.04] hover:bg-white/[0.03] transition-all group/row",
                            isSelected && "bg-blue-500/[0.06] shadow-inner"
                          )}
                        >
                          <td className="py-2.5 px-4">
                            <div
                              className={clsx(
                                "w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all",
                                isSelected ? "bg-blue-500 border-blue-500" : "border-white/20 hover:border-white/40"
                              )}
                              onClick={() => toggleInvoice(inv)}
                            >
                              {isSelected && <Check size={11} strokeWidth={3} className="text-white" />}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="text-base font-medium text-white tabular-nums">{inv.invoiceNumber}</p>
                            <p className="text-sm text-slate-500">{new Date(inv.invoiceDate || inv.date).toLocaleDateString('en-GB')}</p>
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] text-center">
                            <p className="text-base text-slate-300 truncate">{inv.subject || inv.projectName || '—'}</p>
                          </td>
                          <td className="py-2.5 px-3 tabular-nums text-base text-slate-300">{formatCurrency(inv.grandTotal)}</td>
                          <td className="py-2.5 px-3 tabular-nums text-base">
                            {alreadyPaid > 0 ? (
                              <span className="text-emerald-400">{formatCurrency(alreadyPaid)}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">
                            <span className="text-amber-400 font-semibold text-base">{formatCurrency(balance)}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isSelected ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className={clsx(
                                  "glass-input text-right w-full py-2 h-10 text-base font-bold tabular-nums",
                                  isOverpay ? "text-rose-400 border-rose-500/40" :
                                  isFullPayment ? "text-emerald-400 border-emerald-500/30" :
                                  isPartialPayment ? "text-amber-400 border-amber-500/30" :
                                  "text-slate-300"
                                )}
                                value={Number(selectedInvoices[inv.id]).toFixed(2)}
                                onChange={e => {
                                  const val = parseFloat(e.target.value);
                                  updateAmount(inv.id, isNaN(val) ? 0 : val);
                                }}
                              />
                            ) : (
                              <span className="text-slate-600 text-base">—</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-center">
                            {!isSelected ? (
                              <span className="text-sm text-slate-600">—</span>
                            ) : isOverpay ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-sm font-semibold uppercase tracking-wider border border-rose-500/20">
                                <AlertCircle size={13} /> Over
                              </div>
                            ) : isFullPayment ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-semibold uppercase tracking-wider border border-emerald-500/20">
                                <CheckCircle2 size={13} /> Full
                              </div>
                            ) : isPartialPayment ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-sm font-semibold uppercase tracking-wider border border-amber-500/20">
                                <Clock size={13} /> Partial
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-sm uppercase tracking-wider border border-slate-500/15">
                                Enter
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Footer summary + animated submit */}
          <div className="px-8 py-5 border-t border-white/10 flex-shrink-0 flex items-center justify-between gap-6">
            <div className="flex gap-8">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Selected</p>
                <p className="text-xl font-semibold text-white tabular-nums mt-0.5">{selectedCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Outstanding</p>
                <p className="text-xl font-semibold text-amber-400 tabular-nums mt-0.5">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Full</p>
                <p className="text-xl font-semibold text-emerald-400 tabular-nums mt-0.5">{fullPayCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Partial</p>
                <p className="text-xl font-semibold text-amber-400 tabular-nums mt-0.5">{partialPayCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Receiving</p>
                <p className="text-xl font-semibold text-white tabular-nums">{formatCurrency(totalAmount)}</p>
              </div>
              <button
                type="submit"
                className={clsx(
                  "post-payment-btn group flex items-center gap-4 px-10 py-5 rounded-2xl text-lg font-bold transition-all transform active:scale-95 border uppercase tracking-widest",
                  selectedCount === 0 || isSubmitting
                    ? "bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                )}
                disabled={selectedCount === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    POSTING...
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <div className="absolute -inset-2 bg-emerald-400 blur-md opacity-40 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                      <Zap size={28} className="relative text-white fill-white shadow-xl" />
                    </div>
                    <span className="ml-2">POST PAYMENT</span>
                    <ChevronRight size={22} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
