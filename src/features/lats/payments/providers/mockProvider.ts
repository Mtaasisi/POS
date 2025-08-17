import type { OrderData, OrderResult, PaymentProvider, StatusOrder, StatusResult, PaymentCredentials } from '../types';

export class MockProvider implements PaymentProvider {
  id = 'mock' as const;

  async createOrder(data: OrderData, credentials?: PaymentCredentials): Promise<OrderResult> {
    const orderId = data.orderId ?? `mock_${Date.now()}`;
    return {
      success: true,
      orderId,
      message: 'Mock order created',
      raw: { status: 'success', order_id: orderId },
    };
  }

  async checkStatus(orderId: string, credentials?: PaymentCredentials): Promise<StatusResult> {
    const orders: StatusOrder[] = [
      { order_id: orderId, payment_status: 'PENDING', amount: 1000 },
    ];
    return {
      success: true,
      result: 'SUCCESS',
      orders,
      count: orders.length,
      message: 'Mock status response',
      raw: { success: true, orders },
    };
  }
}


