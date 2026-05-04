'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import styles from './MainLayout.module.css';
import { useApp } from '@/context/AppContext';
import LoginPage from './LoginPage';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded } = useApp();

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
