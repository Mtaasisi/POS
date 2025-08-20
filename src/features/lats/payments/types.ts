// Shared payment types and provider interface

export type ProviderId = 'zenopay' | 'paypal' | 'stripe' | 'flutterwave' | 'beem' | 'mock';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

export interface OrderData {
  orderId?: string;
  amount: number;
  currency?: string;
  buyerEmail?: string;
  buyerName?: string;
  buyerPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  message?: string | null;
  raw?: unknown;
}

export interface StatusOrder {
  order_id: string;
  payment_status: PaymentStatus | string;
  amount?: number | string;
  reference?: string | null;
  buyer_email?: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface StatusResult {
  success: boolean;
  result?: 'SUCCESS' | 'FAIL' | string;
  orders?: StatusOrder[];
  count?: number;
  message?: string | null;
  raw?: unknown;
}

export interface WebhookResult {
  success: boolean;
  orderId?: string;
  status?: PaymentStatus;
  message?: string | null;
  raw?: unknown;
}

export interface PaymentCredentials {
  apiKey?: string;
  secretKey?: string;
  baseUrl?: string;
  webhookUrl?: string;
}

export interface PaymentProvider {
  id: ProviderId;
  createOrder(data: OrderData, credentials?: PaymentCredentials): Promise<OrderResult>;
  checkStatus(orderId: string, credentials?: PaymentCredentials): Promise<StatusResult>;
}

// Payment Tracking Types
export interface PaymentTransaction {
  id: string;
  order_id: string;
  provider: ProviderId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  sale_id?: string;
  pos_session_id?: string;
}

export interface PaymentWebhook {
  id: string;
  transaction_id: string;
  provider: ProviderId;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at?: string;
  created_at: string;
}

export interface PaymentAnalytics {
  id: string;
  date: string;
  provider: ProviderId;
  total_transactions: number;
  total_amount: number;
  successful_transactions: number;
  failed_transactions: number;
  pending_transactions: number;
  average_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  averageAmount: number;
  todayTransactions: number;
  todayAmount: number;
  pendingTransactions: number;
  failedTransactions: number;
}


