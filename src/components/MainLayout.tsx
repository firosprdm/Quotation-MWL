'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useApp } from '@/context/AppContext';
import LoginPage from './LoginPage';
import { Calendar, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './MainLayout.module.css';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, dateFilter, setDateFilter } = useApp();
  const [showDateFilter, setShowDateFilter] = useState(false);

  const filterOptions = [
    { value: '1M', label: 'Last 30 Days' },
    { value: '3M', label: 'Last 3 Months' },
    { value: '6M', label: 'Last 6 Months' },
    { value: '1Y', label: 'Last Year' },
    { value: 'ALL', label: 'All Time' },
  ];

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
      <div className="bg-mesh-center" />
      <Sidebar />
      <main className={styles.main}>
        <div className="flex justify-end mb-8 relative z-50">
          <div className="relative">
            <button 
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center gap-3 px-5 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-white/20 rounded-xl transition-all shadow-lg backdrop-blur-md"
            >
              <Calendar size={16} className="text-blue-400" />
              <span className="text-sm font-medium tracking-wide text-slate-200">
                {filterOptions.find(o => o.value === dateFilter)?.label}
              </span>
              <ChevronDown size={14} className={clsx("text-slate-400 transition-transform duration-300", showDateFilter && "rotate-180")} />
            </button>
            
            {showDateFilter && (
              <div className="absolute right-0 mt-3 w-56 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                {filterOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setDateFilter(opt.value as any);
                      setShowDateFilter(false);
                    }}
                    className={clsx(
                      "w-full text-left px-5 py-3 text-sm transition-all flex items-center justify-between group uppercase",
                      dateFilter === opt.value 
                        ? "bg-blue-500/10 text-blue-400 font-medium" 
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {opt.label}
                    {dateFilter === opt.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
