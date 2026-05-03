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
}

export interface AppState {
  clients: Client[];
  inventory: InventoryItem[];
  quotations: Quotation[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  defaultNotes?: string;
  settings: CompanySettings;
}
