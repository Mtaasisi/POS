import { PaymentProvider, OrderData, OrderResult, StatusResult, PaymentCredentials } from '../types';
import { BEEM_CONFIG } from '../config/beem';

export class BeemPaymentProvider implements PaymentProvider {
  id = 'beem' as const;
  
  private baseUrl = BEEM_CONFIG.API_BASE_URL;
  private credentials: PaymentCredentials;

  constructor(credentials?: PaymentCredentials) {
    this.credentials = credentials || {
      apiKey: '6d829f20896bd90e',
      secretKey: 'NTg0ZjY5Mzc3MGFkMjU5Y2M2ZjY2NjFlNGEzNGRiZjZlNDQ5ZTlkM2YzNmEyMzE0ZmI3YzFjM2ZhYmMxYjk0Yw=='
    };
  }

  async createOrder(data: OrderData, credentials?: PaymentCredentials): Promise<OrderResult> {
    try {
      const creds = credentials || this.credentials;
      const { apiKey, secretKey } = creds;

      if (!apiKey || !secretKey) {
        return {
          success: false,
          message: 'Beem Africa API credentials not configured'
        };
      }

      // Use our backend API to avoid CORS issues
      const response = await fetch('/api/beem-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'createOrder',
          data: {
            amount: data.amount,
            currency: data.currency || 'TZS',
            reference: data.orderId,
            customerEmail: data.buyerEmail,
            customerName: data.buyerName,
            customerPhone: data.buyerPhone,
            description: `Order ${data.orderId}`,
            metadata: data.metadata
          }
        })
      });

      const result = await response.json();
      console.log('🔍 Beem API Result (via backend):', result);

      if (response.ok && result.success) {
        return {
          success: true,
          orderId: data.orderId,
          message: 'Checkout session created successfully',
          raw: result
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to create checkout session',
          raw: result
        };
      }
    } catch (error) {
      console.error('❌ Beem API Error:', error);
      
      return {
        success: false,
        message: `Error creating Beem Africa checkout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        raw: error
      };
    }
  }

  async checkStatus(orderId: string, credentials?: PaymentCredentials): Promise<StatusResult> {
    try {
      const creds = credentials || this.credentials;
      const { apiKey, secretKey } = creds;

      if (!apiKey || !secretKey) {
        return {
          success: false,
          message: 'Beem Africa API credentials not configured'
        };
      }

      // Use our backend API to avoid CORS issues
      const response = await fetch('/api/beem-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'checkStatus',
          data: { orderId }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          result: result.result,
          orders: result.orders,
          count: result.count,
          raw: result
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to check payment status',
          raw: result
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error checking Beem Africa status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        raw: error
      };
    }
  }

  private mapBeemStatus(beemStatus: string): string {
    switch (beemStatus) {
      case 'completed':
        return 'SUCCESS';
      case 'pending':
        return 'PENDING';
      case 'failed':
        return 'FAILED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'UNKNOWN';
    }
  }

  // Method to redirect to Beem Africa checkout
  redirectToCheckout(checkoutUrl: string): void {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  }

  // Method to handle webhook verification
  verifyWebhook(payload: any, signature: string, secretKey: string): boolean {
    // Implement webhook signature verification
    // This is a placeholder - implement according to Beem Africa's webhook verification docs
    return true;
  }
}
