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

export interface CompanySettings {
  name: string;
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
    egsSerialNumber?: string;
    commonName?: string;
    csr?: string;
    privateKey?: string;
    certificate?: string;
    secret?: string;
  };
}

export interface InventoryItem {
  id: string;
  description: string;
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
  salesStatus?: 'PO pending' | 'PO recieved';
  workStatus?: 'Work pending' | 'Work On going' | 'Work Done';
  poNumber?: string;
  ticketNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: number;
  paymentStatus?: 'Payment Pending' | 'Done';
  projectName?: string;
  
  // ZATCA Phase 2 Fields
  uuid?: string; // 128-bit unique ID
  icv?: number; // Invoice Counter Value
  pih?: string; // Previous Invoice Hash (Base64)
  invoiceHash?: string; // Current Invoice Hash (Base64)
  zatcaStatus?: 'cleared' | 'reported' | 'failed' | 'pending';
  qrCode?: string; // Base64 TLV string
  paymentMethod?: string; // e.g. "Bank Transfer" or "Cash"
  termsAndConditions?: string;
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

export interface AppState {
  clients: Client[];
  inventory: InventoryItem[];
  quotations: Quotation[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  employees: Employee[];
  payroll: PayrollRecord[];
  fixedAssets: FixedAsset[]; // New for Fixed Asset Module
  defaultNotes?: string;
  settings: CompanySettings;
}
