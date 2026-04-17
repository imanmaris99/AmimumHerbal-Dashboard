export type UserRole = 'owner' | 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginResponse {
  status_code: number;
  message: string;
  data: {
    access_token: {
      access_token: string;
      token_type: string;
      exp: string;
    };
    user: {
      id: string;
      email: string;
      role: UserRole;
      is_active: boolean;
    };
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: 'settlement' | 'pending' | 'deny' | 'expire' | 'cancel';
  method: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  paidOrders: number;
  pendingPayments: number;
  grossRevenue: number;
  revenueByDay: Array<{ date: string; value: number }>;
  ordersByStatus: Array<{ name: string; value: number }>;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  customer: 'Customer',
};

export const INTERNAL_ALLOWED_ROLES: UserRole[] = ['owner', 'admin'];
