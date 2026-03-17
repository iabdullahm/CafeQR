/**
 * @fileOverview Application-wide database types aligned with the SQL schema.
 */

export type UserStatus = 'active' | 'suspended' | 'pending';
export type CafeStatus = 'active' | 'trial' | 'expired' | 'suspended' | 'pending' | 'archived';
export type BranchStatus = 'active' | 'inactive' | 'suspended';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended';
export type PaymentStatus = 'paid' | 'unpaid' | 'pending' | 'overdue' | 'refunded';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'car' | 'pickup';
export type OrderSource = 'qr' | 'cashier' | 'admin';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface User {
  id: string; // BIGSERIAL
  uuid: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  module: string;
}

export interface Cafe {
  id: string;
  uuid: string;
  cafe_code: string;
  name: string;
  slug: string;
  logo?: string;
  owner_user_id?: string;
  city: string;
  status: CafeStatus;
  currency: string;
  joined_at?: string;
  created_at: string;
}

export interface Plan {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  monthly_price: number;
  yearly_price: number;
  max_branches: number;
  max_tables: number;
  max_products: number;
  is_popular: boolean;
  status: 'active' | 'inactive';
}

export interface Subscription {
  id: string;
  uuid: string;
  cafe_id: string;
  plan_id: string;
  subscription_type: 'monthly' | 'yearly' | 'trial' | 'custom';
  start_date: string;
  end_date: string;
  amount: number;
  total_amount: number;
  status: SubscriptionStatus;
  payment_status: PaymentStatus;
  auto_renew: boolean;
}

export interface Order {
  id: string;
  uuid: string;
  cafe_id: string;
  branch_id?: string;
  order_number: string;
  order_type: OrderType;
  source: OrderSource;
  total_amount: number;
  status: OrderStatus;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  placed_at: string;
}

export interface SupportTicket {
  id: string;
  uuid: string;
  cafe_id: string;
  ticket_number: string;
  subject: string;
  priority: Priority;
  status: TicketStatus;
  created_at: string;
}
