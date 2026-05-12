'use client';

import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { X, Check, Calendar, Hash, FileCheck, AlertCircle } from 'lucide-react';

export type StatusChangeType = 
  | 'approve-quotation'     // Quotation → Approved: needs approvalDate
  | 'po-received'           // Sales → PO Received: needs poNumber + poDate
  | 'work-done';            // Work Flow → Work Done: needs completionDate

interface StatusChangeModalProps {
  type: StatusChangeType;
  quotationNumber: string;
  clientName: string;
  onConfirm: (data: StatusChangeData) => void;
  onCancel: () => void;
}

export interface StatusChangeData {
  approvalDate?: number;
  poNumber?: string;
  poDate?: number;
  completionDate?: number;
}

const todayStr = () => new Date().toISOString().split('T')[0];

export function StatusChangeModal({ type, quotationNumber, clientName, onConfirm, onCancel }: StatusChangeModalProps) {
  const [approvalDate, setApprovalDate] = useState(todayStr());
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(todayStr());
  const [completionDate, setCompletionDate] = useState(todayStr());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the first input when the modal opens
    const timer = setTimeout(() => firstInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (type === 'approve-quotation') {
      if (!approvalDate) newErrors.approvalDate = 'Approval date is required';
    }
    if (type === 'po-received') {
      if (!poNumber.trim()) newErrors.poNumber = 'PO Number is required';
      if (!poDate) newErrors.poDate = 'PO date is required';
    }
    if (type === 'work-done') {
      if (!completionDate) newErrors.completionDate = 'Completion date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    
    const data: StatusChangeData = {};
    if (type === 'approve-quotation') {
      data.approvalDate = new Date(approvalDate).getTime();
    }
    if (type === 'po-received') {
      data.poNumber = poNumber.trim();
      data.poDate = new Date(poDate).getTime();
    }
    if (type === 'work-done') {
      data.completionDate = new Date(completionDate).getTime();
    }
    onConfirm(data);
  };

  const config = {
    'approve-quotation': {
      title: 'Approve Quotation',
      subtitle: 'Record the official approval date for this quotation.',
      color: 'emerald',
      icon: <FileCheck size={28} className="text-emerald-400" />,
      badge: 'APPROVED',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      confirmLabel: 'Confirm Approval',
      confirmClass: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300',
    },
    'po-received': {
      title: 'PO Received',
      subtitle: 'Enter the Purchase Order details to confirm receipt.',
      color: 'blue',
      icon: <Hash size={28} className="text-blue-400" />,
      badge: 'PO RECEIVED',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      confirmLabel: 'Confirm PO Receipt',
      confirmClass: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300',
    },
    'work-done': {
      title: 'Work Completed',
      subtitle: 'Record the official work completion date.',
      color: 'purple',
      icon: <Check size={28} className="text-purple-400" />,
      badge: 'COMPLETED',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      confirmLabel: 'Confirm Completion',
      confirmClass: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 text-purple-300',
    },
  }[type];

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="glass-panel border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          
          {/* Top Gradient Bar */}
          <div className={clsx(
            "h-1 w-full",
            config.color === 'emerald' && "bg-gradient-to-r from-emerald-500 to-cyan-500",
            config.color === 'blue' && "bg-gradient-to-r from-blue-500 to-indigo-500",
            config.color === 'purple' && "bg-gradient-to-r from-purple-500 to-pink-500",
          )} />

          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-14 h-14 rounded-2xl flex items-center justify-center border",
                config.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/20",
                config.color === 'blue' && "bg-blue-500/10 border-blue-500/20",
                config.color === 'purple' && "bg-purple-500/10 border-purple-500/20",
              )}>
                {config.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-wide">{config.title}</h2>
                <p className="text-sm text-white/50 mt-0.5">{config.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quotation Info */}
          <div className="mx-6 mb-6 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Document</p>
              <p className="text-white font-medium">{quotationNumber}</p>
              <p className="text-sm text-white/50">{clientName}</p>
            </div>
            <span className={clsx("text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider", config.badgeClass)}>
              {config.badge}
            </span>
          </div>

          {/* Form Fields */}
          <div className="px-6 pb-6 space-y-4">
            
            {/* Approve Quotation: Approval Date */}
            {type === 'approve-quotation' && (
              <div>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                  <Calendar size={12} className="inline mr-2" />
                  Date of Approval
                </label>
                <input
                  ref={firstInputRef as any}
                  type="date"
                  value={approvalDate}
                  onChange={(e) => { setApprovalDate(e.target.value); setErrors({}); }}
                  className={clsx(
                    "glass-input w-full",
                    errors.approvalDate && "!border-red-500/50"
                  )}
                />
                {errors.approvalDate && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.approvalDate}
                  </p>
                )}
              </div>
            )}

            {/* PO Received: PO Number + PO Date */}
            {type === 'po-received' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                    <Hash size={12} className="inline mr-2" />
                    PO Number
                  </label>
                  <input
                    ref={firstInputRef as any}
                    type="text"
                    placeholder="e.g. PO-2026-001234"
                    value={poNumber}
                    onChange={(e) => { setPoNumber(e.target.value); setErrors({}); }}
                    className={clsx(
                      "glass-input w-full",
                      errors.poNumber && "!border-red-500/50"
                    )}
                  />
                  {errors.poNumber && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.poNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                    <Calendar size={12} className="inline mr-2" />
                    PO Approval Date
                  </label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => { setPoDate(e.target.value); setErrors({}); }}
                    className={clsx(
                      "glass-input w-full",
                      errors.poDate && "!border-red-500/50"
                    )}
                  />
                  {errors.poDate && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.poDate}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Work Done: Completion Date */}
            {type === 'work-done' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                    <Calendar size={12} className="inline mr-2" />
                    Work Completion Date
                  </label>
                  <input
                    ref={firstInputRef as any}
                    type="date"
                    value={completionDate}
                    onChange={(e) => { setCompletionDate(e.target.value); setErrors({}); }}
                    className={clsx(
                      "glass-input w-full",
                      errors.completionDate && "!border-red-500/50"
                    )}
                  />
                  {errors.completionDate && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.completionDate}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 glass-button !justify-center text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all",
                  config.confirmClass
                )}
              >
                <Check size={18} />
                {config.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
