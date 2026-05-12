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
  UserCheck,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import styles from './employees.module.css';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import { Employee } from '@/types';

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, isLoaded, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  type SortField = 'name' | 'iqamaNo' | 'jobTitle' | 'basicSalary' | 'allowances' | 'netPay' | 'status';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const filteredEmployees = employees
    .filter(e => 
      e.name.toLowerCase().includes(search.toLowerCase()) || 
      e.iqamaNo.includes(search)
    )
    .sort((a, b) => {
      const getAllowances = (emp: Employee) => emp.housingAllowance + (emp.transportAllowance || 0) + (emp.otherAllowances || 0);
      const getNetPay = (emp: Employee) => emp.basicSalary + getAllowances(emp);

      let aValue: any = a[sortField as keyof Employee];
      let bValue: any = b[sortField as keyof Employee];

      if (sortField === 'allowances') {
        aValue = getAllowances(a);
        bValue = getAllowances(b);
      } else if (sortField === 'netPay') {
        aValue = getNetPay(a);
        bValue = getNetPay(b);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 opacity-40 inline-block" />;
    return sortDirection === 'asc' 
      ? <ChevronUp size={14} className="ml-1 inline-block text-blue-400" />
      : <ChevronDown size={14} className="ml-1 inline-block text-blue-400" />;
  };

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
          <h2 className="premium-title">Payroll Management</h2>
          <p className="premium-subtitle">Manage your workforce and WPS compliance details.</p>
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
            <p className="premium-label mb-1">Total Workforce</p>
            <p className="text-2xl font-normal text-white tracking-tight">{employees.length}</p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard, "hover:scale-[1.02] transition-all duration-300 cursor-pointer")}>
          <div className={clsx(styles.kpiIcon, styles.iconGreen)}>
            <UserCheck size={28} />
          </div>
          <div>
            <p className="premium-label mb-1">Active Staff</p>
            <p className="text-2xl font-normal text-white tracking-tight">
              {employees.filter(e => e.status === 'Active').length}
            </p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard, "hover:scale-[1.02] transition-all duration-300 cursor-pointer")}>
          <div className={clsx(styles.kpiIcon, styles.iconPurple)}>
            <Briefcase size={28} />
          </div>
          <div>
            <p className="premium-label mb-1">Monthly Payroll</p>
            <p className="text-2xl font-normal text-white tracking-tight">
              {formatCurrency(employees.reduce((acc, e) => acc + e.basicSalary + e.housingAllowance + e.transportAllowance + e.otherAllowances, 0))}
            </p>
          </div>
        </div>

        <div className={clsx('glass-panel', styles.kpiCard, "hover:scale-[1.02] transition-all duration-300 cursor-pointer")}>
          <div className={clsx(styles.kpiIcon, styles.iconOrange)}>
            <CreditCard size={28} />
          </div>
          <div>
            <p className="premium-label mb-1">WPS Compliance</p>
            <p className="text-2xl font-normal text-orange-400 tracking-tight">Pending</p>
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
        {!isLoaded ? (
          <div className="text-center py-20 text-muted">Loading records...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 text-muted">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="premium-label cursor-pointer hover:text-white transition-colors select-none">Employee <SortIcon field="name" /></th>
                  <th onClick={() => handleSort('iqamaNo')} className="premium-label cursor-pointer hover:text-white transition-colors select-none">Iqama No. <SortIcon field="iqamaNo" /></th>
                  <th onClick={() => handleSort('jobTitle')} className="premium-label cursor-pointer hover:text-white transition-colors select-none">Job Title <SortIcon field="jobTitle" /></th>
                  <th onClick={() => handleSort('basicSalary')} className="premium-label cursor-pointer hover:text-white transition-colors select-none">Basic Salary <SortIcon field="basicSalary" /></th>
                  <th onClick={() => handleSort('allowances')} className="premium-label cursor-pointer hover:text-white transition-colors select-none">Allowances <SortIcon field="allowances" /></th>
                  <th onClick={() => handleSort('netPay')} className="premium-label cursor-pointer hover:text-white transition-colors select-none">Net Pay <SortIcon field="netPay" /></th>
                  <th onClick={() => handleSort('status')} className="premium-label cursor-pointer hover:text-white transition-colors select-none">Status <SortIcon field="status" /></th>
                  <th className="premium-label text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className={styles.employeeName}>
                        <span>{emp.name}</span>
                        <span>{emp.nameAr}</span>
                      </div>
                    </td>
                    <td className="font-mono text-white/70">{emp.iqamaNo}</td>
                    <td className="text-white/70">{emp.jobTitle}</td>
                    <td className="font-mono text-emerald-400">{formatCurrency(emp.basicSalary)}</td>
                    <td className="font-mono text-blue-400">{formatCurrency(emp.housingAllowance + emp.transportAllowance + emp.otherAllowances)}</td>
                    <td className="font-mono font-normal text-white">{formatCurrency(emp.basicSalary + emp.housingAllowance + emp.transportAllowance + emp.otherAllowances)}</td>
                    <td>
                      <span className={clsx(
                        "inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest min-w-[90px] h-6 border rounded-lg px-2 text-center",
                        emp.status === 'Active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        emp.status === 'On Leave' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className={clsx(styles.actions, "justify-end")}>
                        <button className={styles.actionBtn} onClick={() => handleOpenEdit(emp)}>
                          <Pencil size={16} />
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button 
                            className={clsx(styles.actionBtn, styles.deleteBtn)} 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this employee?')) {
                                deleteEmployee(emp.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={clsx('glass-panel', styles.modalContent)} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h3 className="text-xl font-medium text-white">
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
