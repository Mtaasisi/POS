# Beem Africa Payment Integration

This document explains how to integrate Beem Africa's payment checkout system with the LATS CHANCE app.

## Overview

Beem Africa is a payment gateway that provides:
- Mobile money payments (M-Pesa, Airtel Money, etc.)
- Card payments
- Bank transfers
- USSD payments
- SMS services

## Setup Instructions

### 1. Beem Africa Account Setup

1. Sign up for a Beem Africa account at [beem.africa](https://beem.africa)
2. Complete account verification
3. Get your API credentials:
   - API Key
   - Secret Key
   - Webhook Secret (optional)

### 2. Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
NEXT_PUBLIC_BEEM_API_KEY=6d829f20896bd90e
NEXT_PUBLIC_BEEM_SECRET_KEY=NTg0ZjY5Mzc3MGFkMjU5Y2M2ZjY2NjFlNGEzNGRiZjZlNDQ5ZTlkM2YzNmEyMzE0ZmI3YzFjM2ZhYmMxYjk0Yw==
BEEM_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note**: The API credentials are already configured in the code for testing purposes.

### 3. Database Setup

The integration uses existing payment tables. Ensure you have the following tables:
- `payment_transactions`
- `payment_webhooks`
- `pos_sales`

### 4. API Endpoints

#### Webhook Endpoint
- **URL**: `POST /api/beem-webhook`
- **Purpose**: Handle payment notifications from Beem Africa
- **Authentication**: Webhook signature verification (to be implemented)

#### Payment Status Check
- **URL**: `GET /api/payments/beem/status/:orderId`
- **Purpose**: Check payment status for a specific order

## Integration Components

### 1. Payment Provider (`src/features/lats/payments/providers/beem.ts`)

The `BeemPaymentProvider` class handles:
- Creating checkout sessions
- Checking payment status
- Webhook verification
- Status mapping

### 2. Checkout Button Component (`src/features/lats/payments/components/BeemCheckoutButton.tsx`)

React component that:
- Validates order data
- Creates checkout sessions
- Redirects to Beem Africa checkout
- Handles loading states and errors

### 3. Configuration (`src/features/lats/payments/config/beem.ts`)

Contains:
- API configuration
- Supported currencies
- Error messages
- UI branding

## Usage Examples

### Basic Checkout Button

```tsx
import { BeemCheckoutButton } from '@/features/lats/payments/components/BeemCheckoutButton';

const orderData = {
  orderId: 'order_123',
  amount: 50000, // Amount in cents
  currency: 'TZS',
  buyerEmail: 'customer@example.com',
  buyerName: 'John Doe',
  buyerPhone: '+255123456789'
};

<BeemCheckoutButton
  orderData={orderData}
  onSuccess={(result) => console.log('Checkout created:', result)}
  onError={(error) => console.error('Checkout error:', error)}
/>
```

### Programmatic Payment Creation

```tsx
import { BeemPaymentProvider } from '@/features/lats/payments/providers/beem';

const beemProvider = new BeemPaymentProvider({
  apiKey: 'your_api_key',
  secretKey: 'your_secret_key'
});

const result = await beemProvider.createOrder(orderData);
if (result.success) {
  // Redirect to checkout
  beemProvider.redirectToCheckout(result.raw.data.checkout_url);
}
```

## Payment Flow

1. **Customer initiates payment** → Checkout button clicked
2. **Create checkout session** → API call to Beem Africa
3. **Redirect to checkout** → Customer redirected to Beem Africa hosted page
4. **Customer completes payment** → Payment processed on Beem Africa
5. **Webhook notification** → Beem Africa sends payment status
6. **Update order status** → Order marked as paid in database
7. **Redirect back** → Customer redirected to success/cancel page

## Supported Features

### Payment Methods
- M-Pesa (Tanzania, Kenya)
- Airtel Money
- Tigo Pesa
- Card payments
- Bank transfers

### Currencies
- TZS (Tanzanian Shilling)
- KES (Kenyan Shilling)
- UGX (Ugandan Shilling)
- USD (US Dollar)

### Webhook Events
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `payment.cancelled` - Payment cancelled
- `payment.pending` - Payment pending

## Error Handling

### Common Errors
- **Invalid credentials** - Check API key and secret
- **Invalid amount** - Amount must be greater than 0
- **Unsupported currency** - Use supported currencies only
- **Network errors** - Check internet connection
- **Timeout errors** - Payment session expired

### Error Recovery
- Retry failed payments
- Check payment status manually
- Contact customer support if needed

## Security Considerations

### Webhook Security
- Implement signature verification
- Validate webhook payload
- Use HTTPS for all communications
- Store webhook secret securely

### API Security
- Keep API credentials secure
- Use environment variables
- Rotate credentials regularly
- Monitor API usage

## Testing

### Test Page
Navigate to `/lats/beem-test` in your app to access the Beem Africa test page.

### Test Script
Run the test script to verify the integration:
```bash
node scripts/test-beem-integration.js
```

### Test Mode
Beem Africa provides test credentials for development:
- Test API Key: `6d829f20896bd90e`
- Test Secret Key: `NTg0ZjY5Mzc3MGFkMjU5Y2M2ZjY2NjFlNGEzNGRiZjZlNDQ5ZTlkM2YzNmEyMzE0ZmI3YzFjM2ZhYmMxYjk0Yw==`
- Test webhook endpoints

### Test Scenarios
1. Successful payment
2. Failed payment
3. Cancelled payment
4. Network timeout
5. Invalid credentials

## Troubleshooting

### Payment Not Processing
1. Check API credentials
2. Verify webhook URL is accessible
3. Check payment amount and currency
4. Review server logs

### Webhook Not Receiving
1. Verify webhook URL is correct
2. Check server is accessible
3. Review webhook signature
4. Check database connection

### Checkout Not Loading
1. Check API credentials
2. Verify order data is valid
3. Check network connection
4. Review browser console errors

## Support

For Beem Africa support:
- Documentation: [docs.beem.africa](https://docs.beem.africa)
- API Reference: [docs.beem.africa/payments-checkout](https://docs.beem.africa/payments-checkout/index.html)
- Support Email: support@beem.africa

## Changelog

### v1.0.0
- Initial Beem Africa integration
- Checkout button component
- Webhook handler
- Payment provider implementation
- Configuration and documentation
