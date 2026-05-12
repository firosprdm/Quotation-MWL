'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Pencil, 
  Trash2, 
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Eye,
  Sparkles
} from 'lucide-react';
import styles from '../employees/employees.module.css';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import { Expense, ExpenseProduct, Employee } from '@/types';

export default function ExpensesPage() {
  const { 
    expenses, 
    expenseProducts, 
    employees, 
    addExpense, 
    updateExpenseStatus, 
    deleteExpense, 
    isLoaded, 
    currentUser,
    quotations 
  } = useApp();
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    employeeId: '',
    productId: '',
    unitAmount: '' as string | number,
    vatAmount: 0,
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    projectId: '',
  });
  
  const [receiptFile, setReceiptFile] = useState<{ name: string; data: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'approve' | 'refuse' | 'delete';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'approve'
  });

  const filteredExpenses = expenses
    .filter(e => {
      const desc = e.description || '';
      const employee = employees.find(emp => emp.id === e.employeeId);
      const employeeName = employee?.name || '';
      
      return desc.toLowerCase().includes(search.toLowerCase()) ||
             employeeName.toLowerCase().includes(search.toLowerCase());
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        setReceiptFile({
          name: file.name,
          data: base64Data
        });

        // Trigger AI Scanning
        setIsScanning(true);
        try {
          const res = await fetch('/api/v1/ai/scan-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
          });
          const data = await res.json();
          if (data && !data.error) {
            // Suggest category based on AI
            const matchedProduct = expenseProducts.find(p => 
              p.name.toLowerCase().includes(data.suggestedCategory?.toLowerCase() || '')
            );

            const total = Number(data.total_amount) || 0;
            const vat = Number(data.vat_amount) || 0;
            
            setFormData(prev => ({
              ...prev,
              description: data.vendor ? `${data.vendor}: ${data.category || ''}` : (data.description || prev.description),
              unitAmount: total - vat,
              vatAmount: vat,
              date: data.date || prev.date,
              productId: matchedProduct?.id || prev.productId
            }));
            
            // Open modal to show results
            setIsModalOpen(true);
          }
        } catch (err) {
          console.error('AI Scan failed:', err);
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addExpense({
        ...formData,
        unitAmount: Number(formData.unitAmount),
        date: new Date(formData.date).getTime()
      } as any, receiptFile || undefined);
      setIsModalOpen(false);
      setFormData({
        description: '',
        employeeId: '',
        productId: '',
        unitAmount: '',
        vatAmount: 0,
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
        projectId: '',
      });
      setReceiptFile(null);
    } catch (err) {
      alert('Error saving expense: ' + err);
    }
  };

  const handleApprove = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Expense',
      message: 'Are you sure you want to approve this expense? This will post it to ERPNext Accounting.',
      type: 'approve',
      onConfirm: async () => {
        try {
          await updateExpenseStatus(id, 'approve');
        } catch (err) {
          alert('Error approving expense: ' + err);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRefuse = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Refuse Expense',
      message: 'Are you sure you want to refuse this expense?',
      type: 'refuse',
      onConfirm: async () => {
        try {
          await updateExpenseStatus(id, 'refuse');
        } catch (err) {
          alert('Error refusing expense: ' + err);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This cannot be undone.',
      type: 'delete',
      onConfirm: async () => {
        try {
          await deleteExpense(id);
        } catch (err) {
          alert('Error deleting expense: ' + err);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Expense Management</h2>
          <p className="premium-subtitle">Track business costs, travel, and material expenses.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input 
              type="file" 
              id="global-scan" 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*,.pdf"
            />
            <label 
              htmlFor="global-scan" 
              className={clsx(
                "glass-button px-6 h-12 flex items-center gap-3 transition-all cursor-pointer group overflow-hidden",
                isScanning ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
              )}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse">AI Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                  <span className="font-medium">Magic AI Scan</span>
                </>
              )}
              {isScanning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              )}
            </label>
          </div>
          <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
            <Plus size={20} />
            <span>Submit Expense</span>
          </button>
        </div>
      </header>

      <div className={styles.kpiGrid}>
        <div className={clsx('glass-panel', styles.kpiCard)}>
          <div className={clsx(styles.kpiIcon, styles.iconBlue)}>
            <Wallet size={28} />
          </div>
          <div>
            <p className="premium-label mb-1">Total Expenses</p>
            <p className="text-2xl font-normal text-white tracking-tight">
              {formatCurrency(expenses.reduce((acc, e) => acc + (Number(e.totalAmount) || 0), 0))}
            </p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard)}>
          <div className={clsx(styles.kpiIcon, styles.iconOrange)}>
            <FileText size={28} />
          </div>
          <div>
            <p className="premium-label mb-1">Pending Approval</p>
            <p className="text-2xl font-normal text-amber-400 tracking-tight">
              {expenses.filter(e => e.status === 'draft' || e.status === 'reported').length}
            </p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard)}>
          <div className={clsx(styles.kpiIcon, styles.iconGreen)}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="premium-label mb-1">Approved This Month</p>
            <p className="text-2xl font-normal text-emerald-400 tracking-tight">
              {expenses.filter(e => e.status === 'approved' || e.status === 'done').length}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={clsx('glass-panel', styles.searchBar)}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search by description or employee..." 
            className={styles.searchInput} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={clsx('glass-panel', styles.tableWrapper)}>
        {!isLoaded ? (
          <div className="text-center py-20 text-muted">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-20 text-muted">No expenses found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="premium-label">Date</th>
                  <th className="premium-label">Description</th>
                  <th className="premium-label">Employee</th>
                  <th className="premium-label">Category</th>
                  <th className="premium-label">Project</th>
                  <th className="premium-label">Amount</th>
                  <th className="premium-label">VAT</th>
                  <th className="premium-label">Total</th>
                  <th className="premium-label">Status</th>
                  <th className="premium-label text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const employee = employees.find(emp => emp.id === exp.employeeId);
                  const product = expenseProducts.find(p => p.id === exp.productId);
                  return (
                    <tr key={exp.id}>
                      <td className="text-white/70 text-sm">{exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="text-white font-medium">{exp.description || 'No Description'}</div>
                      </td>
                      <td className="text-white/70">{employee?.name || 'Unknown'}</td>
                      <td className="text-blue-400 text-sm">{product?.name || 'General'}</td>
                      <td className="text-white/50 text-xs">{exp.projectId ? quotations.find(q => q.id === exp.projectId)?.projectName || 'Unnamed' : '-'}</td>
                      <td className="font-mono text-white font-semibold">{formatCurrency((Number(exp.unitAmount) || 0) * (exp.quantity || 1))}</td>
                      <td className="font-mono text-blue-400">{formatCurrency(Number(exp.vatAmount) || 0)}</td>
                      <td className="font-mono text-emerald-400 font-semibold">{formatCurrency(Number(exp.totalAmount) || 0)}</td>
                      <td>
                        <span className={clsx(
                          "inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest min-w-[90px] h-6 border rounded-lg px-2 text-center",
                          exp.status === 'approved' || exp.status === 'done' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          exp.status === 'refused' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {exp.status === 'done' ? 'Paid' : exp.status}
                        </span>
                      </td>
                      <td>
                        <div className={clsx(styles.actions, "justify-end")}>
                          <button className={styles.actionBtn} onClick={() => setViewingExpense(exp)} title="View Details">
                            <Eye size={16} />
                          </button>
                          {(exp.status === 'draft' || exp.status === 'reported') && (
                            <>
                              <button 
                                className={clsx(styles.actionBtn, "hover:text-emerald-400")} 
                                onClick={() => handleApprove(exp.id)}
                                title="Approve"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button 
                                className={clsx(styles.actionBtn, styles.deleteBtn)} 
                                onClick={() => handleRefuse(exp.id)}
                                title="Refuse"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            className={clsx(styles.actionBtn, styles.deleteBtn)} 
                            onClick={() => handleDelete(exp.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className={clsx('glass-panel', styles.modalContent, "max-w-md")} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className="text-xl font-medium text-white">{confirmModal.title}</h3>
              <button type="button" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}><X size={20}/></button>
            </div>
            <div className={styles.modalBody} style={{ display: 'block' }}>
              <p className="text-white/70 mb-6">{confirmModal.message}</p>
            </div>
            <div className={styles.modalFooter}>
              <button className="glass-button px-6 py-2" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
              <button 
                className={clsx(
                  "px-6 py-2 rounded-xl font-medium text-white transition-all",
                  confirmModal.type === 'delete' ? "bg-rose-600 hover:bg-rose-500" :
                  confirmModal.type === 'refuse' ? "bg-amber-600 hover:bg-amber-500" :
                  "bg-emerald-600 hover:bg-emerald-500"
                )} 
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={clsx('glass-panel', styles.modalContent)} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h3 className="text-xl font-medium text-white">Submit New Expense</h3>
                <button type="button" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.inputGroup}>
                  <label>Description</label>
                  <input 
                    type="text" 
                    className={styles.modalInput} 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    required 
                    placeholder="e.g. Site Visit Travel"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Project / Quotation (Optional)</label>
                  <select 
                    className={styles.modalInput} 
                    value={formData.projectId} 
                    onChange={e => setFormData({...formData, projectId: e.target.value})}
                  >
                    <option value="">No Project Tag</option>
                    {quotations.filter(q => q.status === 'approved').map(q => (
                      <option key={q.id} value={q.id}>{q.number} - {q.projectName || 'Unnamed Project'}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Employee</label>
                  <select 
                    className={styles.modalInput} 
                    value={formData.employeeId} 
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    required
                  >
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Category (ERPNext Item)</label>
                  <select 
                    className={styles.modalInput} 
                    value={formData.productId} 
                    onChange={e => setFormData({...formData, productId: e.target.value})}
                    required
                  >
                    <option value="">Select Category...</option>
                    {expenseProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-4">
                  <div className={styles.inputGroup}>
                    <label>Amount (Excl. VAT)</label>
                    <input 
                      type="number" 
                      className={styles.modalInput} 
                      value={formData.unitAmount} 
                      onChange={e => {
                        const val = e.target.value;
                        const num = Number(val);
                        setFormData(prev => ({
                          ...prev, 
                          unitAmount: val === '' ? '' : num,
                          vatAmount: prev.vatAmount > 0 ? num * 0.15 : 0
                        }));
                      }} 
                      required 
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="checkbox" 
                        id="hasVat"
                        className="w-5 h-5 rounded border-white/20 bg-black/50 accent-blue-500 cursor-pointer"
                        checked={formData.vatAmount > 0}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          vatAmount: e.target.checked ? Number(prev.unitAmount) * 0.15 : 0
                        }))}
                      />
                      <label htmlFor="hasVat" className="text-white font-medium cursor-pointer">
                        Apply 15% VAT
                      </label>
                    </div>
                    
                    {formData.vatAmount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-sm">VAT Amount:</span>
                        <span className="font-mono text-blue-400 font-semibold">{formatCurrency(formData.vatAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    className={styles.modalInput} 
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Date</label>
                  <input 
                    type="date" 
                    className={styles.modalInput} 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Receipt (Photo/Scan)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="receipt-upload"
                      className="hidden" 
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                    <label 
                      htmlFor="receipt-upload"
                      className={clsx(
                        "flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                        isScanning ? "border-blue-500 bg-blue-500/10 animate-pulse text-blue-400" : "border-white/10 text-white/50 hover:border-blue-500/50 hover:bg-blue-500/5"
                      )}
                    >
                      <Upload size={20} className={isScanning ? "animate-bounce" : ""} />
                      <span>
                        {isScanning ? 'AI is scanning receipt...' : (receiptFile ? receiptFile.name : 'Upload Receipt (AI Scan Enabled)')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="glass-button px-6 py-2" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.addButton}>Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingExpense && (
        <div className={styles.modalOverlay} onClick={() => setViewingExpense(null)}>
          <div className={clsx('glass-panel', styles.modalContent, "max-w-2xl")} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className="text-xl font-medium text-white">Expense Details</h3>
              <button type="button" onClick={() => setViewingExpense(null)}><X size={20}/></button>
            </div>
            <div className={styles.modalBody}>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="premium-label block mb-1">Description</label>
                  <p className="text-white text-lg">{viewingExpense.description}</p>
                </div>
                <div>
                  <label className="premium-label block mb-1">Status</label>
                  <span className={clsx(
                    "inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest min-w-[90px] h-6 border rounded-lg px-2 text-center",
                    viewingExpense.status === 'approved' || viewingExpense.status === 'done' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    viewingExpense.status === 'refused' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}>
                    {viewingExpense.status}
                  </span>
                </div>
                <div>
                  <label className="premium-label block mb-1">Employee</label>
                  <p className="text-white">{employees.find(emp => emp.id === viewingExpense.employeeId)?.name}</p>
                </div>
                <div>
                  <label className="premium-label block mb-1">Project</label>
                  <p className="text-white">{viewingExpense.projectId ? quotations.find(q => q.id === viewingExpense.projectId)?.projectName || 'Unnamed' : 'Not Tagged'}</p>
                </div>
                <div>
                  <label className="premium-label block mb-1">Date</label>
                  <p className="text-white">{new Date(viewingExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="premium-label block mb-1">Total Amount</label>
                  <p className="text-2xl font-mono text-emerald-400">{formatCurrency(viewingExpense.totalAmount)}</p>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-6">
                <label className="premium-label block mb-4">Receipt</label>
                <div className="w-full h-64 bg-black/20 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
                  {/* In a real app, you'd fetch the attachment from ERPNext here */}
                  <div className="text-center text-white/30">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Attachment Stored in ERPNext</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              {(viewingExpense.status === 'draft' || viewingExpense.status === 'reported') && (
                <div className="flex gap-3">
                  <button className="glass-button px-6 py-2 bg-emerald-500/10 text-emerald-400" onClick={() => { handleApprove(viewingExpense.id); setViewingExpense(null); }}>Approve</button>
                  <button className="glass-button px-6 py-2 bg-rose-500/10 text-rose-400" onClick={() => { handleRefuse(viewingExpense.id); setViewingExpense(null); }}>Refuse</button>
                </div>
              )}
              <button type="button" className="glass-button px-6 py-2" onClick={() => setViewingExpense(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
