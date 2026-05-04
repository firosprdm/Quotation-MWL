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
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ComplianceAuditPDF } from '@/components/ComplianceAuditPDF';

export default function MisaPortal() {
  const { quotations = [], payroll = [], employees = [], settings } = useApp();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalRevenue = quotations.filter(q => !!q.invoiceNumber).reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const totalEmployees = employees?.length || 0;
  
  // Dynamic WPS Calculation
  const wpsComplianceRatio = payroll.length > 0 
    ? Math.round((payroll.filter(p => p.status === 'Paid').length / payroll.length) * 100)
    : 100; // Default to 100 if no payroll generated yet

  // Saudization Heuristic (Starting with 1 is Saudi, 2 is Expat)
  const saudiEmployees = employees.filter(e => e.iqamaNo.startsWith('1')).length;
  const saudizationRatio = totalEmployees > 0 ? (saudiEmployees / totalEmployees) * 100 : 0;
  
  let saudizationLevel = 'Red';
  if (saudizationRatio >= 30) saudizationLevel = 'Platinum';
  else if (saudizationRatio >= 20) saudizationLevel = 'Green High';
  else if (saudizationRatio >= 10) saudizationLevel = 'Green Low';

  return (
    <div className={clsx("fade-in", styles.container)}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>MISA Compliance Portal</h2>
          <p className={styles.subtitle}>Unified dashboard for Saudi Arabian regulatory reporting.</p>
        </div>
        <div className="flex gap-3">
          {isMounted && (
            <PDFDownloadLink
              document={
                <ComplianceAuditPDF 
                  data={{
                    totalRevenue,
                    totalEmployees,
                    wpsRatio: wpsComplianceRatio,
                    saudizationLevel,
                    date: new Date().toLocaleDateString(),
                    companyName: settings.name
                  }} 
                />
              }
              fileName={`Compliance_Audit_${new Date().toISOString().split('T')[0]}.pdf`}
            >
              {({ loading }) => (
                <button className="glass-button px-6 py-2 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <ShieldCheck size={18} className={clsx(loading ? styles.iconSpin : styles.iconPulse)} />
                  <span>{loading ? 'Preparing Audit...' : 'Generate Compliance Audit'}</span>
                </button>
              )}
            </PDFDownloadLink>
          )}
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
            <p className={styles.subtitle}>Total Revenue (Invoiced)</p>
            <p className={styles.kpi}>{formatCurrency(totalRevenue)}</p>
          </div>
          <div className={styles.complianceList}>
            <ComplianceItem label="MISA Quarterly Financials" status={totalRevenue > 0 ? "Active" : "Warning"} />
            <ComplianceItem label="Investment License" status="Active" date="Valid until 2026" />
            <ComplianceItem label="MISA Shareholder List" status="Active" />
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
            <p className={styles.subtitle}>VAT Liability (Estimated)</p>
            <p className={styles.kpi}>{formatCurrency(totalRevenue * 0.15)}</p>
          </div>
          <div className={styles.complianceList}>
            <ComplianceItem label="E-Invoicing Phase 2" status="Active" />
            <ComplianceItem label="VAT Return Filing" status="Active" />
            <ComplianceItem label="Zakat & Tax Certificate" status="Active" />
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
          <div className="flex flex-col gap-3">
            <div>
              <p className={styles.subtitle}>Saudization Tracking</p>
              <div className="h-2 w-full bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${saudizationRatio}%` }}
                />
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${100 - saudizationRatio}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-bold text-emerald-400">{saudizationRatio.toFixed(0)}% Saudi</span>
                <span className="text-[10px] font-bold text-amber-400">{(100 - saudizationRatio).toFixed(0)}% Expat</span>
              </div>
            </div>
            <div>
              <p className={styles.subtitle}>Employees Registered</p>
              <p className={styles.kpi}>{totalEmployees}</p>
            </div>
          </div>
          <div className={styles.complianceList}>
            <ComplianceItem label="WPS Compliance Ratio" status={wpsComplianceRatio >= 90 ? "Active" : "Warning"} value={`${wpsComplianceRatio}%`} />
            <ComplianceItem label="GOSI Contributions" status="Active" />
            <ComplianceItem label="Saudization Level" status={saudizationLevel.includes('Green') || saudizationLevel === 'Platinum' ? "Active" : "Warning"} value={saudizationLevel} />
          </div>
        </div>
      </div>

      <div className={clsx('glass-panel', styles.calendarSection)}>
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
              <History size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Compliance Timeline {new Date().getFullYear()}</h3>
              <p className="text-sm text-slate-400 font-medium">Critical regulatory deadlines for the current fiscal period.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <CalendarEvent month={new Date().toLocaleString('default', { month: 'short' }).toUpperCase()} day="15" event="VAT Monthly Return" type="tax" desc="ZATCA monthly VAT declaration due." />
          <CalendarEvent month={new Date().toLocaleString('default', { month: 'short' }).toUpperCase()} day="28" event="WPS Salary Submission" type="labor" desc="Ministry of Labor WPS portal upload." />
          <CalendarEvent month={new Date().toLocaleString('default', { month: 'short' }).toUpperCase()} day="30" event="MISA Quarterly Upload" type="misa" desc="MISA portal financial upload." />
          <CalendarEvent month={new Date().toLocaleString('default', { month: 'short' }).toUpperCase()} day="01" event="GOSI Monthly Billing" type="labor" desc="Social insurance payment settlement." />
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

const CalendarEvent = ({ month, day, event, type, desc }: any) => {
  const typeColors: any = {
    tax: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    labor: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400',
    misa: 'border-blue-500/30 bg-blue-500/10 text-blue-400'
  };

  return (
    <div className={clsx(styles.eventCard, typeColors[type])}>
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-[9px] font-black opacity-60 tracking-widest">{month}</span>
        <span className="text-3xl font-black">{day}</span>
      </div>
      <div className="h-10 w-[1px] bg-white/10" />
      <div className="flex flex-col">
        <span className="text-base font-black text-white leading-tight">{event}</span>
        <span className="text-[10px] text-white/40 font-medium mt-1">{desc}</span>
      </div>
    </div>
  );
};
