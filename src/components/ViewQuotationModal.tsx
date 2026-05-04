'use client';

import React, { useState, useEffect } from 'react';
import { Quotation, Client } from '@/types';
import { X, FileText, Calendar, User, ShoppingCart, Download, QrCode } from 'lucide-react';
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
}

export function ViewQuotationModal({ quotation, client, onClose }: Props) {
  const { settings } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (quotation.qrCode) {
      QRCode.toDataURL(quotation.qrCode, { margin: 1, width: 200 })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [quotation.qrCode]);

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
          {client && (
            <OnDemandPDFDownload 
              document={<QuotationPDF quotation={quotation} client={client} settings={settings} />} 
              fileName={`Quotation_${quotation.number}.pdf`}
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
                {quotation.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td className="text-center">{item.quantity} {item.unit}</td>
                    <td className="text-right">{formatCurrency(item.price || 0)}</td>
                    <td className="text-right">{formatCurrency(item.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-6">
            {qrDataUrl && (
              <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
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
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Document Preview
            </h3>
            <div className="rounded-xl overflow-hidden border border-white/10 h-[500px] w-full bg-slate-900/50">
              <PDFViewer width="100%" height="100%" showToolbar={true} style={{ border: 'none' }}>
                {quotation.status === 'approved' && quotation.salesStatus === 'PO recieved' ? (
                   <InvoicePDF quotation={quotation} client={client!} settings={settings} qrDataUrl={qrDataUrl} />
                ) : (
                   <QuotationPDF quotation={quotation} client={client!} settings={settings} />
                )}
              </PDFViewer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
