'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, Users, Package, TrendingUp } from 'lucide-react';
import styles from './page.module.css';
import { clsx } from 'clsx';

export default function Dashboard() {
  const { quotations, clients, inventory } = useApp();

  const stats = [
    { name: 'Total Quotations', value: quotations.length, icon: FileText, color: 'blue' },
    { name: 'Total Clients', value: clients.length, icon: Users, color: 'purple' },
    { name: 'Inventory Items', value: inventory.length, icon: Package, color: 'rose' },
    { name: 'Total Revenue', value: `$${quotations.reduce((acc, q) => acc + q.total, 0).toLocaleString()}`, icon: TrendingUp, color: 'emerald' },
  ];

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <h2 className={styles.title}>Dashboard</h2>
        <p className={styles.subtitle}>Welcome back! Here's an overview of your quotations.</p>
      </header>

      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={clsx('glass-panel', styles.statCard)}>
              <div className={clsx(styles.statIcon, styles[stat.color])}>
                <Icon size={24} />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>{stat.name}</p>
                <h3 className={styles.statValue}>{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Quotations</h3>
          <button className="glass-button px-4 py-2 rounded-lg text-sm">View All</button>
        </div>
        
        <div className={clsx('glass-panel', styles.tableContainer)}>
          {quotations.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No quotations found. Create your first one to get started!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.slice(0, 5).map((q) => (
                  <tr key={q.id}>
                    <td className="font-semibold">{q.number}</td>
                    <td>{clients.find(c => c.id === q.clientId)?.name || 'Unknown'}</td>
                    <td>{new Date(q.date).toLocaleDateString()}</td>
                    <td className="font-bold">${q.total.toLocaleString()}</td>
                    <td>
                      <span className={clsx(styles.status, styles[q.status])}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
