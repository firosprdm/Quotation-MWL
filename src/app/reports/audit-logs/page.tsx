'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Shield, Clock, User, Activity } from 'lucide-react';
import styles from './reports.module.css';
import { clsx } from 'clsx';

export default function AuditLogsPage() {
  const { isLoaded } = useApp();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/v1/erpnext/logs')
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="fade-in p-8">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-blue-400" size={32} />
          <h2 className="premium-title !mb-0">System Audit Logs</h2>
        </div>
        <p className="premium-subtitle">Complete traceability of all data mutations and system events.</p>
      </header>

      <div className="glass-panel overflow-hidden rounded-[24px] border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted animate-pulse">Retrieving audit chain...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted">No logs recorded yet.</td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[12px]">
                        <Clock size={14} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <User size={12} />
                        </div>
                        {log.user}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-blue-400 uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm italic">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
