import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Zap, ArrowUpRight, ArrowDownLeft, Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  onClose: () => void;
}

export function QuickAddModal({ onClose }: Props) {
  const { accounts, addQuickTransaction } = useApp();
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryAccountId, setCategoryAccountId] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [description, setDescription] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  // Auto-select source if only one Asset exists (usually Cash or Bank)
  useEffect(() => {
    const assets = accounts.filter(a => a.type === 'Asset');
    if (assets.length === 1) {
      setSourceAccountId(assets[0].id);
    } else if (assets.length > 0) {
      // Default to first bank/cash if available
      const bankOrCash = assets.find(a => a.code === '1010' || a.code === '1000');
      if (bankOrCash) setSourceAccountId(bankOrCash.id);
    }
  }, [accounts]);

  const categories = accounts.filter(a => 
    type === 'expense' ? a.type === 'Expense' : a.type === 'Revenue'
  );
  
  const sources = accounts.filter(a => a.type === 'Asset');

  const canSave = parseFloat(amount) > 0 && categoryAccountId !== '' && sourceAccountId !== '';

  const handleSave = async () => {
    if (!canSave) {
      setError('Please fill all fields');
      return;
    }
    
    try {
      await addQuickTransaction({
        type,
        amount: parseFloat(amount),
        categoryAccountId,
        sourceAccountId,
        description: description || (type === 'income' ? 'Quick Income' : 'Quick Expense')
      });
      onClose();
    } catch (error) {
      console.error('Failed to save quick transaction:', error);
      setError('Error saving transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Animated Glow Border */}
        <div className={clsx(
          "absolute inset-0 pointer-events-none opacity-20 transition-colors duration-500",
          type === 'income' ? "bg-emerald-500/10 shadow-[inset_0_0_50px_rgba(16,185,129,0.2)]" : "bg-red-500/10 shadow-[inset_0_0_50px_rgba(239,68,68,0.2)]"
        )} />

        <div className="p-8 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-5">
              <div className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 shadow-2xl transform hover:rotate-12 group",
                type === 'income' 
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20" 
                  : "bg-red-500/20 border-red-500/40 text-red-400 shadow-red-500/20"
              )}>
                <div className="relative">
                  {/* Neon Glow Background */}
                  <div className={clsx(
                    "absolute inset-0 blur-xl opacity-80 animate-pulse",
                    type === 'income' ? "bg-emerald-400" : "bg-red-400"
                  )} />
                  <Zap size={32} className={clsx(
                    "relative z-10 animate-bounce fill-current",
                    type === 'income' ? "text-emerald-400" : "text-yellow-400"
                  )} />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-black tracking-tight text-white mb-0.5">Quick Add</h2>
                <div className="flex items-center gap-2">
                  <div className={clsx("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse", type === 'income' ? "bg-emerald-400 text-emerald-400" : "bg-red-400 text-red-400")} />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 mt-0.5">Lightning Entry</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all hover:rotate-90 shadow-lg mt-1">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Type Toggle */}
            <div className="flex p-1.5 bg-slate-900/60 rounded-2xl border border-white/10 relative shadow-inner">
              <div 
                className={clsx(
                  "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-500 ease-out",
                  type === 'income' ? "left-1.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "left-[calc(50%+1.5px)] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                )}
              />
              <button 
                onClick={() => setType('income')}
                className={clsx(
                  "flex-1 py-3 text-sm font-black uppercase tracking-widest relative z-10 transition-colors duration-300",
                  type === 'income' ? "text-white" : "text-white/50 hover:text-white"
                )}
              >
                <div className="flex items-center justify-center">
                  <div className="pr-4 border-r border-current opacity-30 mr-4 transition-opacity group-hover:opacity-60">
                    <ArrowDownLeft size={24} />
                  </div>
                  Income
                </div>
              </button>
              <button 
                onClick={() => setType('expense')}
                className={clsx(
                  "flex-1 py-3 text-sm font-black uppercase tracking-widest relative z-10 transition-colors duration-300",
                  type === 'expense' ? "text-white" : "text-white/50 hover:text-white"
                )}
              >
                <div className="flex items-center justify-center">
                  <div className="pr-4 border-r border-current opacity-30 mr-4 transition-opacity group-hover:opacity-60">
                    <ArrowUpRight size={24} />
                  </div>
                  Expense
                </div>
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/80 uppercase tracking-widest ml-2">Amount (SAR)</label>
              <input 
                type="number"
                placeholder="0.00"
                className={clsx(
                  "w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-2xl font-mono font-black text-center focus:outline-none transition-all placeholder-white/30 shadow-inner",
                  type === 'income' ? "focus:border-emerald-400 focus:bg-emerald-500/10 text-emerald-300" : "focus:border-red-400 focus:bg-red-500/10 text-red-300"
                )}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>

            {/* Selects */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/80 uppercase tracking-widest ml-2">Category</label>
                <select 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-base text-white font-bold focus:outline-none focus:border-white/40 transition-all appearance-none cursor-pointer"
                  value={categoryAccountId}
                  onChange={(e) => setCategoryAccountId(e.target.value)}
                >
                  <option value="" disabled className="text-white/50 bg-slate-900">Select...</option>
                  {categories.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-slate-800 text-white">{acc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/80 uppercase tracking-widest ml-2">Source</label>
                <select 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-base text-white font-bold focus:outline-none focus:border-white/40 transition-all appearance-none cursor-pointer"
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                >
                  <option value="" disabled className="text-white/50 bg-slate-900">Select...</option>
                  {sources.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-slate-800 text-white">{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/80 uppercase tracking-widest ml-2">Description (Optional)</label>
              <textarea 
                rows={3}
                placeholder="Enter note..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-base text-white font-bold focus:outline-none focus:border-white/40 transition-all placeholder-white/40 shadow-inner resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-400 text-sm font-bold animate-in slide-in-from-top-1 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              onClick={handleSave}
              disabled={!canSave}
              className={clsx(
                "w-full py-4 rounded-2xl flex items-center justify-center text-lg font-black uppercase tracking-[0.2em] transition-all duration-500 transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale group mt-6",
                type === 'income' 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.6)] border border-emerald-400/50" 
                  : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.4)] hover:shadow-[0_20px_50px_rgba(239,68,68,0.6)] border border-red-400/50"
              )}
            >
              <div className="pr-5 border-r border-white/20 group-hover:border-white/40 mr-5 transition-colors">
                <Check size={24} className="group-hover:scale-125 transition-transform duration-300" />
              </div>
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
