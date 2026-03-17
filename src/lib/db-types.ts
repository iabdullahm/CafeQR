export type Role = 'SUPER_ADMIN' | 'CAFE_ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  cafeId?: string;
}

export interface Cafe {
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'suspended';
  subscriptionId: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxBranches: number;
    maxTables: number;
    maxProducts: number;
  };
}

export interface Branch {
  id: string;
  cafeId: string;
  name: string;
  address: string;
}

export interface Table {
  id: string;
  branchId: string;
  cafeId: string;
  number: string;
}

export interface Category {
  id: string;
  cafeId: string;
  name: string;
}

export interface Product {
  id: string;
  cafeId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine-in' | 'car-order';

export interface Order {
  id: string;
  cafeId: string;
  branchId: string;
  tableId: string;
  type: OrderType;
  carNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  customerPhone?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  loyaltyPoints: number;
}
