'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import styles from './MainLayout.module.css';
import { Calculator } from './Calculator';
import calcStyles from './Calculator.module.css';
import { Calculator as CalcIcon } from 'lucide-react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCalcOpen, setIsCalcOpen] = React.useState(false);

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>

      {/* Floating Calculator Toggle */}
      <button 
        className={calcStyles.floatingBtn} 
        onClick={() => setIsCalcOpen(!isCalcOpen)}
        title="Open Calculator"
      >
        <CalcIcon size={24} />
      </button>

      {/* Calculator Modal */}
      {isCalcOpen && <Calculator onClose={() => setIsCalcOpen(false)} />}
    </div>
  );
}
