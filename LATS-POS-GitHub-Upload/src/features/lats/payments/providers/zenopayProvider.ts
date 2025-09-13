import { ZENOPAY_CONFIG } from '../../config/zenopay';
import type { OrderData, OrderResult, PaymentProvider, StatusResult } from '../types';

export class ZenoPayProvider implements PaymentProvider {
  id = 'zenopay' as const;

  async createOrder(data: OrderData, credentials?: { apiKey?: string; baseUrl?: string; webhookUrl?: string }): Promise<OrderResult> {
    const payload = {
      order_id: data.orderId ?? `lats_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      buyer_email: data.buyerEmail,
      buyer_name: data.buyerName,
      buyer_phone: data.buyerPhone,
      amount: data.amount,
      metadata: data.metadata ?? {},
      ...(credentials?.webhookUrl ? { webhook_url: credentials.webhookUrl } : {}),
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (credentials?.apiKey) headers['X-ZP-API-KEY'] = credentials.apiKey;
    // Use correct default base URL if not provided
    const baseUrl = credentials?.baseUrl || 'https://zenoapi.com/api/payments';
    headers['X-ZP-BASE-URL'] = baseUrl;

    const res = await fetch(ZENOPAY_CONFIG.getCreateOrderUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    const success = res.ok && (json?.status === 'success' || json?.success === true);
    return {
      success,
      orderId: json?.order_id,
      message: json?.message ?? null,
      raw: json,
    };
  }

  async checkStatus(orderId: string, credentials?: { apiKey?: string; baseUrl?: string; webhookUrl?: string }): Promise<StatusResult> {
    const url = ZENOPAY_CONFIG.getCheckStatusUrl(orderId);
    const headers: Record<string, string> = {};
    if (credentials?.apiKey) headers['X-ZP-API-KEY'] = credentials.apiKey;
    // Use correct default base URL if not provided
    const baseUrl = credentials?.baseUrl || 'https://zenoapi.com/api/payments';
    headers['X-ZP-BASE-URL'] = baseUrl;

    const res = await fetch(url, { headers });
    const json = await res.json().catch(() => ({}));
    const success = res.ok && (json?.success === true);
    return {
      success,
      result: json?.result,
      orders: json?.orders,
      count: json?.count,
      message: json?.message ?? json?.error ?? null,
      raw: json,
    };
  }
}


