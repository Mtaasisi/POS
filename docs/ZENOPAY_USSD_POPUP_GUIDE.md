# ZenoPay USSD Popup Integration Guide

## Overview

This guide explains how to use the ZenoPay USSD popup functionality in the LATS POS system. The USSD popup allows customers to receive a payment prompt directly on their mobile device when using ZenoPay as a payment method.

## Features

- **USSD Popup Trigger**: Sends a USSD popup to customer's mobile device
- **Real-time Status Tracking**: Monitors payment status with automatic polling
- **Debug Logging**: Comprehensive logging for troubleshooting
- **Timeout Handling**: Automatic timeout after 5 minutes
- **Retry Functionality**: Ability to resend USSD popup if needed

## How It Works

1. **Customer Selection**: Customer must be selected in POS with a valid phone number
2. **Payment Method**: Select "ZenoPay USSD" as payment method
3. **USSD Trigger**: System automatically triggers USSD popup on customer's phone
4. **Status Monitoring**: System polls for payment status every 5 seconds
5. **Completion**: Sale completes automatically when payment is confirmed

## Implementation Details

### Configuration Files

- `src/features/lats/config/zenopay.ts` - Main configuration and USSD service
- `src/features/lats/components/pos/ZenoPayPaymentModal.tsx` - Payment modal with USSD functionality
- `src/features/lats/pages/POSPage.tsx` - POS page integration

### Key Components

#### 1. USSD Configuration (`zenopay.ts`)

```typescript
export const USSD_CONFIG = {
  POPUP_TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 10000, // 10 seconds
  DEBUG: {
    ENABLED: true,
    LOG_PREFIX: '[ZenoPay USSD]'
  }
};
```

#### 2. USSD Service Class

```typescript
export class UssdPopupService {
  static async triggerUssdPopup(phoneNumber, amount, orderId, customerName)
  static async checkUssdStatus(orderId)
  static async pollUssdStatus(orderId, onStatusUpdate)
}
```

### API Endpoints

The system expects these PHP endpoints to be available:

- `zenopay-trigger-ussd.php` - Triggers USSD popup
- `zenopay-ussd-popup.php` - Checks USSD status

## Usage Instructions

### For Cashiers

1. **Add Items to Cart**: Select products and add them to the cart
2. **Select Customer**: Choose a customer with a valid phone number
3. **Proceed to Payment**: Click "Proceed" button
4. **Choose Payment Method**: Select "ZenoPay USSD"
5. **Confirm Payment**: Click "Pay with USSD Popup"
6. **Wait for Customer**: Customer receives USSD popup on their phone
7. **Monitor Status**: System shows real-time payment status
8. **Complete Sale**: Sale completes automatically when payment is confirmed

### For Developers

#### Testing USSD Functionality

1. **Test Button**: Use the "Test USSD" button in POS quick actions
2. **Console Logs**: Check browser console for detailed debug logs
3. **Server Logs**: Check PHP server logs for backend debugging

#### Debug Information

The system provides comprehensive debug logging:

```javascript
// Console logs with prefix [ZenoPay USSD]
console.log('[ZenoPay USSD] Triggering USSD popup for customer:', {
  phone: customer.phone,
  amount: total,
  orderId,
  customerName: customer.name
});
```

#### Status Tracking

USSD status progression:
- `idle` → `triggering` → `sent` → `pending` → `completed`/`failed`/`cancelled`

## Server-Side Implementation

### PHP Test Script

The `scripts/zenopay-ussd-test.php` file provides a test implementation:

```php
// Handle USSD trigger
function handleUssdTrigger($data) {
    // Validate phone number, amount, order ID
    // Simulate USSD popup trigger
    // Store session data
    // Return success response
}

// Handle status check
function handleUssdStatus($data) {
    // Load session data
    // Simulate status progression
    // Return current status
}
```

### Required Server Setup

1. **PHP Server**: Ensure PHP server is running on `localhost:8000`
2. **File Permissions**: Ensure write permissions for log files
3. **CORS Headers**: Configure CORS for cross-origin requests

## Error Handling

### Common Issues

1. **No Customer Selected**
   - Error: "ZenoPay USSD popup requires customer phone number"
   - Solution: Select a customer with a valid phone number

2. **Invalid Phone Number**
   - Error: "Customer phone number is required for USSD popup"
   - Solution: Update customer information with valid phone number

3. **Network Error**
   - Error: "Failed to send USSD popup"
   - Solution: Check server connectivity and try again

4. **Timeout**
   - Error: "USSD popup timeout"
   - Solution: Resend USSD popup or try alternative payment method

### Debug Troubleshooting

1. **Check Console Logs**: Look for `[ZenoPay USSD]` prefixed logs
2. **Check Server Logs**: Review PHP error logs
3. **Test Connection**: Use "Test USSD" button to verify functionality
4. **Check Network**: Ensure server endpoints are accessible

## Configuration Options

### Timeout Settings

```typescript
POPUP_TIMEOUT: 300000, // 5 minutes
RETRY_ATTEMPTS: 3,
RETRY_DELAY: 10000, // 10 seconds
```

### Debug Settings

```typescript
DEBUG: {
  ENABLED: true, // Set to false in production
  LOG_PREFIX: '[ZenoPay USSD]',
  LOG_LEVELS: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug'
  }
}
```

## Production Deployment

### Security Considerations

1. **API Keys**: Store ZenoPay API keys securely
2. **HTTPS**: Use HTTPS for all API communications
3. **Validation**: Validate all input data
4. **Rate Limiting**: Implement rate limiting for USSD requests

### Performance Optimization

1. **Connection Pooling**: Reuse HTTP connections
2. **Caching**: Cache frequently accessed data
3. **Async Processing**: Use async/await for non-blocking operations
4. **Error Recovery**: Implement retry mechanisms

## Testing

### Manual Testing

1. **Select Customer**: Choose customer with valid phone number
2. **Add Items**: Add products to cart
3. **Test Payment**: Use "Test USSD" button
4. **Monitor Logs**: Check console and server logs
5. **Verify Status**: Confirm status progression works correctly

### Automated Testing

```javascript
// Example test case
describe('ZenoPay USSD Popup', () => {
  it('should trigger USSD popup successfully', async () => {
    const result = await UssdPopupService.triggerUssdPopup(
      '+254700123456',
      1000,
      'TEST-ORDER-123',
      'Test Customer'
    );
    expect(result.success).toBe(true);
  });
});
```

## Support

For technical support or questions about the USSD popup functionality:

1. **Check Logs**: Review console and server logs first
2. **Test Functionality**: Use the built-in test features
3. **Documentation**: Refer to this guide and code comments
4. **Development Team**: Contact the development team for complex issues

## Changelog

### Version 1.0.0
- Initial USSD popup implementation
- Real-time status tracking
- Debug logging system
- Test functionality
- PHP server-side simulation
