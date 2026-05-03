'use client';

import React from 'react';
import { Client, Quotation } from '@/types';
import { X, Mail, Phone, MapPin, Hash, ShoppingCart, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './ClientDetailsModal.module.css';

interface Props {
  client: Client;
  quotations: Quotation[];
  onClose: () => void;
}

export function ClientDetailsModal({ client, quotations, onClose }: Props) {
  // Calculate sales history
  const clientQuotations = quotations.filter(q => q.clientId === client.id);
  const approvedQuotations = clientQuotations.filter(q => q.status === 'approved');
  
  const totalSalesAmount = approvedQuotations.reduce((acc, q) => acc + (q.grandTotal || q.total || 0), 0);
  const totalReceivedAmount = approvedQuotations.reduce((acc, q) => acc + (q.receivedAmount || 0), 0);
  const totalPendingAmount = totalSalesAmount - totalReceivedAmount;
  const totalQuotationsCount = clientQuotations.length;
  const approvedCount = approvedQuotations.length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={clsx('glass-panel', styles.modal)} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <header className={styles.header}>
          <div className={styles.avatarLarge}>{client.name[0]}</div>
          <div>
            <h2 className={styles.title}>{client.name}</h2>
            <p className={styles.subtitle}>Client Details & Sales History</p>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Mail size={16} className="text-blue-400" />
                <div>
                  <label>Email</label>
                  <p>{client.email || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Phone size={16} className="text-green-400" />
                <div>
                  <label>Phone</label>
                  <p>{client.phone || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Hash size={16} className="text-purple-400" />
                <div>
                  <label>VAT Number</label>
                  <p>{client.vatNumber || 'Not Registered'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Hash size={16} className="text-amber-400" />
                <div>
                  <label>CR Number</label>
                  <p>{client.otherId || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <MapPin size={16} className="text-rose-400" />
                <div>
                  <label>Address</label>
                  <p>{client.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>Sales Analytics</h3>
            <div className={styles.statsGrid}>
              <div className={clsx('glass-panel', styles.statCard)}>
                <ShoppingCart size={24} className="text-blue-400" />
                <div className={styles.statInfo}>
                  <label>Total Quotations</label>
                  <p>{totalQuotationsCount}</p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard)}>
                <TrendingUp size={24} className="text-green-400" />
                <div className={styles.statInfo}>
                  <label>Approved Deals</label>
                  <p>{approvedCount}</p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard, styles.fullWidth)}>
                <div className={styles.revenueIcon}>SAR</div>
                <div className={styles.statInfo}>
                  <label>Total Sales</label>
                  <p className={styles.revenueAmount}>
                    {totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard)}>
                <CheckCircle size={24} className="text-emerald-400" />
                <div className={styles.statInfo}>
                  <label>Received</label>
                  <p className="text-emerald-400">SAR {totalReceivedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className={clsx('glass-panel', styles.statCard)}>
                <Clock size={24} className="text-amber-400" />
                <div className={styles.statInfo}>
                  <label>Pending</label>
                  <p className="text-amber-400">SAR {totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
