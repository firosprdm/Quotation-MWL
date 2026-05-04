'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings, 
  ShoppingCart,
  PlusCircle,
  Award,
  Receipt,
  Wallet,
  Users2,
  Banknote,
  ShieldAlert,
  GitBranch,
  FilePieChart,
  BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './Sidebar.module.css';
import { useApp } from '@/context/AppContext';
import { LogOut } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Quotations', href: '/quotations' },
  { icon: ShoppingCart, label: 'Sales', href: '/sales' },
  { icon: GitBranch, label: 'Work Flow', href: '/certificates' },
  { icon: Receipt, label: 'Invoices', href: '/invoices' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: FilePieChart, label: 'Reports', href: '/reports' },
  { icon: BarChart3, label: 'Graphs', href: '/graphs' },
  { icon: Users2, label: 'Employees', href: '/employees' },
  { icon: Banknote, label: 'Payroll', href: '/payroll' },
  { icon: ShieldAlert, label: 'MISA Portal', href: '/misa' },
  { icon: Users, label: 'Clients', href: '/clients' },
  { icon: Package, label: 'Inventory', href: '/inventory' },
  { icon: Settings, label: 'Settings', href: '/settings' },
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
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              styles.navItem,
              pathname === item.href && styles.active
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
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
            <LogOut size={16} />
            <span className="text-[10px] font-bold uppercase ml-1">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
