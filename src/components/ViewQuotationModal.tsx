'use client';

import React, { useState, useEffect } from 'react';
import { Quotation, Client } from '@/types';
import { X, FileText, Calendar, User, ShoppingCart, Download, QrCode, CheckCircle2 } from 'lucide-react';
import styles from './ViewQuotationModal.module.css';
import { clsx } from 'clsx';
import { OnDemandPDFDownload } from './OnDemandPDFDownload';
import { QuotationPDF } from './QuotationPDF';
import { InvoicePDF } from './InvoicePDF';
import { useApp } from '@/context/AppContext';
import dynamic from 'next/dynamic';
import QRCode from 'qrcode';
import { formatCurrency, formatNumber } from '@/lib/format';

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

interface Props {
  quotation: Quotation;
  client?: Client;
  onClose: () => void;
  mode?: 'quotation' | 'invoice';
}

export function ViewQuotationModal({ quotation, client, onClose, mode = 'quotation' }: Props) {
  const { settings, updateQuotation } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [translatedQuotation, setTranslatedQuotation] = useState<Quotation>(quotation);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const translateItems = async () => {
      setIsLoading(true);
      try {
        let activeQuote = quotation;
        // Fetch full document with items if missing
        const hasRealItems = (activeQuote.items || []).some((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata);
        if (!hasRealItems) {
          try {
            const res = await fetch(`/api/v1/erpnext/quotations?id=${quotation.id}`);
            if (res.ok) {
              const fullQ = await res.json();
              if (fullQ && fullQ.items && fullQ.items.length > 0) {
                activeQuote = { ...activeQuote, items: fullQ.items };
                if (isMounted) {
                  setTranslatedQuotation(activeQuote);
                }
              }
            }
          } catch (e) {}
        }

        let hasChanges = false;
        const newItems = await Promise.all((activeQuote.items || []).map(async (item) => {
          if (!item.descriptionAr && item.description) {
             try {
               const res = await fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: item.description }) });
               if (res.ok) {
                 const data = await res.json();
                 if (data.translatedText) {
                   hasChanges = true;
                   return { ...item, descriptionAr: data.translatedText };
                 }
               }
             } catch (e) {}
             
             hasChanges = true;
             return { ...item, descriptionAr: 'وصف غير متوفر' };
          }
          return item;
        }));

        let translatedSubject = activeQuote.subjectAr;
        if (!translatedSubject && activeQuote.subject) {
          try {
            const res = await fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: activeQuote.subject }) });
            if (res.ok) {
              const data = await res.json();
              if (data.translatedText) {
                hasChanges = true;
                translatedSubject = data.translatedText;
              }
            }
          } catch (e) {}
        }
        
        if (isMounted) {
          const newQ = { ...activeQuote, items: newItems, subjectAr: translatedSubject };
          setTranslatedQuotation(newQ);
          if (hasChanges || activeQuote.items !== quotation.items) {
            updateQuotation(quotation.id, { items: newItems, subjectAr: translatedSubject } as any).catch(() => {});
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    translateItems();
    return () => { isMounted = false; };
  }, [quotation.id]);

  useEffect(() => {
    if (quotation.qrCode) {
      QRCode.toDataURL(quotation.qrCode, { margin: 1, width: 200 })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [quotation.qrCode]);
  useEffect(() => {
    setTranslatedQuotation(prev => {
      const realPrevCount = (prev.items || []).filter((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata).length;
      const realNewCount = (quotation.items || []).filter((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata).length;
      return {
        ...quotation,
        items: realPrevCount > realNewCount ? prev.items : quotation.items,
        subjectAr: prev.subjectAr || quotation.subjectAr
      };
    });
  }, [quotation]);
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={clsx('glass-panel', styles.modal)} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.iconBox}>
              <FileText size={32} className="text-blue-400" />
            </div>
            <div>
              <h2 className={styles.title}>Quotation {quotation.number}</h2>
              <p className={styles.subtitle}>
                {quotation.revision > 0 ? `Revision ${quotation.revision}` : 'Original Draft'}
              </p>
            </div>
          </div>
          <div className={clsx(styles.status, styles[quotation.status])}>
            {quotation.status}
          </div>
          {client && translatedQuotation && (
            <OnDemandPDFDownload 
              document={mode === 'invoice' ? (
                <InvoicePDF quotation={translatedQuotation} client={client} settings={settings} qrDataUrl={qrDataUrl} />
              ) : (
                <QuotationPDF quotation={translatedQuotation} client={client} settings={settings} />
              )} 
              fileName={mode === 'invoice' ? (() => {
                const invYear = new Date(quotation.invoiceDate || quotation.date).getFullYear();
                const rawNum = String(quotation.number || '0').replace(/[^0-9]/g, '');
                const formattedNum = rawNum.slice(-4).padStart(4, '0');
                return `INV-${invYear}-${formattedNum}.pdf`;
              })() : `Quotation_${quotation.number}.pdf`}
              className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 text-sm ml-4"
              title="Download PDF"
              icon={<Download size={18} />}
            />
          )}
        </header>

        <div className={styles.content}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <User size={18} className="text-muted" />
              <div>
                <label>Client</label>
                <p>{client?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Calendar size={18} className="text-muted" />
              <div>
                <label>Date</label>
                <p>{new Date(quotation.date).toLocaleDateString()}</p>
              </div>
            </div>
            {quotation.ticketNumber && (
              <div className={styles.infoItem}>
                <FileText size={18} className="text-muted" />
                <div>
                  <label>Ticket Number</label>
                  <p>{quotation.ticketNumber}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
             <h3 className="text-sm font-medium text-blue-400 mb-2 uppercase tracking-wider flex items-center gap-2">
               <CheckCircle2 size={16} />
               Subject
             </h3>
             <p className="text-white font-medium">{translatedQuotation.subject || quotation.subject || 'Standard Project Services'}</p>
             {(translatedQuotation.subjectAr || quotation.subjectAr) && (
               <p className="text-muted text-sm mt-1 font-arabic" dir="rtl">{translatedQuotation.subjectAr || quotation.subjectAr}</p>
             )}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(translatedQuotation.items || []).filter((item: any) => item && typeof item === 'object' && !item._isWorkflowMetadata).map((item, i) => (
                  <tr key={item.id || i}>
                    <td>
                      <div>{item.description || ''}</div>
                      <div className="text-sm text-muted font-arabic mt-1" dir="rtl">{item.descriptionAr || 'جاري الترجمة...'}</div>
                    </td>
                    <td className="text-center">{item.quantity} {item.unit}</td>
                    <td className="text-right">{formatCurrency(item.price || 0)}</td>
                    <td className="text-right">{formatCurrency(item.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-6">
            {mode === 'invoice' && qrDataUrl && (
              <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <QrCode size={18} className="text-emerald-400" />
                  ZATCA E-Invoice QR
                </h3>
                <div className="bg-white p-2 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <img src={qrDataUrl} alt="ZATCA QR Code" className="w-32 h-32" />
                </div>
              </div>
            )}
            
            <div className={clsx(styles.summary, "flex-1 mt-0")}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(quotation.subtotal || 0)}</span>
              </div>
              {(quotation.discount || 0) > 0 && (
                <div className={clsx(styles.summaryRow, "text-rose-400")}>
                  <span>Discount</span>
                  <span>- {formatCurrency(quotation.discount || 0)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Net Amount</span>
                <span>{formatCurrency((quotation.subtotal || 0) - (quotation.discount || 0))}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>VAT ({quotation.vatRate || 15}%)</span>
                <span>{formatCurrency(quotation.vatAmount || 0)}</span>
              </div>
              <div className={clsx(styles.summaryRow, styles.grandTotal)}>
                <span>Grand Total</span>
                <span>{formatCurrency(quotation.grandTotal || quotation.total || 0)}</span>
              </div>
            </div>
          </div>

          {quotation.notes && (
            <div className={styles.notes}>
              <label>Notes</label>
              <p>{quotation.notes}</p>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Document Preview
            </h3>
            <div className="rounded-xl overflow-hidden border border-white/10 h-[500px] w-full bg-slate-900/50">
              {client && settings ? (
                <PDFViewer key={JSON.stringify((translatedQuotation.items || []).map((i: any) => i?.description || i?.id))} width="100%" height="100%" showToolbar={true} style={{ border: 'none' }}>
                  {mode === 'invoice' ? (
                    <InvoicePDF quotation={translatedQuotation} client={client} settings={settings} qrDataUrl={qrDataUrl} />
                  ) : (
                    <QuotationPDF quotation={translatedQuotation} client={client} settings={settings} />
                  )}
                </PDFViewer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  Loading preview data...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
