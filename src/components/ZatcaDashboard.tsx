'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Activity, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  History,
  Lock,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface ZatcaSettings {
  status: string;
  company: string;
  mode: string;
  last_icv: number;
  onboarded_date?: string;
  certificate_info?: string;
  public_key?: boolean;
}

interface ZatcaLog {
  name: string;
  invoice: string;
  status: string;
  timestamp: number;
  xml_content: string;
  api_response: string;
}

export function ZatcaDashboard() {
  const [settings, setSettings] = useState<ZatcaSettings | null>(null);
  const [logs, setLogs] = useState<ZatcaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [otp, setOtp] = useState('');
  const [working, setWorking] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ZatcaLog | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        fetch('/api/v1/zatca/settings'),
        fetch('/api/v1/zatca/logs')
      ]);
      
      let sData = { error: 'Failed to fetch settings' };
      let lData = [];
      
      if (sRes.ok) sData = await sRes.json();
      if (lRes.ok) lData = await lRes.json();
      
      setSettings(sData.error ? null : sData as any);
      setLogs(Array.isArray(lData) ? lData : []);
    } catch (e) {
      console.error('Failed to fetch ZATCA data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'generate_keys' | 'onboard') => {
    setWorking(true);
    try {
      if (action === 'onboard') {
        await fetch('/api/v1/zatca/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp })
        });
      }

      const res = await fetch('/api/v1/zatca/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'generate_keys') setOnboardingStep(1);
        await fetchData();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorking(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statusColor = settings?.status === 'Onboarded' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="space-y-10 fade-in max-w-[1600px] mx-auto pb-20">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Lock className="text-white" size={28} />
          </div>
          <div>
            <h2 className="premium-title !mb-0">ZATCA Compliance</h2>
            <p className="premium-subtitle !text-[13px] opacity-60">Phase 2 (Integration) Onboarding & Audit Logs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass-panel px-5 py-2.5 flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor} bg-current animate-pulse shadow-[0_0_12px_currentColor]`} />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">System Link: <span className="text-white">Active</span></span>
          </div>
          <button 
            onClick={fetchData} 
            className="glass-button w-12 h-12 rounded-2xl hover:bg-white/10"
            disabled={working}
          >
            <RefreshCw size={20} className={working ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Getting Started Horizontal Wizard */}
      <section className="glass-panel p-8 bg-white/[0.01]">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-8 px-2">Compliance Onboarding Journey</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            { label: 'Business Profile', desc: 'Company Details', icon: Users },
            { label: 'CSR & Key Generation', desc: 'Crypto Credentials', icon: Key },
            { label: 'ZATCA Integration', desc: 'OTP Exchange', icon: Activity },
            { label: 'Device Registration', desc: 'CSID Issuance', icon: ShieldCheck },
            { label: 'Go Live', desc: 'Production Ready', icon: CheckCircle2 }
          ].map((step, i) => {
            const isDone = settings?.status === 'Onboarded' || (i === 0 && settings?.company) || (i === 1 && settings?.public_key) || (i < onboardingStep);
            const isCurrent = i === onboardingStep && settings?.status !== 'Onboarded';
            
            return (
              <div key={i} className="relative flex flex-col gap-4 group">
                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                  isDone ? 'bg-emerald-500/10 border-emerald-500/30' : 
                  isCurrent ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 
                  'bg-white/[0.03] border-white/5 grayscale opacity-50'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDone ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                    {isDone ? <Check size={20} strokeWidth={3} /> : <step.icon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isDone ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{step.desc}</p>
                  </div>
                  {isCurrent && (
                    <div className="absolute -top-1 -right-1">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    </div>
                  )}
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ChevronRight size={16} className={isDone ? 'text-emerald-500/50' : 'text-white/5'} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Wizard Controls */}
        <AnimatePresence mode="wait">
          {settings?.status !== 'Onboarded' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 p-6 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  {onboardingStep === 0 ? <Key className="text-blue-400" /> : <Lock className="text-blue-400" />}
                </div>
                <div>
                  <h5 className="text-white font-medium">
                    {onboardingStep === 0 ? 'Initialize Security Module' : 'Authenticate with Fatoora Portal'}
                  </h5>
                  <p className="text-sm text-slate-500">
                    {onboardingStep === 0 ? 'Generate RSA private keys and CSR for your company profile.' : 'Paste the OTP from your ZATCA dashboard to finalize.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                {onboardingStep === 1 && (
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP"
                    className="glass-input !rounded-2xl !py-3 !px-6 w-full md:w-48"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                )}
                <button 
                  onClick={() => handleAction(onboardingStep === 0 ? 'generate_keys' : 'onboard')}
                  className="glass-button px-10 py-3.5 rounded-2xl bg-blue-500 text-white font-bold border-none hover:brightness-110 shadow-xl shadow-blue-500/20 w-full md:w-auto"
                  disabled={working || (onboardingStep === 1 && otp.length < 6)}
                >
                  {working ? (
                    <span className="flex items-center gap-2"><RefreshCw size={18} className="animate-spin" /> Processing...</span>
                  ) : (
                    onboardingStep === 0 ? 'Start Key Generation' : 'Confirm Onboarding'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        {/* Middle Section: Crypto Chain & Logs */}
        <div className="lg:col-span-8 space-y-8">
          {/* Enhanced Cryptographic Chain Graph */}
          <div className="glass-panel p-8 relative overflow-hidden h-[380px] flex flex-col">
            <div className="absolute top-0 right-0 p-8">
               <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Hash Chain
               </span>
            </div>
            
            <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-12">Invoice Hash Integrity Graph</h4>
            
            <div className="flex-1 relative flex items-center justify-center">
              {/* Decorative SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
                 <path d="M 50 150 Q 200 50 350 150 T 650 150" fill="none" stroke="url(#lineGradient)" strokeWidth="2" />
                 <path d="M 50 150 Q 200 250 350 150 T 650 150" fill="none" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="5,5" />
                 <defs>
                   <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#3b82f6" />
                     <stop offset="100%" stopColor="#10b981" />
                   </linearGradient>
                 </defs>
              </svg>

              <div className="flex items-center justify-between w-full max-w-4xl px-8 relative z-10">
                {[...Array(5)].map((_, i) => {
                  const log = logs[i];
                  return (
                    <motion.div 
                      key={i} 
                      className="flex flex-col items-center gap-4"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className={`relative w-16 h-16 rounded-3xl flex items-center justify-center border-2 transition-all duration-700 ${
                        log ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-[0_0_25px_rgba(59,130,246,0.2)] scale-110' : 
                        'bg-white/[0.02] border-white/5 text-slate-700'
                      }`}>
                        {log ? <Check size={28} strokeWidth={2.5} /> : <Lock size={24} />}
                        {log && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-[11px] font-bold tracking-widest ${log ? 'text-white' : 'text-slate-700'}`}>
                          {log ? `#${log.invoice.split('-').pop()}` : 'PENDING'}
                        </p>
                        <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                          {log ? 'Chain Valid' : 'No Data'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-white/5 flex justify-center">
               <div className="bg-slate-950/40 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-mono text-slate-500">
                  LATEST HASH: <span className="text-emerald-400 font-bold">{logs[0]?.api_response ? 'VALID' : 'NONE'}</span> • PIH VERIFIED: <span className="text-emerald-400 font-bold">YES</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Passport Card & Stats */}
        <div className="lg:col-span-4 space-y-8">
          {/* Premium Passport Card */}
          <motion.div 
            className="glass-panel p-8 bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden group shadow-2xl"
            whileHover={{ y: -5 }}
          >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <ShieldCheck className="text-white" size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase">ZATCA Passport</h3>
                </div>
                <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${settings?.status === 'Onboarded' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                   {settings?.mode || 'Developer'}
                </div>
              </div>

              <div className="flex justify-center py-4">
                 <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-amber-500/20 flex items-center justify-center p-2">
                       <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600/20 to-amber-400/20 flex items-center justify-center relative">
                          <img src="/api/placeholder/80/80" alt="Logo" className="w-12 h-12 opacity-40 grayscale brightness-200" />
                          <div className="absolute inset-0 rounded-full border border-amber-500/40 animate-[spin_10s_linear_infinite]" />
                       </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-bold px-3 py-1 rounded-full shadow-lg">
                       VERIFIED
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-2">
                <div className="space-y-1">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Authorized Organization</p>
                   <p className="text-lg font-medium text-white tracking-tight">{settings?.company || 'Marina WorldLink Co'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">VAT Number</p>
                      <p className="text-sm font-mono text-slate-200">310123456789003</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Public Key ID</p>
                      <p className="text-sm font-mono text-slate-200">{settings?.public_key ? 'PUB_KEY_7845T12' : 'MISSING'}</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Valid Until</p>
                      <p className="text-[11px] font-medium text-emerald-400">15 OCT 2026</p>
                   </div>
                   <img src="/api/placeholder/60/20" alt="Barcode" className="h-6 opacity-30 invert" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 flex flex-col gap-2">
              <History size={20} className="text-blue-400/50" />
              <p className="text-2xl font-semibold text-white">{logs.length}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Submissions</p>
            </div>
            <div className="glass-panel p-6 flex flex-col gap-2">
              <Activity size={20} className="text-emerald-400/50" />
              <p className="text-2xl font-semibold text-white">{settings?.last_icv || 0}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global ICV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs Table */}
      <section className="glass-panel overflow-hidden mt-4">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-[13px] font-bold uppercase tracking-[0.3em] text-slate-500">Audit & Compliance Logs</h4>
          <button className="text-[12px] text-blue-400 font-bold hover:brightness-125 transition-all">View Full Archive</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2 px-4">
            <thead>
              <tr className="text-slate-500">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Reference</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-600 italic">No submissions recorded in the blockchain yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.name} className="bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                    <td className="px-6 py-5 rounded-l-2xl border-y border-l border-white/[0.03]">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                          <FileCode size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors">{log.invoice}</p>
                          <p className="text-[11px] text-slate-500 uppercase tracking-tighter">Sales Invoice</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-y border-white/[0.03] text-sm text-slate-400 font-medium">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : 'N/A'}
                    </td>
                    <td className="px-6 py-5 border-y border-white/[0.03]">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                        log.status === 'Success' || log.status === 'Reported' || log.status === 'Cleared'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Success' || log.status === 'Reported' || log.status === 'Cleared' ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                        {log.status}
                      </div>
                    </td>
                    <td className="px-6 py-5 rounded-r-2xl border-y border-r border-white/[0.03] text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-500/20 transition-all border border-white/5"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setSelectedLog(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-4xl max-h-full flex flex-col relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium text-white">{selectedLog.invoice}</h3>
                  <p className="text-xs text-slate-500">Submission Audit Trail & ZATCA Response</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-8 no-scrollbar">
                <div>
                  <h5 className="premium-label mb-3">ZATCA API Response</h5>
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 font-mono text-[12px] text-slate-300 overflow-x-auto">
                    {selectedLog.api_response}
                  </div>
                </div>

                <div>
                  <h5 className="premium-label mb-3">Submitted UBL 2.1 XML</h5>
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 font-mono text-[12px] text-blue-300/80 overflow-x-auto whitespace-pre h-[400px] no-scrollbar">
                    {selectedLog.xml_content}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
