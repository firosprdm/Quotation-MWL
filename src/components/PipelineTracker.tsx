'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { clsx } from 'clsx';
import { 
  X,
  AlertCircle,
  Calendar,
  Activity,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/format';

export const PipelineTracker = () => {
  const { quotations, clients } = useApp();
  const [sortConfig, setSortConfig] = useState<{ 
    key: 'date' | 'number' | 'total' | 'status' | 'salesStatus' | 'workStatus' | 'paymentStatus', 
    direction: 'asc' | 'desc' 
  }>({ key: 'date', direction: 'desc' });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeQuotations = React.useMemo(() => {
    // Include all, but ensure they are sorted meaningfully
    const items = [...quotations];
    
    items.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const direction = sortConfig.direction === 'asc' ? 1 : -1;

      if (sortConfig.key === 'total') {
        aValue = a.grandTotal || 0;
        bValue = b.grandTotal || 0;
      } else if (sortConfig.key === 'paymentStatus') {
        const rank = (q: any) => {
          const invDate = q.invoiceDate || q.date;
          const received = q.receivedAmount || 0;
          const total = q.grandTotal;
          const ps = (q.paymentStatus || '').toLowerCase();
          const isPaid = ps === 'done' || ps === 'paid' || received >= total - 0.01;
          const isPartial = !isPaid && received > 0;
          
          const ss = (q.salesStatus || '').toLowerCase();
          const hasPO = ss === 'po recieved' || ss === 'po received' || !!q.poNumber;
          const ws = (q.workStatus || '').toLowerCase();
          const isWorkDone = ws === 'work done' || ws === 'completed';

          if (q.status !== 'approved' || !hasPO || !isWorkDone) return -1; // Not at financial stage

          if (isPaid) return 4;
          if (isPartial) return 3;
          
          const daysDiff = Math.floor((Date.now() - invDate) / 86400000);
          if (daysDiff > 30) return 2; // Overdue
          return 1; // Pending
        };
        aValue = rank(a);
        bValue = rank(b);
      } else if (sortConfig.key === 'salesStatus') {
        const rank = (q: any) => {
          if (q.status !== 'approved') return -1;
          const ss = (q.salesStatus || '').toLowerCase();
          if (ss === 'po recieved' || ss === 'po received' || !!q.poNumber) return 2;
          return 1; // Awaiting PO
        };
        aValue = rank(a);
        bValue = rank(b);
      } else if (sortConfig.key === 'workStatus') {
        const rank = (q: any) => {
          const ss = (q.salesStatus || '').toLowerCase();
          const hasPO = ss === 'po recieved' || ss === 'po received' || !!q.poNumber;
          if (q.status !== 'approved' || !hasPO) return -1;

          const ws = (q.workStatus || '').toLowerCase();
          if (ws === 'work done' || ws === 'completed') return 3;
          if (ws.includes('going') || ws.includes('ongoing') || ws === 'in_progress') return 2;
          return 1; // Work Pending
        };
        aValue = rank(a);
        bValue = rank(b);
      } else if (sortConfig.key === 'status') {
        const rank = (q: any) => {
          const s = (q.status || '').toLowerCase();
          if (s === 'approved') return 4;
          if (s === 'sent') return 3;
          if (s === 'waiting') return 2;
          if (s === 'revised') return 1;
          if (s === 'rejected') return 0;
          return -1;
        };
        aValue = rank(a);
        bValue = rank(b);
      } else if (sortConfig.key === 'date') {
        aValue = a.date || 0;
        bValue = b.date || 0;
      } else if (sortConfig.key === 'number') {
        aValue = String(a.invoiceNumber || a.number || '');
        bValue = String(b.invoiceNumber || b.number || '');
      } else {
        aValue = String((a as any)[sortConfig.key] || '');
        bValue = String((b as any)[sortConfig.key] || '');
      }

      // Handle the "-" state (represented by -1) to always be at bottom
      if (aValue === -1 && bValue !== -1) return 1;
      if (bValue === -1 && aValue !== -1) return -1;

      if (sortConfig.key === 'number') {
        const aParts = aValue.split(/(\d+)/);
        const bParts = bValue.split(/(\d+)/);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aP = aParts[i] || '';
          const bP = bParts[i] || '';
          if (aP === bP) continue;
          const aN = parseInt(aP, 10);
          const bN = parseInt(bP, 10);
          if (!isNaN(aN) && !isNaN(bN)) return (aN - bN) * direction;
          return aP.localeCompare(bP) * direction;
        }
        return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' }) * direction;
      }

      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });

    return items; // Show more or handle pagination if needed
  }, [quotations, sortConfig]);

  const toggleSort = (key: 'date' | 'number' | 'total' | 'status' | 'salesStatus' | 'workStatus' | 'paymentStatus') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const selectedQuotation = quotations.find(q => q.id === selectedProjectId);

  if (activeQuotations.length === 0) return null;

  const SortArrow = ({ field }: { field: string }) => {
    if (sortConfig.key !== field) return <span className="opacity-20 ml-1">⇅</span>;
    return <span className="ml-1 text-white">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <motion.section 
      className="w-full mb-12 px-8 mx-auto" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="premium-title">Live Project Pipeline</h3>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl">
        <div className="flex flex-col">
          <div className="hidden lg:grid grid-cols-[1.1fr_0.9fr_2fr_1.2fr_1.2fr_5.5fr_1.1fr] gap-4 px-6 min-h-[1.0cm] h-[1.0cm] border-b border-white/5 items-center bg-white/[0.02] text-xs">
            <div className="premium-label cursor-pointer hover:text-white transition-colors truncate" onClick={() => toggleSort('number')}>
              ID <SortArrow field="number" />
            </div>
            <div className="premium-label cursor-pointer hover:text-white transition-colors truncate" onClick={() => toggleSort('date')}>
              Date <SortArrow field="date" />
            </div>
            <div className="premium-label truncate">Client</div>
            <div className="premium-label truncate">PO Number</div>
            <div className="premium-label truncate">Ticket No</div>
            
            <div className="grid grid-cols-4 gap-4 text-center h-full items-center">
              <div className="premium-label !text-blue-400 cursor-pointer hover:brightness-125 transition-all truncate" onClick={() => toggleSort('status')}>
                Quotation <SortArrow field="status" />
              </div>
              <div className="premium-label !text-amber-400 cursor-pointer hover:brightness-125 transition-all truncate" onClick={() => toggleSort('salesStatus')}>
                PO Status <SortArrow field="salesStatus" />
              </div>
              <div className="premium-label !text-fuchsia-400 cursor-pointer hover:brightness-125 transition-all truncate" onClick={() => toggleSort('workStatus')}>
                Execution <SortArrow field="workStatus" />
              </div>
              <div className="premium-label !text-emerald-400 cursor-pointer hover:brightness-125 transition-all truncate" onClick={() => toggleSort('paymentStatus')}>
                Financial <SortArrow field="paymentStatus" />
              </div>
            </div>

            <div className="premium-label text-right cursor-pointer hover:text-white transition-colors truncate" onClick={() => toggleSort('total')}>
              Amount <SortArrow field="total" />
            </div>
          </div>

          <div className="flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar">
            {activeQuotations.map((q, idx) => {
              const client = clients.find(c => c.id === q.clientId);
              
              const ss = (q.salesStatus || '').toLowerCase();
              const hasPO = ss === 'po recieved' || ss === 'po received' || !!q.poNumber;

              const ws = (q.workStatus || '').toLowerCase();
              const isWorkDone = ws === 'work done' || ws === 'completed';
              const isWorkOngoing = ws.includes('going') || ws.includes('ongoing') || ws === 'in_progress';

              const invDate = q.invoiceDate || q.date;
              const received = q.receivedAmount || 0;
              const total = q.grandTotal;
              const ps = (q.paymentStatus || '').toLowerCase();
              const isPaid = ps === 'done' || ps === 'paid' || received >= total - 0.01;
              const isPartial = !isPaid && received > 0;
              const daysDiffFin = Math.floor((Date.now() - invDate) / 86400000);
              const isOverdue = !isPaid && !isPartial && daysDiffFin > 30;

              const displayId = (() => {
                if (!hasPO) {
                  return q.number + (q.revision > 0 ? `-R${q.revision}` : '');
                }
                const invYear = new Date(q.invoiceDate || q.approvalDate || q.date).getFullYear();
                const rawNum = String(q.number || '0').replace(/[^0-9]/g, '');
                const formattedNum = rawNum.slice(-4).padStart(4, '0');
                return `INV-${invYear}-${formattedNum}`;
              })();

              return (
                <div 
                  key={q.id} 
                  className={clsx(
                    "grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr_2fr_1.2fr_1.2fr_5.5fr_1.1fr] gap-4 items-center px-6 py-3 border-b border-white/[0.05] hover:bg-white/[0.04] transition-all duration-200 group/row cursor-pointer text-sm",
                    idx === activeQuotations.length - 1 && "border-b-0"
                  )}
                  onClick={() => setSelectedProjectId(q.id)}
                >
                  <div className="font-medium text-white/90 tracking-tight truncate">
                    {displayId}
                  </div>
                  <div className="text-white/70 text-xs hidden lg:block truncate">
                    {new Date(q.approvalDate || q.date).toLocaleDateString('en-GB')}
                  </div>
                  <div className="text-white font-medium truncate">
                    <span className="lg:hidden text-slate-500 font-medium mr-2">
                      {displayId}
                    </span>
                    {client?.name || 'Generic Client'}
                  </div>
                  <div className="hidden lg:block truncate">
                    {q.poNumber ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400/90">
                        {q.poNumber}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </div>
                  <div className="hidden lg:block truncate">
                    {q.ticketNumber ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400">
                        {q.ticketNumber}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 h-[1.0cm] items-center">
                    <div className={clsx(
                      "flex items-center justify-center text-[10px] font-bold uppercase tracking-wider h-full border rounded-lg px-1 text-center truncate",
                      q.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                      q.status === 'rejected' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      q.status === 'revised'  ? "bg-purple-500/10 text-purple-400 border-rose-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {(() => {
                        const days = Math.floor((Date.now() - q.date) / 86400000);
                        const label = q.status === 'approved' ? 'APPROVED' : 
                                      q.status === 'rejected' ? 'REJECTED' : 
                                      q.status === 'revised'  ? 'REVISED' :
                                      q.status === 'waiting'  ? 'WAITING' : 'SENT';
                        return (q.status === 'approved' || q.status === 'rejected') ? label : `${label} (${days}D)`;
                      })()}
                    </div>

                    <div className={clsx(
                      "flex items-center justify-center text-[10px] font-bold uppercase tracking-wider h-full border rounded-lg px-1 text-center truncate",
                      q.status !== 'approved' ? "bg-white/[0.02] text-slate-600 border-white/5" :
                      hasPO ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {q.status !== 'approved' ? '-' : 
                       hasPO ? 'PO RECEIVED' : 
                       `WAIT PO (${Math.floor((Date.now() - (q.approvalDate || q.date)) / 86400000)}D)`}
                    </div>

                    <div className={clsx(
                      "flex items-center justify-center text-[10px] font-bold uppercase tracking-wider h-full border rounded-lg px-1 text-center truncate",
                      q.status !== 'approved' ? "bg-white/[0.02] text-slate-600 border-white/5" :
                      isWorkDone ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      isWorkOngoing ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {(() => {
                        if (q.status !== 'approved') return '-';
                        if (isWorkDone) return 'COMPLETED';
                        
                        const execStartDate = q.poDate || q.approvalDate || q.date;
                        const execDays = Math.floor((Date.now() - execStartDate) / 86400000);
                        
                        return isWorkOngoing ? `ON GOING (${execDays}D)` : `PENDING (${execDays}D)`;
                      })()}
                    </div>

                    <div className={clsx(
                      "flex items-center justify-center text-[10px] font-bold uppercase tracking-wider h-full border rounded-lg px-1 text-center truncate",
                      !hasPO || !isWorkDone || q.status !== 'approved' ? "bg-white/[0.02] text-slate-600 border-white/5" :
                      isPaid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      isPartial ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      isOverdue ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {!hasPO || !isWorkDone || q.status !== 'approved' ? '-' :
                       isPaid ? 'RECEIVED' :
                       isPartial ? 'PARTIAL' :
                       isOverdue ? `OVERDUE (${daysDiffFin}D)` :
                       `PENDING (${daysDiffFin}D)`}
                    </div>
                  </div>

                  <div className="text-right font-medium text-emerald-400 tabular-nums truncate">
                    {formatCurrency(q.grandTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedQuotation && (
          <ProjectAnalyticsModal 
            quotation={selectedQuotation} 
            client={clients.find(c => c.id === selectedQuotation.clientId)}
            onClose={() => setSelectedProjectId(null)} 
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
};

const getProjectFlags = (q: any) => {
  const s = (q.status || '').toLowerCase();
  const ws = (q.workStatus || '').toLowerCase();
  const ps = (q.paymentStatus || '').toLowerCase();
  const ss = (q.salesStatus || '').toLowerCase();

  const isApproved = s === 'approved';
  const isPORecieved = ss === 'po recieved' || ss === 'po received' || !!q.poNumber;
  const isSent = s === 'sent' || s === 'waiting' || s === 'revised' || isApproved;
  const isWaiting = s === 'waiting' || isApproved;
  const isPOWaiting = isApproved;
  const isWorkDone = ws.includes('done') || ws === 'completed';
  const isWorkOngoing = ws.includes('going') || ws.includes('ongoing') || ws === 'in_progress' || isWorkDone;
  const isWorkPending = (isPORecieved && (ws.includes('pending') || !ws)) || isWorkOngoing;
  const isPaid = ps.includes('done') || ps.includes('paid') || (q.receivedAmount >= q.grandTotal - 0.01);
  const isInvoiced = !!(q.invoiceNumber || q.uuid || q.invoiceDate) || isPaid;
  const isWaitingPayment = (isInvoiced && (ps.includes('pending') || ps.includes('wait'))) || isPaid;

  return { isSent, isWaiting, isApproved, isPOWaiting, isPORecieved, isWorkPending, isWorkOngoing, isWorkDone, isInvoiced, isWaitingPayment, isPaid };
};

const ProjectAnalyticsModal = ({ quotation, client, onClose }: { quotation: any, client: any, onClose: () => void }) => {
  const flags = getProjectFlags(quotation);
  const getDaysBetween = (start: number, end: number = Date.now()) => Math.floor((end - start) / (1000 * 60 * 60 * 24));
  
  const daysInQuotation = getDaysBetween(quotation.date, flags.isApproved ? quotation.date : Date.now());
  const daysInPO = flags.isApproved ? getDaysBetween(quotation.date, flags.isPORecieved ? Date.now() : Date.now()) : 0;
  const daysInWork = flags.isPORecieved ? getDaysBetween(quotation.date, flags.isWorkDone ? (quotation.invoiceDate || Date.now()) : Date.now()) : 0;
  const daysInPayment = flags.isInvoiced && quotation.invoiceDate ? getDaysBetween(quotation.invoiceDate, flags.isPaid ? Date.now() : Date.now()) : 0;

  const bottleneck = Math.max(daysInQuotation, daysInPO, daysInWork, daysInPayment);
  const bottleneckPhase = daysInQuotation === bottleneck ? 'Quotation' : daysInPO === bottleneck ? 'PO Reception' : daysInWork === bottleneck ? 'Execution' : 'Payment Recovery';

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="glass-panel w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>

          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Activity size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-normal text-white tracking-tighter">
                {quotation.invoiceNumber || quotation.number}
              </h2>
              <p className="text-slate-400 text-lg font-medium">{client?.name || 'Generic Client'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10">
              <h4 className="text-[13px] uppercase font-normal tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-400" /> Current Bottleneck
              </h4>
              <p className="text-2xl font-normal text-white mb-1">{bottleneckPhase}</p>
              <p className="text-sm text-amber-400 font-medium">{bottleneck} Days Pending</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10">
              <h4 className="text-[13px] uppercase font-normal tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                <Calendar size={14} className="text-emerald-400" /> Financial Volume
              </h4>
              <p className="text-2xl font-normal text-emerald-400 mb-1">{formatCurrency(quotation.grandTotal)}</p>
              <p className="text-sm text-slate-500 font-medium">Total Project Value</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[13px] uppercase font-normal tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <History size={14} /> Lifecycle Analysis
            </h4>
            <AgeingBar label="Quotation Phase" days={daysInQuotation} color="blue" isBottleneck={bottleneckPhase === 'Quotation'} />
            <AgeingBar label="PO Processing" days={daysInPO} color="amber" isBottleneck={bottleneckPhase === 'PO Reception'} />
            <AgeingBar label="Implementation" days={daysInWork} color="fuchsia" isBottleneck={bottleneckPhase === 'Execution'} />
            <AgeingBar label="Collection" days={daysInPayment} color="emerald" isBottleneck={bottleneckPhase === 'Payment Recovery'} />
          </div>

          <div className="mt-12 flex gap-4">
             <StatusCard label="General" value={quotation.status} />
             <StatusCard label="Execution" value={quotation.workStatus || 'PENDING'} />
             <StatusCard label="Financial" value={quotation.paymentStatus || 'PENDING'} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const StatusCard = ({ label, value }: { label: string, value: string }) => (
  <div className="flex-1 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center shadow-inner text-white">
    <p className="text-[12px] uppercase font-normal text-slate-500 mb-1">{label}</p>
    <p className="text-sm font-normal tracking-widest">{value.toUpperCase()}</p>
  </div>
);

const AgeingBar = ({ label, days, color, isBottleneck }: { label: string, days: number, color: string, isBottleneck: boolean }) => {
  const colorMap: any = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    fuchsia: 'bg-fuchsia-500',
    emerald: 'bg-emerald-500'
  };

  return (
    <div className={clsx(
      "p-5 rounded-2xl border transition-all duration-300",
      isBottleneck ? "bg-white/[0.08] border-white/25 shadow-2xl" : "bg-white/[0.02] border-white/5"
    )}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-normal text-white">{label}</span>
        <span className={clsx("text-sm font-normal px-3 py-1 rounded-full", isBottleneck ? "bg-rose-500 text-white" : "text-slate-500")}>
          {days} Days
        </span>
      </div>
      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
        <motion.div 
          className={clsx("h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]", colorMap[color])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
