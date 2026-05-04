'use client';

import React from 'react';
import { 
  ShieldCheck, 
  FileCheck2, 
  BarChart3, 
  Gavel, 
  Users2,
  Building2,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  History
} from 'lucide-react';
import styles from './misa.module.css';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';

export default function MisaPortal() {
  const { quotations = [], payroll = [], employees = [] } = useApp();

  const totalRevenue = quotations.filter(q => !!q.invoiceNumber).reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const totalEmployees = employees?.length || 0;
  const activeProjects = quotations.filter(q => q.workStatus === 'Work On going').length;

  return (
    <div className={clsx("fade-in", styles.container)}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>MISA Compliance Portal</h2>
          <p className={styles.subtitle}>Unified dashboard for Saudi Arabian regulatory reporting.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass-button px-6 py-2 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <ShieldCheck size={18} />
            <span>Generate Compliance Audit</span>
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {/* MISA Quarterly Reporting */}
        <div className={clsx('glass-panel', styles.card)}>
          <div className={styles.cardHeader}>
            <div className={clsx(styles.iconBox, "bg-blue-500/20 text-blue-400")}>
              <BarChart3 size={24} />
            </div>
            <h3 className={styles.cardTitle}>MISA Reporting</h3>
          </div>
          <div className="flex flex-col gap-1">
            <p className={styles.subtitle}>Current Quarter Revenue</p>
            <p className={styles.kpi}>{formatCurrency(totalRevenue)}</p>
          </div>
          <div className={styles.complianceList}>
            <ComplianceItem label="Q1 2024 Financial Report" status="Active" />
            <ComplianceItem label="Annual Audited Statement" status="Warning" date="Due in 45 days" />
            <ComplianceItem label="Investment License Validity" status="Active" date="Valid until 2026" />
          </div>
        </div>

        {/* ZATCA & Tax */}
        <div className={clsx('glass-panel', styles.card)}>
          <div className={styles.cardHeader}>
            <div className={clsx(styles.iconBox, "bg-amber-500/20 text-amber-400")}>
              <Gavel size={24} />
            </div>
            <h3 className={styles.cardTitle}>ZATCA & Tax</h3>
          </div>
          <div className="flex flex-col gap-1">
            <p className={styles.subtitle}>Pending VAT Filing</p>
            <p className={styles.kpi}>{formatCurrency(totalRevenue * 0.15)}</p>
          </div>
          <div className={styles.complianceList}>
            <ComplianceItem label="E-Invoicing Phase 2 Integration" status="Active" />
            <ComplianceItem label="VAT Return - April 2024" status="Active" />
            <ComplianceItem label="Zakat Filing 2023" status="Active" />
          </div>
        </div>

        {/* Labor & WPS */}
        <div className={clsx('glass-panel', styles.card)}>
          <div className={styles.cardHeader}>
            <div className={clsx(styles.iconBox, "bg-fuchsia-500/20 text-fuchsia-400")}>
              <Users2 size={24} />
            </div>
            <h3 className={styles.cardTitle}>Labor & WPS</h3>
          </div>
          <div className="flex flex-col gap-1">
            <p className={styles.subtitle}>Employees Registered</p>
            <p className={styles.kpi}>{totalEmployees}</p>
          </div>
          <div className={styles.complianceList}>
            <ComplianceItem label="WPS Compliance Ratio" status="Active" value="100%" />
            <ComplianceItem label="GOSI Monthly Payments" status="Active" />
            <ComplianceItem label="Qiwa Saudization Level" status="Warning" value="Green" />
          </div>
        </div>
      </div>

      <div className={clsx('glass-panel', "p-8")}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <History className="text-blue-400" />
            <h3 className="text-xl font-bold text-white">Compliance Calendar 2024</h3>
          </div>
          <button className="text-sm text-blue-400 font-bold hover:underline">View Full Calendar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <CalendarEvent month="MAY" day="15" event="VAT Monthly Return" type="tax" />
          <CalendarEvent month="MAY" day="28" event="WPS Salary Submission" type="labor" />
          <CalendarEvent month="JUN" day="30" event="MISA Quarterly Upload" type="misa" />
          <CalendarEvent month="JUL" day="15" event="GOSI Monthly Contribution" type="labor" />
        </div>
      </div>
    </div>
  );
}

const ComplianceItem = ({ label, status, date, value }: any) => (
  <div className={styles.item}>
    <div className="flex flex-col">
      <span className={styles.itemLabel}>{label}</span>
      {date && <span className="text-[10px] text-slate-500 font-bold">{date}</span>}
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-xs font-bold text-white">{value}</span>}
      <span className={clsx(styles.status, styles[status])}>{status}</span>
    </div>
  </div>
);

const CalendarEvent = ({ month, day, event, type }: any) => {
  const typeColors: any = {
    tax: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    labor: 'border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-400',
    misa: 'border-blue-500/20 bg-blue-500/5 text-blue-400'
  };

  return (
    <div className={clsx("p-4 rounded-2xl border flex items-center gap-4", typeColors[type])}>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black">{month}</span>
        <span className="text-2xl font-black">{day}</span>
      </div>
      <div className="h-8 w-[1px] bg-white/10" />
      <span className="text-sm font-bold text-white/80">{event}</span>
    </div>
  );
};
