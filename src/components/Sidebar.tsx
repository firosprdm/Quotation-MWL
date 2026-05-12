'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileSignature, 
  Building2, 
  Box, 
  Settings, 
  BadgeDollarSign,
  FileSpreadsheet,
  Landmark,
  UserCog,
  Coins,
  Globe,
  Workflow,
  ReceiptText,
  ClipboardCheck,
  LineChart,
  FileText,
  Users
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './Sidebar.module.css';
import { useApp } from '@/context/AppContext';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export const navGroups = [
  {
    title: 'ERP OPERATIONS',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
      { icon: FileSignature, label: 'Quotations', href: '/quotations' },
      { icon: BadgeDollarSign, label: 'Sales', href: '/sales' },
      { icon: Workflow, label: 'Work Flow', href: '/certificates' },
      { icon: FileSpreadsheet, label: 'Invoices', href: '/invoices' },
      { icon: ReceiptText, label: 'Purchase Invoices', href: '/purchase-invoices' },
      { icon: Building2, label: 'Clients', href: '/clients' },
      { icon: Users, label: 'Suppliers', href: '/suppliers' },
      { icon: Box, label: 'Inventory', href: '/inventory' },
    ]
  },
  {
    title: 'ACCOUNTING & FINANCE',
    items: [
      { icon: Landmark, label: 'Financial Ledger', href: '/accounts' },
      { icon: LineChart, label: 'Financial Graphs', href: '/graphs' },
      { icon: Coins, label: 'Payroll', href: '/payroll' },
      { icon: UserCog, label: 'Employees', href: '/employees' },
    ]
  },
  {
    title: 'KSA COMPLIANCE',
    items: [
      { icon: Globe, label: 'MISA Portal', href: '/misa' },
      { icon: ReceiptText, label: 'VAT Module', href: '/vat' },
      { icon: ClipboardCheck, label: 'Audit Reports', href: '/reports' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { icon: Settings, label: 'Settings', href: '/settings' },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useApp();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <FileText size={24} className="text-white" />
        </div>
        <div className={styles.logoTextWrapper}>
          <h1 className={styles.logoTextMain}>MARINA</h1>
          <p className={styles.logoTextSub}>WorldLink</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <h3 className="px-5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              {group.title}
            </h3>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  styles.navItem,
                  "no-underline group relative",
                  pathname === item.href && styles.active
                )}
                style={{ textDecoration: 'none' }}
              >
                {pathname === item.href && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon size={18} className={clsx("relative z-10 transition-colors", pathname === item.href ? "text-blue-400" : "text-white/50 group-hover:text-white")} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>{currentUser?.name?.[0] || 'U'}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{currentUser?.name || 'User'}</p>
            <p className={styles.userRole}>{currentUser?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
          </div>
          <button 
            onClick={() => logout()} 
            className={styles.logoutBtn}
            title="Logout"
          >
            <LogOut size={18} className="icon-hover" />
            <span className="premium-label ml-2 !text-white/60 group-hover:!text-white">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
