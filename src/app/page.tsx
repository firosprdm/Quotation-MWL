'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FileText, 
  Users, 
  Package, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import styles from './page.module.css';
import { clsx } from 'clsx';
import { formatCurrency, formatNumber } from '@/lib/format';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { PipelineTracker } from '@/components/PipelineTracker';

export default function Dashboard() {
  const { quotations, clients, inventory, accounts, journalEntries, isLoaded } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stats = useMemo(() => {
    const cashBalance = accounts.find(a => a.code === '1000')?.balance || 0;
    const bankBalance = accounts.find(a => a.code === '1010')?.balance || 0;
    const arBalance = accounts.find(a => a.code === '1200')?.balance || 0;
    const revenue = accounts.find(a => a.code === '4000')?.balance || 0;
    
    const totalExpenses = accounts
      .filter(a => a.type === 'Expense')
      .reduce((sum, a) => sum + a.balance, 0);
    
    const netProfit = revenue - totalExpenses;

    const vatOutput = accounts.find(a => a.code === '2200')?.balance || 0;
    const vatInput = accounts.find(a => a.code === '1500')?.balance || 0;
    const vatLiability = vatOutput - vatInput;
    
    const incomeTaxProvision = netProfit > 0 ? netProfit * 0.20 : 0;

    return [
      { name: 'Yearly Revenue (Net)', value: formatCurrency(revenue), icon: TrendingUp, color: 'emerald', detail: 'FY2024 Performance' },
      { name: 'Operating Profit', value: formatCurrency(netProfit), icon: ArrowUpRight, color: 'blue', detail: 'Net Operating Income' },
      { name: 'ZATCA VAT Liability', value: formatCurrency(vatLiability), icon: ShieldCheck, color: 'purple', detail: 'VAT Filing (15%)' },
      { name: 'Income Tax (20%)', value: formatCurrency(incomeTaxProvision), icon: FileText, color: 'rose', detail: 'Estimated Provision' },
    ];
  }, [accounts]);

  const chartData = useMemo(() => {
    // Build a map from month label -> revenue from approved quotations
    const revenueByMonth: Record<string, number> = {};
    quotations
      .filter(q => q.status === 'approved')
      .forEach(q => {
        const label = new Date(q.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        revenueByMonth[label] = (revenueByMonth[label] || 0) + (q.grandTotal || 0);
      });

    // Also include journal entry revenue if present
    journalEntries.forEach(je => {
      const linesArray = Array.isArray(je.lines) ? je.lines : (typeof je.lines === 'string' ? JSON.parse(je.lines) : []);
      const revLine = linesArray.find((l: any) => l.accountId === 'acc-9');
      if (revLine?.credit) {
        const label = new Date(je.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        revenueByMonth[label] = (revenueByMonth[label] || 0) + revLine.credit;
      }
    });

    // Get last 6 calendar months
    return [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const shortLabel = d.toLocaleDateString('en-US', { month: 'short' });
      return { name: shortLabel, revenue: Math.round(revenueByMonth[label] || 0) };
    });
  }, [quotations, journalEntries]);

  const statusData = useMemo(() => {
    // Support both legacy and seeded status values
    const approved = quotations.filter(q => q.status === 'approved');
    const counts = {
      notStarted: approved.filter(q => !q.workStatus || q.workStatus === 'not_started' || q.workStatus === 'Work pending').length,
      inProgress: approved.filter(q => q.workStatus === 'in_progress').length,
      completed: approved.filter(q => q.workStatus === 'completed' || q.workStatus === 'Work Done').length,
      paid: approved.filter(q => q.paymentStatus === 'paid' || q.paymentStatus === 'Done').length,
      rejected: quotations.filter(q => q.status === 'rejected').length,
    };
    return [
      { name: 'Not Started', value: counts.notStarted, color: '#f59e0b' },
      { name: 'In Progress', value: counts.inProgress, color: '#6366f1' },
      { name: 'Completed', value: counts.completed, color: '#3b82f6' },
      { name: 'Paid', value: counts.paid, color: '#10b981' },
      { name: 'Rejected', value: counts.rejected, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [quotations]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'rejected': return <XCircle size={16} className="text-rose-400" />;
      case 'waiting': return <Clock size={16} className="text-amber-400" />;
      default: return <AlertCircle size={16} className="text-blue-400" />;
    }
  };

  return (
    <motion.div 
      className="fade-in"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Dashboard Overview</h2>
          <p className="premium-subtitle">Analytics and performance tracking for your business.</p>
        </div>
        <div className={styles.headerActions}>
          <div className="glass-panel px-4 py-2 flex items-center gap-2 text-sm text-emerald-400">
            <TrendingUp size={20} className="icon-hover" />
            <span className="font-medium tracking-tight">+12.5% this month</span>
          </div>
        </div>
      </header>

      <motion.div className={styles.statsGrid} variants={containerVariants}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.name} 
              className={clsx('glass-panel', styles.statCard, 'group cursor-pointer hover:scale-[1.02] transition-all duration-300')}
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className={clsx(styles.statIcon, styles[stat.color], "icon-hover")}>
                <Icon size={32} />
              </div>
              <div className={styles.statContent}>
                <p className="premium-label mb-1 opacity-80">{stat.name}</p>
                <h3 className="text-2xl font-normal text-white tracking-tighter">{stat.value}</h3>
                <p className="text-[12px] text-muted/60 mt-1 font-medium italic">{stat.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className={styles.mainGrid}>
        <motion.section className={clsx('glass-panel', styles.chartSection)} variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="premium-label !text-white !text-sm">Revenue Performance</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="premium-label !normal-case !tracking-normal opacity-60">Daily Revenue</span>
            </div>
          </div>
          <div className={styles.chartContainer}>
            {!isMounted ? (
              <div className="flex items-center justify-center h-full text-muted">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                    itemStyle={{ color: '#3b82f6' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#colorRevenue)" 
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.section>

        <motion.section className={clsx('glass-panel', styles.distributionSection)} variants={itemVariants}>
          <h3 className="premium-label !text-white !text-sm mb-6">Status Distribution</h3>
          <div className={styles.pieContainer}>
            {!isMounted ? (
              <div className="flex items-center justify-center h-full text-muted">Loading chart...</div>
            ) : statusData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted text-sm text-center px-4">
                No active quotations found for distribution.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieCenter}>
                  <span className={styles.pieTotal}>{quotations.length}</span>
                  <span className={styles.pieLabel}>Total</span>
                </div>
              </>
            )}
          </div>
          <div className={styles.legend}>
            {statusData.map((item) => (
              <div key={item.name} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: item.color }}></span>
                <span className={styles.legendName}>{item.name}</span>
                <span className={styles.legendValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <PipelineTracker />

    </motion.div>
  );
}
