'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { clsx } from 'clsx';
import { 
  CheckCircle, 
  Clock, 
  FileCheck, 
  Receipt, 
  DollarSign, 
  Send, 
  Hourglass, 
  Briefcase,
  PlayCircle,
  CheckSquare,
  FileSearch,
  CheckCircle2,
  X,
  AlertCircle,
  Calendar,
  Activity,
  History,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/format';

export const PipelineTracker = () => {
  const { quotations, clients } = useApp();
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'number' | 'total', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeQuotations = React.useMemo(() => {
    const items = [...quotations].filter(q => q.status !== 'rejected');
    
    items.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'total') {
        aValue = a.grandTotal;
        bValue = b.grandTotal;
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items.slice(0, 15);
  }, [quotations, sortConfig]);

  const toggleSort = (key: 'date' | 'number' | 'total') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const selectedQuotation = quotations.find(q => q.id === selectedProjectId);

  if (activeQuotations.length === 0) return null;

  return (
    <motion.section 
      className="w-full mb-12 px-[5cm]" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Section Header - Synced with Recent Activity */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[1.25rem] font-semibold text-white">Live Project Pipeline</h3>
        </div>
      </div>

      {/* Main Container - The "Box" */}
      <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl">
        <div className="flex flex-col">
          {/* Header Row - Aligned with Dashboard Tables */}
          <div className="hidden lg:grid grid-cols-12 gap-12 px-16 min-h-[1.2cm] h-[1.2cm] text-[0.75rem] uppercase font-bold tracking-widest text-slate-500 border-b border-white/5 items-center bg-white/[0.02]">
            <div className="col-span-1 cursor-pointer hover:text-white transition-colors pl-[10mm]" onClick={() => toggleSort('number')}>
              Number {sortConfig.key === 'number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </div>
            <div className="col-span-2 cursor-pointer hover:text-white transition-colors pr-6" onClick={() => toggleSort('date')}>
              Client {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↓' : '↑')}
            </div>
            
            <div className="col-span-7 grid grid-cols-4 gap-12 text-center">
              <div className="text-blue-400 font-black">Quotation</div>
              <div className="text-amber-400 font-black">PO Status</div>
              <div className="text-fuchsia-400 font-black">Execution</div>
              <div className="text-emerald-400 font-black">Financial</div>
            </div>

            <div className="col-span-2 text-right cursor-pointer hover:text-white transition-colors pr-[10mm]" onClick={() => toggleSort('total')}>
              Amount {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </div>
          </div>

          <div className="flex flex-col">
            {activeQuotations.map((q, idx) => {
              const client = clients.find(c => c.id === q.clientId);
              const { isSent, isWaiting, isApproved, isPOWaiting, isPORecieved, isWorkPending, isWorkOngoing, isWorkDone, isInvoiced, isWaitingPayment, isPaid } = getProjectFlags(q);

              return (
                <div 
                  key={q.id} 
                  className={clsx(
                    "grid grid-cols-1 lg:grid-cols-12 gap-12 items-center px-16 min-h-[1.2cm] h-[1.2cm] border-b border-white/[0.05] hover:bg-white/[0.04] transition-all duration-200 group/row cursor-pointer",
                    idx === activeQuotations.length - 1 && "border-b-0"
                  )}
                  onClick={() => setSelectedProjectId(q.id)}
                >
                  
                  <div className="col-span-1 font-semibold text-white text-[0.875rem] lg:block hidden tracking-tight pl-[10mm]">
                    {q.invoiceNumber || q.number}
                  </div>
                  <div className="col-span-2 text-slate-300 text-[0.875rem] font-medium truncate pr-6">
                    <span className="lg:hidden text-slate-500 font-black mr-2">
                      {q.invoiceNumber || q.number}
                    </span>
                    {client?.name || 'Generic Client'}
                  </div>

                  {/* High-Visibility Modular Phase Tracker - Grid Synchronized for Perfect Alignment */}
                  <div className="col-span-7 grid grid-cols-4 gap-12 h-full py-1">
                    
                    {/* Zone 1: Quotation */}
                    <div className="flex items-center justify-center gap-2 h-full bg-blue-500/[0.03] border border-blue-500/10 rounded-lg px-2">
                      <BigStep icon={<Send size={14}/>} active={isSent} color="amber" />
                      <TightConnector active={isWaiting} color="blue" />
                      <BigStep icon={<Hourglass size={14}/>} active={isWaiting} color="blue" />
                      <TightConnector active={isApproved} color="emerald" />
                      <BigStep icon={<CheckCircle size={14}/>} active={isApproved} color="emerald" />
                    </div>

                    {/* Zone 2: PO Status */}
                    <div className="flex items-center justify-center gap-2 h-full bg-amber-500/[0.03] border border-amber-500/10 rounded-lg px-2">
                      <BigStep icon={<FileSearch size={14}/>} active={isPOWaiting} color="amber" />
                      <TightConnector active={isPORecieved} color="emerald" />
                      <BigStep icon={<CheckCircle2 size={14}/>} active={isPORecieved} color="emerald" />
                    </div>

                    {/* Zone 3: Execution */}
                    <div className="flex items-center justify-center gap-2 h-full bg-fuchsia-500/[0.03] border border-fuchsia-500/10 rounded-lg px-2">
                      <BigStep icon={<Briefcase size={14}/>} active={isWorkPending} color="amber" />
                      <TightConnector active={isWorkOngoing} color="blue" />
                      <BigStep icon={<PlayCircle size={14}/>} active={isWorkOngoing} color="blue" />
                      <TightConnector active={isWorkDone} color="emerald" />
                      <BigStep icon={<CheckSquare size={14}/>} active={isWorkDone} color="emerald" />
                    </div>

                    {/* Zone 4: Financial */}
                    <div className="flex items-center justify-center gap-2 h-full bg-emerald-500/[0.03] border border-emerald-500/10 rounded-lg px-2">
                      <BigStep icon={<Receipt size={14}/>} active={isInvoiced} color="amber" />
                      <TightConnector active={isWaitingPayment} color="blue" />
                      <BigStep icon={<Clock size={14}/>} active={isWaitingPayment} color="blue" />
                      <TightConnector active={isPaid} color="emerald" />
                      <BigStep icon={<DollarSign size={14}/>} active={isPaid} color="emerald" />
                    </div>
                  </div>

                  <div className="col-span-2 text-right font-bold text-emerald-400 text-[0.875rem] tabular-nums pr-[10mm]">
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

  const isApproved = s === 'approved' || ss.includes('recieved') || ss.includes('received') || !!q.poNumber;
  const isSent = s === 'sent' || s === 'waiting' || s === 'revised' || isApproved;
  const isWaiting = s === 'waiting' || isApproved;
  const isPORecieved = ss.includes('recieved') || ss.includes('received') || !!q.poNumber;
  const isPOWaiting = isApproved || isPORecieved;
  const isWorkDone = ws.includes('done');
  const isWorkOngoing = ws.includes('going') || ws.includes('ongoing') || isWorkDone;
  const isWorkPending = (isPORecieved && (ws.includes('pending') || !ws)) || isWorkOngoing;
  const isPaid = ps.includes('done') || ps.includes('paid');
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
              <h2 className="text-4xl font-black text-white tracking-tighter">
                {quotation.invoiceNumber || quotation.number}
              </h2>
              <p className="text-slate-400 text-lg font-bold">{client?.name || 'Generic Client'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10">
              <h4 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-400" /> Current Bottleneck
              </h4>
              <p className="text-2xl font-black text-white mb-1">{bottleneckPhase}</p>
              <p className="text-sm text-amber-400 font-bold">{bottleneck} Days Pending</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10">
              <h4 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                <Calendar size={14} className="text-emerald-400" /> Financial Volume
              </h4>
              <p className="text-2xl font-black text-emerald-400 mb-1">{formatCurrency(quotation.grandTotal)}</p>
              <p className="text-sm text-slate-500 font-bold">Total Project Value</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-500 flex items-center gap-2">
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
  <div className="flex-1 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center shadow-inner">
    <p className="text-[10px] uppercase font-black text-slate-500 mb-1">{label}</p>
    <p className="text-xs font-black text-white tracking-widest">{value.toUpperCase()}</p>
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
        <span className="text-sm font-black text-white">{label}</span>
        <span className={clsx("text-xs font-black px-3 py-1 rounded-full", isBottleneck ? "bg-rose-500 text-white" : "text-slate-500")}>
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

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <span className="flex items-center gap-2.5">
    <span className={clsx("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]", color)}></span>
    {label}
  </span>
);

const BigStep = ({ icon, active, color }: { icon: React.ReactNode, active: boolean, color: string }) => {
  const colorMap: any = {
    amber: active ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white/[0.03] text-slate-700 border-white/5',
    blue: active ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/[0.03] text-slate-700 border-white/5',
    emerald: active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/[0.03] text-slate-700 border-white/5',
  };

  return (
    <div className="flex flex-col items-center group/step relative">
      <div className={clsx(
        "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 scale-100 group-hover/step:scale-110",
        colorMap[color]
      )}>
        {icon}
      </div>
    </div>
  );
};

const TightConnector = ({ active, color }: { active: boolean, color: string }) => {
  const colorMap: any = {
    amber: active ? 'bg-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-white/5',
    blue: active ? 'bg-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-white/5',
    emerald: active ? 'bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-white/5',
  };

  return <div className={clsx("w-3 h-[2px] rounded-full transition-all duration-700", colorMap[color])} />;
};
