export interface Address {
  buildingNumber: string; // 4 digits
  streetName: string;
  district: string;
  city: string;
  postalCode: string; // 5 digits
  countryCode: string; // "SA"
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string; // Legacy field
  splitAddress?: Address;
  vatNumber?: string;
  otherId?: string; // CR Number, National ID, or GCC ID
  createdAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  splitAddress?: Address;
  vatNumber?: string;
  otherId?: string;
  createdAt: number;
}

export interface CompanySettings {
  name: string;
  nameAr?: string;
  address: string; // Legacy field
  splitAddress?: Address;
  vatNumber: string;
  crNumber?: string;
  contact: string;
  salesPerson: string;
  logo?: string;
  defaultNotes?: string;
  zatca?: {
    onboarded: boolean;
    mode?: 'sandbox' | 'simulation' | 'production';
    egsSerialNumber?: string;
    commonName?: string;
    csr?: string;
    privateKey?: string;
    certificate?: string;
    secret?: string;
    complianceCertificate?: string;
    complianceApiSecret?: string;
    productionCertificate?: string;
    productionApiSecret?: string;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  unit: string;
  price: number;
  imageUrl?: string;
  category?: string;
  createdAt: number;
}

export interface QuotationItem {
  id: string;
  itemId: string;
  description: string;
  descriptionAr?: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  vatAmount: number;
  totalWithVat: number;
}

export interface Quotation {
  id: string;
  number: string;
  clientId: string;
  date: number;
  dueDate: number;
  items: QuotationItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discount: number;
  total: number;
  grandTotal: number;
  notes?: string;
  revision: number;
  status: 'sent' | 'waiting' | 'approved' | 'rejected' | 'revised';
  receivedAmount?: number;
  salesStatus?: 'PO pending' | 'PO recieved' | 'open';
  workStatus?: 'Work pending' | 'Work On going' | 'Work Done' | 'not_started' | 'in_progress' | 'completed';
  poNumber?: string;
  ticketNumber?: string;
  subject?: string;
  subjectAr?: string;
  invoiceNumber?: string;
  invoiceDate?: number;
  paymentStatus?: 'Payment Pending' | 'Done' | 'unpaid' | 'partial' | 'paid';
  projectName?: string;
  approvalDate?: number;
  poDate?: number;
  quotationRef?: string;
  completionDate?: number;
  paymentDate?: number;
  
  // ZATCA Phase 2 Fields
  uuid?: string; // 128-bit unique ID
  icv?: number; // Invoice Counter Value
  pih?: string; // Previous Invoice Hash (Base64)
  invoiceHash?: string; // Current Invoice Hash (Base64)
  zatcaStatus?: 'cleared' | 'reported' | 'failed' | 'pending' | 'pending_clearance' | 'pending_reporting';
  qrCode?: string; // Base64 TLV string
  paymentMethod?: string; // e.g. "Bank Transfer" or "Cash"
  supplyDate?: number;
  termsAndConditions?: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  itemId: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  vatAmount: number;
  totalWithVat: number;
}

export interface PurchaseInvoice {
  id: string;
  number: string;
  supplierId: string;
  date: number;
  dueDate: number;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  status: 'draft' | 'submitted' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  receivedAmount?: number; // amount paid to supplier
  paymentDate?: number;
  projectId?: string; // optional tagging to a project
  notes?: string;
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  code: string;
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: number;
  description: string;
  lines: JournalLine[];
  reference?: string;
  reconciled?: boolean; // New for Bank Reconciliation
  bankRef?: string;    // New for Bank Reconciliation
  projectId?: string;  // Project Tagging
}

export interface Employee {
  id: string;
  name: string;
  nameAr?: string;
  iqamaNo: string;
  gosiNo?: string;
  iban: string;
  jobTitle: string;
  jobTitleAr?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  joinDate: number;
  status: 'Active' | 'On Leave' | 'Terminated';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  gosiDeduction: number;
  netSalary: number;
  status: 'Draft' | 'Processed' | 'Paid';
  paymentDate?: number;
  reference?: string; // SIF reference
}

export interface FixedAsset {
  id: string;
  name: string;
  purchaseDate: number;
  cost: number;
  salvageValue: number;
  usefulLife: number; // in years
  depreciationMethod: 'Straight Line';
  category: 'Equipment' | 'Vehicles' | 'Furniture' | 'Building' | 'IT';
  status: 'Active' | 'Disposed';
  accountId: string; // The asset account in Chart of Accounts
  accumulatedDepreciationAccountId: string; // The contra-asset account
  depreciationExpenseAccountId: string; // The expense account
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  clientId: string;
  amountReceived: number;
  paymentDate: number;
  paymentMethod: string;
  bankReference?: string;
  allocations: { invoiceId: string; amount: number }[];
  notes?: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  description: string;
  employeeId: string;
  productId: string;
  unitAmount: number;
  quantity: number;
  totalAmount: number;
  vatAmount: number;
  date: number;
  status: 'draft' | 'reported' | 'approved' | 'done' | 'refused';
  receiptUrl?: string;
  erpnextName?: string;
  attachmentId?: number;
  projectId?: string;  // Project Tagging
}

export interface ExpenseProduct {
  id: string;
  name: string;
  price: number;
}

export type UserRole = 'admin' | 'user';

export interface User {
  username: string;
  role: UserRole;
  name: string;
}

export type GlobalDateFilter = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface AppState {
  clients: Client[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  quotations: Quotation[];
  invoices: Quotation[];
  purchaseInvoices: PurchaseInvoice[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  employees: Employee[];
  payroll: PayrollRecord[];
  fixedAssets: FixedAsset[];
  paymentReceipts: PaymentReceipt[];
  expenses: Expense[];
  expenseProducts: ExpenseProduct[];
  defaultNotes?: string;
  settings: CompanySettings;
  currentUser?: User;
  dateFilter: GlobalDateFilter;
}
