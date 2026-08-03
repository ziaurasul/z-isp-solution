export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo: string | null;
  plan: string;
  trialEndsAt: string | null;
  isActive: boolean;
  trialExpired?: boolean;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  cnic: string | null;
  status: string;
  createdAt: string;
  _count?: { connections: number; payments: number };
}

export interface Vendor {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  service: string | null;
  status: string;
  createdAt: string;
  _count?: { expenses: number };
}

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  salary: number | null;
  status: string;
  createdAt: string;
  _count?: { expenses: number };
}

export interface Connection {
  id: string;
  businessId: string;
  customerId: string;
  packageType: string;
  packageName: string | null;
  speed: string | null;
  monthlyFee: number;
  status: string;
  activatedAt: string;
  expiresAt: string | null;
  createdAt: string;
  customer?: Customer;
}

export interface Invoice {
  id: string;
  businessId: string;
  connectionId: string;
  month: string;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  connection?: Connection & { customer?: Customer };
}

export interface Payment {
  id: string;
  businessId: string;
  customerId: string;
  connectionId: string | null;
  invoiceId: string | null;
  amount: number;
  method: string | null;
  collectedBy: string | null;
  note: string | null;
  createdAt: string;
  customer?: Customer;
  connection?: Connection;
}

export interface Expense {
  id: string;
  businessId: string;
  vendorId: string | null;
  employeeId: string | null;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  vendor?: Vendor;
  employee?: Employee;
}

export interface Notification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  totalCustomers: number;
  activeConnections: number;
  totalMonthlyRevenue: number;
  totalExpensesThisMonth: number;
  totalCollectedThisMonth: number;
  expiringConnectionsCount: number;
  overdueInvoicesCount: number;
  recentPayments: Payment[];
  monthlyRevenueData: { month: string; revenue: number; expenses: number }[];
  connectionsByType: { internet: number; cable: number; iptv: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type Page = 'dashboard' | 'customers' | 'connections' | 'billing' | 'vendors' | 'employees' | 'expenses' | 'notifications' | 'settings';
