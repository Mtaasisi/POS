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

      // Create checkout session with Beem Africa
      const checkoutData = {
        amount: data.amount,
        currency: data.currency || 'TZS',
        reference: data.orderId,
        customer_email: data.buyerEmail,
        customer_name: data.buyerName,
        customer_phone: data.buyerPhone,
        description: `Order ${data.orderId}`,
        callback_url: creds.webhookUrl || `${window.location.origin}/api/beem-webhook`,
        return_url: `${window.location.origin}/payments/success`,
        cancel_url: `${window.location.origin}/payments/cancel`,
        metadata: data.metadata
      };

      console.log('🔍 Beem API Request:', {
        url: `${this.baseUrl}/v1/checkout/sessions`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Secret-Key': secretKey
        },
        body: checkoutData
      });

      const response = await fetch(`${this.baseUrl}/v1/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Secret-Key': secretKey
        },
        body: JSON.stringify(checkoutData)
      });

      console.log('🔍 Beem API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const result = await response.json();
      console.log('🔍 Beem API Result:', result);

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
      
      // If it's a network error (like DNS resolution), provide a helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Beem Africa API is currently unavailable. Please check your internet connection or try again later.',
          raw: error
        };
      }
      
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

      const response = await fetch(`${this.baseUrl}/v1/checkout/sessions/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Secret-Key': secretKey
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          result: result.data.status === 'completed' ? 'SUCCESS' : 'FAIL',
          orders: [{
            order_id: orderId,
            payment_status: this.mapBeemStatus(result.data.status),
            amount: result.data.amount,
            reference: result.data.reference,
            buyer_email: result.data.customer_email,
            buyer_name: result.data.customer_name,
            buyer_phone: result.data.customer_phone,
            created_at: result.data.created_at,
            updated_at: result.data.updated_at,
            metadata: result.data.metadata
          }],
          count: 1,
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
