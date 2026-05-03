export type ExpenseCategory = 'Water' | 'Electricity' | 'Salary' | 'Maintenance' | 'Fuel' | 'Packaging' | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: any;
  description: string;
  recordedBy: string;
  createdAt: any;
  updatedAt: any;
}

export type CoffeeQuality = 'Grade A' | 'Grade B' | 'Grade C';
export type CoffeeType = 'Robusta' | 'Arabica';
export type ProcessingStatus = 'Intake' | 'Sorting' | 'Batching' | 'Hulling' | 'Washing' | 'Drying' | 'Ready';

export type PaymentMethod = 'MTN Mobile Money' | 'Airtel Money' | 'Cash' | 'Bank Transfer';
export type Gender = 'Male' | 'Female' | 'Other';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface Farmer {
  id: string;
  farmerId: string; // Human readable ID like RF-001
  name: string;
  gender: Gender;
  contact: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  paymentPreference?: PaymentMethod;
  mobileMoneyNumber?: string;
  bankDetails?: BankDetails;
  createdAt: any;
}

export interface Buyer {
  id: string;
  name: string;
  type: 'Local' | 'Exporter';
  contact: string;
  address: string;
  createdAt: any;
}

export type ExportStatus = 'Pending Shipment' | 'In Transit' | 'Delivered';

export interface ExportDetails {
  destinationCountry: string;
  portOfOrigin: string;
  shippingLine: string;
  containerNumber: string;
  phytosanitaryCert: boolean;
  certificateOfOrigin: boolean;
  billOfLadingRef?: string;
  exportStatus?: ExportStatus;
}

export interface Sale {
  id: string;
  batchId: string;
  buyerId: string;
  saleDate: any;
  weight: number;
  pricePerKg: number;
  totalAmount: number;
  type: 'Local' | 'Export';
  status: 'Pending' | 'Completed' | 'Shipped';
  exportDetails?: ExportDetails;
  createdAt: any;
}

export interface BatchHistoryEntry {
  status: ProcessingStatus;
  timestamp: any;
  updatedBy?: string;
  notes?: string;
}

export interface Batch {
  id: string;
  farmerId: string;
  weight: number;
  quality: CoffeeQuality;
  type: CoffeeType;
  status: ProcessingStatus;
  pricePerKg: number;
  totalPrice: number;
  paymentStatus: 'Pending' | 'Paid';
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  storageTemperature?: number;
  storageLocation?: string;
  history: BatchHistoryEntry[];
  createdAt: any;
  updatedAt: any;
}

export interface PriceConfig {
  id: string;
  type: CoffeeType;
  pricePerKg: number;
  lastUpdated: any;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  name?: string;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  createdAt: any;
}
