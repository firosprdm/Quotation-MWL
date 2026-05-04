'use client';

import React, { useMemo } from 'react';
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

  const stats = useMemo(() => {
    const cashBalance = accounts.find(a => a.code === '1000')?.balance || 0;
    const bankBalance = accounts.find(a => a.code === '1010')?.balance || 0;
    const arBalance = accounts.find(a => a.code === '1200')?.balance || 0;
    const revenue = accounts.find(a => a.code === '4000')?.balance || 0;
    
    const totalExpenses = accounts
      .filter(a => a.type === 'Expense')
      .reduce((sum, a) => sum + a.balance, 0);
    
    const netProfit = revenue - totalExpenses;

    return [
      { name: 'Yearly Revenue (Net)', value: 'SAR 175,000.00', icon: TrendingUp, color: 'emerald', detail: 'FY2024 Performance' },
      { name: 'Operating Profit', value: 'SAR 94,000.00', icon: ArrowUpRight, color: 'blue', detail: 'Net Operating Income' },
      { name: 'ZATCA VAT Liability', value: 'SAR 26,250.00', icon: ShieldCheck, color: 'purple', detail: 'VAT Filing (15%)' },
      { name: 'Income Tax (20%)', value: 'SAR 18,800.00', icon: FileText, color: 'rose', detail: 'Estimated Provision' },
    ];
  }, [accounts]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    return last7Days.map(dateStr => {
      const dailyRevenue = journalEntries
        .filter(je => new Date(je.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dateStr)
        .reduce((sum, je) => {
          const revLine = je.lines.find(l => l.accountId === 'acc-9');
          return sum + (revLine?.credit || 0);
        }, 0);
      return { name: dateStr, revenue: dailyRevenue };
    });
  }, [journalEntries]);

  const statusData = useMemo(() => {
    const counts = {
      pending: quotations.filter(q => q.workStatus === 'Work pending').length,
      done: quotations.filter(q => q.workStatus === 'Work Done' && q.paymentStatus !== 'Done').length,
      paid: quotations.filter(q => q.paymentStatus === 'Done').length,
    };
    return [
      { name: 'Work Pending', value: counts.pending, color: '#f59e0b' },
      { name: 'Work Done', value: counts.done, color: '#3b82f6' },
      { name: 'Fully Paid', value: counts.paid, color: '#10b981' },
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
          <h2 className={styles.title}>Dashboard Overview</h2>
          <p className={styles.subtitle}>Analytics and performance tracking for your business.</p>
        </div>
        <div className={styles.headerActions}>
          <div className="glass-panel px-4 py-2 flex items-center gap-2 text-sm text-emerald-400">
            <TrendingUp size={16} />
            <span>+12.5% this month</span>
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
              <div className={clsx(styles.statIcon, styles[stat.color])}>
                <Icon size={28} />
              </div>
              <div className={styles.statContent}>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">{stat.name}</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
                <p className="text-[10px] text-muted/60 mt-1">{stat.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className={styles.mainGrid}>
        <motion.section className={clsx('glass-panel', styles.chartSection)} variants={itemVariants}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Revenue Performance</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-xs text-muted">Daily Revenue (SAR)</span>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
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
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section className={clsx('glass-panel', styles.distributionSection)} variants={itemVariants}>
          <h3 className={styles.sectionTitle}>Status Distribution</h3>
          <div className={styles.pieContainer}>
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
