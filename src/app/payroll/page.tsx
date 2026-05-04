'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Banknote, 
  Plus, 
  Download, 
  Calendar, 
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import styles from './payroll.module.css';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import { PayrollRecord } from '@/types';

export default function PayrollPage() {
  const { payroll, employees, addPayrollRecord, updatePayrollRecord, isLoaded } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentPayroll = payroll.filter(p => p.month === selectedMonth && p.year === selectedYear);

  const generatePayroll = async () => {
    if (currentPayroll.length > 0) {
      if (!confirm('Payroll already exists for this month. Regenerate?')) return;
    }

    const activeEmployees = employees.filter(e => e.status === 'Active');
    
    for (const emp of activeEmployees) {
      // Basic GOSI Logic for Saudi (Simplified: 10% deduction)
      // For a real app, this would check nationality
      const gosiDeduction = emp.basicSalary * 0.1; 
      const netSalary = (emp.basicSalary + emp.housingAllowance + emp.transportAllowance + emp.otherAllowances) - gosiDeduction;

      await addPayrollRecord({
        employeeId: emp.id,
        month: selectedMonth,
        year: selectedYear,
        basicSalary: emp.basicSalary,
        housingAllowance: emp.housingAllowance,
        transportAllowance: emp.transportAllowance,
        otherAllowances: emp.otherAllowances,
        gosiDeduction,
        netSalary,
        status: 'Draft'
      });
    }
  };

  const exportSIF = () => {
    if (currentPayroll.length === 0) return;

    // WPS SIF Format (Simplified CSV for demo)
    const headers = ['Employee Name', 'Iqama/ID', 'IBAN', 'Basic', 'Housing', 'Other', 'Deductions', 'Net'];
    const rows = currentPayroll.map(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      return [
        emp?.name || 'Unknown',
        emp?.iqamaNo || '',
        emp?.iban || '',
        p.basicSalary,
        p.housingAllowance,
        p.transportAllowance + p.otherAllowances,
        p.gosiDeduction,
        p.netSalary
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WPS_SIF_${selectedYear}_${selectedMonth}.csv`;
    a.click();
  };

  const markAsPaid = async () => {
    for (const p of currentPayroll) {
      await updatePayrollRecord(p.id, { status: 'Paid', paymentDate: Date.now() });
    }
  };

  const totalPayroll = currentPayroll.reduce((sum, p) => sum + p.netSalary, 0);
  const totalGosi = currentPayroll.reduce((sum, p) => sum + p.gosiDeduction, 0);

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Payroll Management</h2>
          <p className={styles.subtitle}>WPS compliant salary processing and GOSI tracking.</p>
        </div>
        <div className={styles.actionArea}>
          <div className="flex gap-2 items-center glass-panel px-4 py-2 rounded-xl">
            <Calendar size={18} className="text-blue-400" />
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-white border-none focus:ring-0"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-white border-none focus:ring-0"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <button onClick={generatePayroll} className="glass-button px-6 py-2 flex items-center gap-2 bg-blue-600/20">
            <Plus size={18} />
            <span>Generate</span>
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={clsx('glass-panel', styles.statCard)}>
          <p className={styles.statLabel}>Total Net Pay</p>
          <p className={styles.statValue}>{formatCurrency(totalPayroll)}</p>
        </div>
        <div className={clsx('glass-panel', styles.statCard)}>
          <p className={styles.statLabel}>GOSI Liability</p>
          <p className={styles.statValue}>{formatCurrency(totalGosi)}</p>
        </div>
        <div className={clsx('glass-panel', styles.statCard)}>
          <p className={styles.statLabel}>WPS Status</p>
          <p className={clsx(styles.statValue, currentPayroll.some(p => p.status === 'Paid') ? 'text-emerald-400' : 'text-amber-400')}>
            {currentPayroll.length > 0 ? (currentPayroll.every(p => p.status === 'Paid') ? 'Fully Paid' : 'Pending Payment') : 'Not Generated'}
          </p>
        </div>
      </div>

      {currentPayroll.length > 0 && (
        <div className="flex justify-end gap-3 mb-6">
          <button onClick={exportSIF} className="glass-button px-4 py-2 flex items-center gap-2 text-emerald-400 border-emerald-500/30">
            <FileSpreadsheet size={18} />
            <span>Export SIF (WPS)</span>
          </button>
          <button onClick={markAsPaid} className="glass-button px-4 py-2 flex items-center gap-2 text-blue-400 border-blue-500/30">
            <CheckCircle2 size={18} />
            <span>Mark as Paid</span>
          </button>
        </div>
      )}
      <div className={clsx('glass-panel', styles.tableWrapper)}>
        <div className={styles.reportRowHeader}>
          <span className="flex-1">Employee</span>
          <span className="w-32 text-right">Basic</span>
          <span className="w-32 text-right">Allowances</span>
          <span className="w-32 text-right">GOSI (10%)</span>
          <span className="w-32 text-right">Net Salary</span>
          <span className="w-24 text-right">Status</span>
        </div>
        
        <div className={styles.reportSection}>
          {!isLoaded ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : currentPayroll.length === 0 ? (
            <div className={styles.emptyState}>
              <div className="flex flex-col items-center gap-4">
                <AlertCircle size={48} className="text-white/10" />
                <p>No payroll data for {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
                <button onClick={generatePayroll} className="glass-button px-6 py-2">Initialize Now</button>
              </div>
            </div>
          ) : (
            currentPayroll.map((p) => {
              const emp = employees.find(e => e.id === p.employeeId);
              return (
                <div key={p.id} className={styles.reportRow}>
                  <span className="flex-1">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{emp?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-muted">{emp?.jobTitle}</span>
                    </div>
                  </span>
                  <span className="w-32 text-right font-mono">{formatCurrency(p.basicSalary)}</span>
                  <span className="w-32 text-right font-mono">{formatCurrency(p.housingAllowance + p.transportAllowance + p.otherAllowances)}</span>
                  <span className="w-32 text-right font-mono text-rose-400/80">-{formatCurrency(p.gosiDeduction)}</span>
                  <span className="w-32 text-right font-mono font-medium text-emerald-400">{formatCurrency(p.netSalary)}</span>
                  <span className="w-24 text-right flex justify-end">
                    <span className={clsx(styles.status, styles[p.status])}>
                      {p.status}
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
