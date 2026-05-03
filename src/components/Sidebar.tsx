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
  Wallet
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './Sidebar.module.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Quotations', href: '/quotations' },
  { icon: ShoppingCart, label: 'Sales', href: '/sales' },
  { icon: Award, label: 'Certificates', href: '/certificates' },
  { icon: Receipt, label: 'Invoices', href: '/invoices' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: Users, label: 'Clients', href: '/clients' },
  { icon: Package, label: 'Inventory', href: '/inventory' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <FileText size={24} className="text-white" />
        </div>
        <h1 className={styles.logoText}>Marina<span>Quote</span></h1>
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
          <div className={styles.avatar}>A</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>Admin User</p>
            <p className={styles.userRole}>Sales Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
