'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';

export function VatAuditReport({ start, end }: { start: number, end: number }) {
  const { journalEntries, accounts, clients } = useApp();

  const auditLines = React.useMemo(() => {
    const lines: any[] = [];
    journalEntries.forEach(entry => {
      if (entry.date >= start && entry.date <= end) {
        const vatLine = entry.lines.find(l => {
          const acc = accounts.find(a => a.id === l.accountId);
          return acc?.code === '2200' || acc?.code === '1500';
        });

        if (vatLine) {
          const acc = accounts.find(a => a.id === vatLine.accountId);
          const type = acc?.code === '2200' ? 'SALES' : 'PURCHASE';
          const totalLine = entry.lines.find(l => {
             const acc = accounts.find(a => a.id === l.accountId);
             return acc?.code === '1200' || acc?.code === '2100' || acc?.type === 'Expense';
          });
          const baseAmount = (vatLine.credit || vatLine.debit) / 0.15;

          lines.push({
            date: entry.date,
            description: entry.description,
            reference: entry.reference,
            type,
            baseAmount,
            vatAmount: vatLine.credit || vatLine.debit
          });
        }
      }
    });
    return lines.sort((a, b) => b.date - a.date);
  }, [journalEntries, accounts, start, end]);

  return (
    <div className="mt-12">
      <h3 className="text-sm font-bold text-white/40 uppercase tracking-[0.3em] mb-6">VAT Transaction Audit Trail</h3>
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Description / Reference</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-center">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Base Amount</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">VAT (15%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {auditLines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-sm text-white/60">{new Date(line.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-white/90">{line.description}</span>
                    <span className="text-[11px] text-muted font-mono">{line.reference}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded border",
                    line.type === 'SALES' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {line.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm text-white/70">{formatCurrency(line.baseAmount)}</td>
                <td className="px-6 py-4 text-right font-mono text-sm text-white">{formatCurrency(line.vatAmount)}</td>
              </tr>
            ))}
            {auditLines.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted italic">No VAT transactions found for this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { clsx } from 'clsx';
