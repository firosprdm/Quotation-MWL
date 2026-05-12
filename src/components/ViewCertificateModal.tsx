'use client';

import React from 'react';
import { Quotation, Client } from '@/types';
import { X, Award, Calendar, User, FileText, Download, CheckCircle2 } from 'lucide-react';
import styles from './ViewCertificateModal.module.css';
import { clsx } from 'clsx';
import { OnDemandPDFDownload } from './OnDemandPDFDownload';
import { CertificatePDF } from './CertificatePDF';
import { useApp } from '@/context/AppContext';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

interface Props {
  quotation: Quotation;
  client?: Client;
  onClose: () => void;
}

export function ViewCertificateModal({ quotation, client, onClose }: Props) {
  const { settings } = useApp();
  const [activeQuote, setActiveQuote] = React.useState<Quotation>(quotation);

  React.useEffect(() => {
    const hasLineItems = (activeQuote.items || []).some((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata);
    if (!hasLineItems) {
      fetch(`/api/v1/erpnext/quotations?id=${quotation.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.items && data.items.length > 0) {
            setActiveQuote({ ...quotation, items: data.items });
          }
        })
        .catch(() => {});
    }
  }, [quotation.id]);

  React.useEffect(() => {
    setActiveQuote(prev => {
      const realPrevCount = (prev.items || []).filter((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata).length;
      const realNewCount = (quotation.items || []).filter((i: any) => i && typeof i === 'object' && !i._isWorkflowMetadata).length;
      return {
        ...quotation,
        items: realPrevCount > realNewCount ? prev.items : quotation.items
      };
    });
  }, [quotation]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Work Done': return styles.done;
      case 'Work On going': return styles.ongoing;
      default: return styles.pending;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={clsx('glass-panel', styles.modal)} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.iconBox}>
              <Award size={32} className="text-blue-400" />
            </div>
            <div>
              <h2 className={styles.title}>Work Completion Certificate</h2>
              <p className={styles.subtitle}>
                Linked to Quotation {activeQuote.number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={clsx(styles.status, getStatusClass(activeQuote.workStatus || ''))}>
              {activeQuote.workStatus || 'Work pending'}
            </div>
            {client && (
              <OnDemandPDFDownload 
                document={<CertificatePDF quotation={activeQuote} client={client} settings={settings} />} 
                fileName={`Certificate_${activeQuote.number}.pdf`}
                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                title="Download PDF"
                icon={<Download size={18} />}
              />
            )}
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <User size={18} className="text-muted" />
              <div>
                <label>Customer</label>
                <p>{client?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <FileText size={18} className="text-muted" />
              <div>
                <label>PO / Ticket</label>
                <p>{activeQuote.poNumber || '---'} / {activeQuote.ticketNumber || '---'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Calendar size={18} className="text-muted" />
              <div>
                <label>Certificate Date</label>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
             <h3 className="text-sm font-medium text-blue-400 mb-2 uppercase tracking-wider flex items-center gap-2">
               <CheckCircle2 size={16} />
               Subject
             </h3>
             <p className="text-white font-medium">{activeQuote.subject || 'Project Completion Certification'}</p>
             {activeQuote.subjectAr && <p className="text-muted text-sm mt-1 font-arabic" dir="rtl">{activeQuote.subjectAr}</p>}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="w-16 text-center">#</th>
                  <th>Description of Completed Works</th>
                  <th className="text-center w-32">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(activeQuote.items || []).filter((item: any) => item && typeof item === 'object' && !item._isWorkflowMetadata).map((item, i) => (
                  <tr key={item.id || i}>
                    <td className="text-center text-muted">{i + 1}</td>
                    <td>
                      <div className="font-medium">{item.description}</div>
                      {item.descriptionAr && (
                        <div className="text-[12px] text-muted font-arabic mt-1" dir="rtl">{item.descriptionAr}</div>
                      )}
                    </td>
                    <td className="text-center font-medium">{item.quantity} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Certificate Preview
            </h3>
            <div className="rounded-xl overflow-hidden border border-white/10 h-[600px] w-full bg-slate-900/50 shadow-2xl">
              {client && settings ? (
                <PDFViewer key={JSON.stringify((activeQuote.items || []).map((i: any) => i?.description || i?.id))} width="100%" height="100%" showToolbar={true} style={{ border: 'none' }}>
                   <CertificatePDF quotation={activeQuote} client={client} settings={settings} />
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
