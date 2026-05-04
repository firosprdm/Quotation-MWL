'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Users2, 
  Plus, 
  Search, 
  Filter, 
  Pencil, 
  Trash2, 
  X,
  CreditCard,
  Briefcase,
  UserCheck
} from 'lucide-react';
import styles from './employees.module.css';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import { Employee } from '@/types';

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, isLoaded } = useApp();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    nameAr: '',
    iqamaNo: '',
    jobTitle: '',
    iban: '',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    status: 'Active',
    joinDate: Date.now()
  });

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.iqamaNo.includes(search)
  );

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      nameAr: '',
      iqamaNo: '',
      jobTitle: '',
      iban: '',
      basicSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      status: 'Active',
      joinDate: Date.now()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData(emp);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
      } else {
        await addEmployee(formData as Omit<Employee, 'id'>);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving employee: ' + err);
    }
  };

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Payroll Management</h2>
          <p className={styles.subtitle}>Manage your workforce and WPS compliance details.</p>
        </div>
        <button onClick={handleOpenAdd} className={styles.addButton}>
          <Plus size={20} />
          <span>Add Employee</span>
        </button>
      </header>

      <div className={styles.kpiGrid}>
        <div className={clsx('glass-panel', styles.kpiCard, "hover:scale-[1.02] transition-all duration-300 cursor-pointer")}>
          <div className={clsx(styles.kpiIcon, styles.iconBlue)}>
            <Users2 size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">Total Workforce</p>
            <p className="text-2xl font-bold text-white tracking-tight">{employees.length}</p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard, "hover:scale-[1.02] transition-all duration-300 cursor-pointer")}>
          <div className={clsx(styles.kpiIcon, styles.iconGreen)}>
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">Active Staff</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {employees.filter(e => e.status === 'Active').length}
            </p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard, "hover:scale-[1.02] transition-all duration-300 cursor-pointer")}>
          <div className={clsx(styles.kpiIcon, styles.iconPurple)}>
            <Briefcase size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">Monthly Payroll</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(employees.reduce((acc, e) => acc + e.basicSalary + e.housingAllowance + e.transportAllowance + e.otherAllowances, 0))}
            </p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard, "hover:scale-[1.02] transition-all duration-300 cursor-pointer")}>
          <div className={clsx(styles.kpiIcon, styles.iconOrange)}>
            <CreditCard size={28} />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">WPS Compliance</p>
            <p className="text-2xl font-bold text-orange-400 tracking-tight">Pending</p>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={clsx('glass-panel', styles.searchBar)}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search by name or Iqama..." 
            className={styles.searchInput} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="glass-button px-4 py-2 rounded-xl flex items-center gap-2">
          <Filter size={18} />
          <span>Saudi Compliance Filter</span>
        </button>
      </div>

      <div className={clsx('glass-panel', styles.tableWrapper)}>
      <div className={styles.reportSection}>
        {!isLoaded ? (
          <div className="text-center py-20 text-muted">Loading records...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 text-muted">No employees found.</div>
        ) : (
          filteredEmployees.map((emp) => (
            <div key={emp.id} className={styles.reportRow}>
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-black">
                  {emp.name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] text-white font-medium">{emp.name}</span>
                  <span className="text-[10px] text-muted tracking-wide">{emp.nameAr}</span>
                </div>
              </div>

              <div className="flex items-center gap-8 text-right">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted uppercase tracking-widest mb-1">Iqama No.</span>
                  <span className="font-mono text-xs text-white/70">{emp.iqamaNo}</span>
                </div>
                <div className="flex flex-col w-[120px]">
                  <span className="text-[9px] text-muted uppercase tracking-widest mb-1">Salary</span>
                  <span className="font-mono text-[13px] text-emerald-400">{formatCurrency(emp.basicSalary)}</span>
                </div>
                <div className={clsx(styles.status, styles[emp.status], "text-[9px] px-2 py-0.5 uppercase tracking-tighter")}>
                  {emp.status}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors" onClick={() => handleOpenEdit(emp)}>
                    <Pencil size={14} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors" onClick={() => deleteEmployee(emp.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={clsx('glass-panel', styles.modalContent)} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h3 className="text-xl font-bold text-white">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.inputGroup}>
                  <label>Full Name (English)</label>
                  <input 
                    type="text" 
                    className={styles.modalInput} 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Full Name (Arabic)</label>
                  <input 
                    type="text" 
                    className={styles.modalInput} 
                    value={formData.nameAr} 
                    onChange={e => setFormData({...formData, nameAr: e.target.value})} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Iqama / ID Number</label>
                  <input 
                    type="text" 
                    className={styles.modalInput} 
                    value={formData.iqamaNo} 
                    onChange={e => setFormData({...formData, iqamaNo: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Job Title</label>
                  <input 
                    type="text" 
                    className={styles.modalInput} 
                    value={formData.jobTitle} 
                    onChange={e => setFormData({...formData, jobTitle: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>IBAN (For WPS)</label>
                  <input 
                    type="text" 
                    className={styles.modalInput} 
                    value={formData.iban} 
                    onChange={e => setFormData({...formData, iban: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Basic Salary</label>
                  <input 
                    type="number" 
                    className={styles.modalInput} 
                    value={formData.basicSalary} 
                    onChange={e => setFormData({...formData, basicSalary: Number(e.target.value)})} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Housing Allowance</label>
                  <input 
                    type="number" 
                    className={styles.modalInput} 
                    value={formData.housingAllowance} 
                    onChange={e => setFormData({...formData, housingAllowance: Number(e.target.value)})} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Transport Allowance</label>
                  <input 
                    type="number" 
                    className={styles.modalInput} 
                    value={formData.transportAllowance} 
                    onChange={e => setFormData({...formData, transportAllowance: Number(e.target.value)})} 
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="glass-button px-6 py-2" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.addButton}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
