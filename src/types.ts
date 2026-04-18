export type UserRole = 'owner' | 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  gender?: 'male' | 'female';
  firstname?: string;
  lastname?: string;
  phone?: string;
  address?: string;
  photoUrl?: string;
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
      firstname?: string | null;
      lastname?: string | null;
      email: string;
      role: UserRole;
      is_active: boolean;
      gender?: 'male' | 'female';
    };
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface AdminProfileResponse {
  status_code: number;
  message: string;
  data: {
    id: string;
    firstname?: string | null;
    lastname?: string | null;
    gender?: 'male' | 'female' | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    photo_url?: string | null;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface AdminProfileEditPayload {
  fullname: string;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  new_password: string;
}

export interface BasicStatusResponse<T = unknown> {
  status_code: number;
  message: string;
  data: T;
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
