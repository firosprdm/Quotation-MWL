import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Plus, Trash2, Save, BookOpen, Sparkles, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { JournalLine } from '@/types';

interface Props {
  onClose: () => void;
}

export function JournalEntryForm({ onClose }: Props) {
  const { accounts, addJournalEntry } = useApp();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: accounts[0]?.id || '', debit: 0, credit: 0 },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 0 },
  ]);

  const addLine = () => {
    setLines([...lines, { accountId: accounts[0]?.id || '', debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    
    // If setting debit, clear credit and vice versa
    if (field === 'debit' && value > 0) newLines[index].credit = 0;
    if (field === 'credit' && value > 0) newLines[index].debit = 0;
    
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalDebit = lines.reduce((acc, line) => acc + (line.debit || 0), 0);
  const totalCredit = lines.reduce((acc, line) => acc + (line.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const canSubmit = isBalanced && description.trim() !== '' && lines.every(l => l.accountId !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await addJournalEntry({
        date: new Date(date).getTime(),
        description,
        reference,
        lines: lines.filter(l => l.debit > 0 || l.credit > 0)
      });
      onClose();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      alert('Error saving journal entry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      {/* Deep Blur Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={onClose} />
      
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900/60 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 rounded-[2.5rem] relative overflow-hidden animate-in zoom-in-[0.98] duration-500 ease-out">
        
        {/* Soft Top Glow */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none opacity-50" />

        <button 
          onClick={onClose}
          className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-white/10 transition-all hover:rotate-90 hover:scale-105 z-20 group"
        >
          <X size={20} className="group-hover:text-red-400 transition-colors" />
        </button>

        <div className="px-8 pt-8 pb-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-6 mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 blur-2xl opacity-40 group-hover:opacity-100 transition-opacity animate-[pulse_3s_ease-in-out_infinite]" />
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-950 flex items-center justify-center border-2 border-white/10 shadow-2xl relative z-10 overflow-hidden transform group-hover:-rotate-12 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-indigo-600/20 group-hover:opacity-80 transition-opacity" />
                <BookOpen className="text-purple-400 group-hover:text-pink-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-all group-hover:scale-110" size={32} />
                <Sparkles size={14} className="absolute top-2 right-2 text-pink-300 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-normal tracking-tight text-white leading-none mb-2">New Journal Entry</h2>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                <p className="text-purple-300/80 font-normal tracking-[0.2em] text-sm uppercase leading-none">Double-Entry Core</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden relative z-10">
          <div className="px-8 py-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
            
            {/* Meta Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-slate-900/50 border border-white/10 shadow-inner">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-blue-300 uppercase tracking-wider ml-1">Date</label>
                <div className="relative group">
                  <input 
                    type="date" 
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-base text-white font-normal focus:outline-none focus:border-blue-500 focus:bg-blue-500/20 transition-all cursor-pointer"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-medium text-blue-300 uppercase tracking-wider ml-1">Description</label>
                <input 
                  type="text" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-base text-white font-normal focus:outline-none focus:border-blue-500 focus:bg-blue-500/20 transition-all placeholder-white/40"
                  placeholder="e.g., Initial Capital Investment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-blue-300 uppercase tracking-wider ml-1">Reference</label>
                <input 
                  type="text" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-base text-white font-normal focus:outline-none focus:border-blue-500 focus:bg-blue-500/20 transition-all placeholder-white/40"
                  placeholder="Optional"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            {/* Entry Lines Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xl font-medium tracking-tight text-white">Entry Lines</h3>
                <button 
                  type="button" 
                  onClick={addLine} 
                  className="mr-8 text-sm px-5 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 hover:border-blue-400 hover:text-white transition-all flex items-center font-medium group shadow-lg"
                >
                  <div className="pr-4 border-r border-blue-500/40 group-hover:border-blue-400 mr-4 transition-colors">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                  Add New Line
                </button>
              </div>
              
              <div className="rounded-2xl border border-white/20 overflow-hidden bg-slate-900/60 shadow-xl">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-white/20 bg-white/10">
                      <th className="p-5 pl-8 text-sm font-normal text-white/90 uppercase tracking-widest">Account</th>
                      <th className="p-5 w-52 text-right text-sm font-normal text-emerald-300 uppercase tracking-widest">Debit</th>
                      <th className="p-5 w-52 text-right text-sm font-normal text-orange-300 uppercase tracking-widest">Credit</th>
                      <th className="p-5 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {lines.map((line, index) => (
                      <tr key={index} className="group hover:bg-white/[0.04] transition-colors duration-200 animate-in fade-in slide-in-from-right-3" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="p-4 pl-8">
                          <select
                            className="w-full bg-white/10 border border-transparent hover:border-white/20 rounded-xl px-4 py-3 text-base text-white font-normal focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 transition-all cursor-pointer appearance-none truncate"
                            value={line.accountId}
                            onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                            required
                          >
                            <option value="" disabled className="bg-slate-900 text-white/60">Select Account...</option>
                            {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => (
                              <optgroup key={type} label={type} className="bg-slate-900 text-blue-300 font-medium uppercase text-sm">
                                {accounts.filter(a => a.type === type).map(acc => (
                                  <option key={acc.id} value={acc.id} className="text-white font-medium bg-slate-800 normal-case text-base py-1">
                                    {acc.code} — {acc.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full bg-white/10 border border-transparent hover:border-white/20 rounded-xl px-4 py-3 text-base text-right font-mono font-medium text-emerald-300 focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/10 transition-all placeholder-emerald-500/40"
                            placeholder="0.00"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full bg-white/10 border border-transparent hover:border-white/20 rounded-xl px-4 py-3 text-base text-right font-mono font-medium text-orange-300 focus:outline-none focus:border-orange-500 focus:bg-orange-500/10 transition-all placeholder-orange-500/40"
                            placeholder="0.00"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-4 pr-10 text-center">
                          <button 
                            type="button" 
                            onClick={() => removeLine(index)}
                            className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-white/20 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30"
                            disabled={lines.length <= 2}
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-black/60 border-t-2 border-white/20">
                      <td className="p-6 pl-8 text-right text-sm font-medium uppercase tracking-wider text-white/80">Total Balance</td>
                      <td className={clsx(
                        "p-6 text-right font-mono font-medium text-2xl transition-all duration-300 drop-shadow-md",
                        totalDebit !== totalCredit ? "text-red-400" : "text-emerald-400"
                      )}>
                        {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={clsx(
                        "p-6 text-right font-mono font-medium text-2xl transition-all duration-300 drop-shadow-md",
                        totalDebit !== totalCredit ? "text-red-400" : "text-emerald-400"
                      )}>
                        {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Validation Warning */}
              <div className="h-8 mt-2 flex justify-end px-4">
                {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      Difference: {Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-8 border-t border-white/10 flex justify-center items-center gap-8 bg-slate-900/80 backdrop-blur-3xl relative z-10 rounded-b-[2.5rem] shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-4 rounded-2xl text-white/70 font-medium hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center border border-transparent hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] group relative overflow-hidden"
            >
              <div className="pr-5 border-r border-white/10 group-hover:border-red-500/40 mr-5 transition-colors z-10">
                <XCircle size={24} className="group-hover:-rotate-180 group-hover:scale-110 transition-transform duration-700 ease-in-out" />
              </div>
              <span className="z-10 text-lg tracking-wide">Cancel</span>
            </button>
            <button 
              type="submit" 
              disabled={!canSubmit}
              className="px-10 py-4 rounded-2xl flex items-center justify-center font-normal tracking-wide bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] text-white shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_50px_rgba(236,72,153,0.8)] hover:bg-[center_right_1rem] hover:scale-[1.03] active:scale-95 transition-all duration-500 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group border border-white/20 relative overflow-hidden"
            >
              {/* Shimmer Overlay */}
              <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              
              <div className="pr-5 border-r border-white/30 mr-5 group-hover:border-white/50 transition-colors z-10 relative">
                <Save size={24} className="group-hover:scale-125 transition-transform duration-500 relative z-10" />
                <Sparkles size={12} className="absolute -top-1 -right-1 text-pink-200 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
              </div>
              <span className="z-10 text-lg">Save Journal Entry</span>
              
              <Sparkles size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-pink-200 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
