'use client';

import React from 'react';
import { Supplier, PurchaseInvoice, CompanySettings } from '@/types';
import { X, Mail, Phone, MapPin, Hash, ShoppingCart, TrendingUp, CheckCircle, Clock, FileDown } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './ClientDetailsModal.module.css';
import { useApp } from '@/context/AppContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PartnerLedgerPDF } from './PartnerLedgerPDF';

interface Props {
  supplier: Supplier;
  purchaseInvoices: PurchaseInvoice[];
  onClose: () => void;
}

export function SupplierDetailsModal({ supplier, purchaseInvoices, onClose }: Props) {
  const { settings } = useApp();
  const [reportType, setReportType] = React.useState<'soa' | 'ledger'>('soa');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [onlyUnpaid, setOnlyUnpaid] = React.useState(false);
  
  // Calculate procurement history
  const supplierInvoices = purchaseInvoices.filter(inv => inv.supplierId === supplier.id);
  const submittedInvoices = supplierInvoices.filter(inv => inv.status !== 'draft' && inv.status !== 'cancelled');
  
  const totalPurchaseAmount = submittedInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  const totalPaidAmount = submittedInvoices.reduce((acc, inv) => acc + (inv.receivedAmount || 0), 0);
  const totalOutstandingAmount = totalPurchaseAmount - totalPaidAmount;
  const totalBillsCount = supplierInvoices.length;
  const submittedCount = submittedInvoices.length;

  // Mocking Quotation format for PartnerLedgerPDF compatibility
  const mappedInvoices = supplierInvoices.map(inv => ({
    ...inv,
    clientId: inv.supplierId, // map for ledger logic
    total: inv.grandTotal,
    invoiceDate: new Date(inv.date).toISOString().split('T')[0],
    number: inv.number || inv.id
  } as any));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={clsx('glass-panel', styles.modal)} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={16} />
        </button>

        <header className={styles.header}>
          <div className={styles.avatarLarge}>{supplier.name[0]}</div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className={styles.title}>{supplier.name}</h2>
                <p className={styles.subtitle}>Supplier Details & Procurement Auditing</p>
              </div>
              <PDFDownloadLink
                document={
                  <PartnerLedgerPDF 
                    client={supplier as any} 
                    invoices={mappedInvoices} 
                    settings={settings} 
                    filters={{ startDate, endDate, onlyUnpaid, reportType }} 
                  />
                }
                fileName={`${reportType === 'soa' ? 'SOA' : 'Ledger'}_${supplier.name.replace(/\s+/g, '_')}.pdf`}
                className={styles.exportBtn}
              >
                {({ loading }) => (
                  <>
                    <FileDown size={22} className={styles.exportIcon} />
                    <span>{loading ? 'GENERATING...' : `EXPORT ${reportType.toUpperCase()}`}</span>
                  </>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </header>

        {/* Report Filter Bar */}
        <section className={styles.filterBar}>
          <div className={styles.filterRow}>

            {/* Report type toggle */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Report Format</label>
              <div className={styles.toggleGroup}>
                <button
                  onClick={() => setReportType('soa')}
                  className={clsx(styles.toggleBtn, reportType === 'soa' && styles.toggleBtnActive)}
                >
                  Statement of Account
                </button>
                <button
                  onClick={() => setReportType('ledger')}
                  className={clsx(styles.toggleBtn, reportType === 'ledger' && styles.toggleBtnActive)}
                >
                  Vendor Ledger
                </button>
              </div>
            </div>

            {/* From date */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                className={clsx('glass-input', styles.filterInput)}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            {/* To date */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                className={clsx('glass-input', styles.filterInput)}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            {/* Checkbox */}
            <div
              className={clsx(styles.filterGroup, styles.checkboxGroup)}
              onClick={() => setOnlyUnpaid(!onlyUnpaid)}
            >
              <label className={styles.filterLabel}>Filter</label>
              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={onlyUnpaid}
                  onChange={() => {}}
                />
                <span className={styles.checkboxLabel}>Unpaid Only</span>
              </div>
            </div>

          </div>
        </section>

        <div className={styles.content}>
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <Mail size={14} className="text-blue-400" />
                </div>
                <div>
                  <label>Email</label>
                  <p>{supplier.email || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <Phone size={14} className="text-green-400" />
                </div>
                <div>
                  <label>Phone</label>
                  <p>{supplier.phone || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <Hash size={14} className="text-purple-400" />
                </div>
                <div>
                  <label>VAT Number</label>
                  <p>{supplier.vatNumber || 'Not Registered'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <Hash size={14} className="text-amber-400" />
                </div>
                <div>
                  <label>CR Number</label>
                  <p>{supplier.otherId || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <MapPin size={14} className="text-rose-400" />
                </div>
                <div>
                  <label>Address</label>
                  <p className="line-clamp-2">{supplier.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>Procurement Analytics</h3>
            <div className={styles.statsGrid}>
              <div className={clsx('glass-panel', styles.statCard)}>
                <div className={styles.iconBox}>
                  <ShoppingCart size={14} className="text-blue-400" />
                </div>
                <div className={styles.statInfo}>
                  <label>Total Bills</label>
                  <p>{totalBillsCount}</p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard)}>
                <div className={styles.iconBox}>
                  <TrendingUp size={14} className="text-green-400" />
                </div>
                <div className={styles.statInfo}>
                  <label>Validated Bills</label>
                  <p>{submittedCount}</p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard, styles.fullWidth)}>
                <div className={styles.revenueIcon}>SAR</div>
                <div className={styles.statInfo}>
                  <label>Total Procurement</label>
                  <p className={styles.revenueAmount}>
                    {totalPurchaseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard)}>
                <div className={styles.iconBox}>
                  <CheckCircle size={14} className="text-emerald-400" />
                </div>
                <div className={styles.statInfo}>
                  <label>Total Paid</label>
                  <p className="text-emerald-400">{totalPaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard)}>
                <div className={styles.iconBox}>
                  <Clock size={14} className="text-amber-400" />
                </div>
                <div className={styles.statInfo}>
                  <label>Outstanding</label>
                  <p className="text-amber-400">{totalOutstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
