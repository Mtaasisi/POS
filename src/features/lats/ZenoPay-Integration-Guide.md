# ZenoPay Integration Guide for LATS

This guide explains how to use the ZenoPay mobile money payment integration in your LATS application.

## 🚀 Quick Start

### 1. Backend Setup

The PHP backend files are already created in your project root:

- `zenopay-config.php` - Configuration with your API key
- `zenopay-create-order.php` - Create payment orders
- `zenopay-check-status.php` - Check payment status
- `zenopay-webhook.php` - Handle payment notifications

### 2. Frontend Components

The React components are integrated into your LATS application:

- `ZenoPayPaymentModal.tsx` - Payment modal for mobile money
- `ZenoPayPaymentButton.tsx` - Payment button component
- `useZenoPay.ts` - Custom hook for payment operations
- `ZenoPayTestPage.tsx` - Test page for development

## 📋 Usage Examples

### Basic Payment Button

```tsx
import ZenoPayPaymentButton from '../components/pos/ZenoPayPaymentButton';

const MyComponent = () => {
  const handlePaymentComplete = (sale: Sale) => {
    console.log('Payment completed:', sale);
    // Handle successful payment
  };

  return (
    <ZenoPayPaymentButton
      cartItems={cartItems}
      total={total}
      customer={{
        id: 'customer_1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0744963858'
      }}
      onPaymentComplete={handlePaymentComplete}
    />
  );
};
```

### Using the Custom Hook

```tsx
import { useZenoPay } from '../hooks/useZenoPay';

const MyComponent = () => {
  const {
    isLoading,
    error,
    currentOrder,
    createOrder,
    checkOrderStatus,
    processPayment
  } = useZenoPay();

  const handlePayment = async () => {
    const customer = {
      id: 'customer_1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '0744963858'
    };

    const sale = await processPayment(cartItems, total, customer);
    if (sale) {
      console.log('Payment successful:', sale);
    }
  };

  return (
    <button onClick={handlePayment} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Pay with Mobile Money'}
    </button>
  );
};
```

### Payment Modal

```tsx
import ZenoPayPaymentModal from '../components/pos/ZenoPayPaymentModal';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Open Payment Modal
      </button>

      <ZenoPayPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPaymentComplete={(sale) => {
          console.log('Payment completed:', sale);
          setIsModalOpen(false);
        }}
        cartItems={cartItems}
        total={total}
        customer={customer}
      />
    </>
  );
};
```

## 🔧 Integration with Existing POS

The ZenoPay integration is already added to your existing POS components:

### EnhancedPOSComponent

The `EnhancedPOSComponent` now includes:

1. **Customer Email Field** - Required for mobile money payments
2. **ZenoPay Payment Button** - Primary payment option
3. **Payment Completion Handler** - Processes successful payments

### PaymentSection

The `PaymentSection` component includes ZenoPay as a payment method option.

## 🧪 Testing

### Test Page

Visit the test page to verify the integration:

```tsx
// Add to your routing
import ZenoPayTestPage from '../pages/ZenoPayTestPage';

// In your router
<Route path="/zenopay-test" element={<ZenoPayTestPage />} />
```

### Testing Steps

1. **Create Order**: Test order creation with small amounts
2. **Check Status**: Verify status checking functionality
3. **Complete Payment**: Test full payment flow
4. **Monitor Logs**: Check `/logs` directory for errors

## 📊 Database Integration

### Required Tables

Create these tables for full integration:

```sql
-- Orders table
CREATE TABLE zenopay_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20) NOT NULL,
    amount INT NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    payment_reference VARCHAR(255),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payment logs table
CREATE TABLE zenopay_payment_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    payload JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Webhook Integration

Update the webhook handler in `zenopay-webhook.php`:

```php
function processSuccessfulPayment($orderId, $reference, $metadata) {
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=your_db", "username", "password");
        
        // Update order status
        $stmt = $pdo->prepare("
            UPDATE zenopay_orders 
            SET payment_status = 'COMPLETED', 
                payment_reference = ?, 
                updated_at = NOW() 
            WHERE order_id = ?
        ");
        $stmt->execute([$reference, $orderId]);
        
        // Log payment
        $stmt = $pdo->prepare("
            INSERT INTO zenopay_payment_logs (order_id, status, reference, payload)
            VALUES (?, 'COMPLETED', ?, ?)
        ");
        $stmt->execute([$orderId, $reference, json_encode($metadata)]);
        
    } catch (PDOException $e) {
        zp_log_error("Database error: " . $e->getMessage());
    }
}
```

## 🔒 Security Considerations

1. **API Key Protection**: Never expose the API key in client-side code
2. **Input Validation**: Always validate customer data
3. **HTTPS**: Use HTTPS for all payment endpoints
4. **Webhook Validation**: Verify API key in webhook requests
5. **Error Handling**: Implement proper error handling and logging

## 📱 Customer Experience

### Payment Flow

1. **Customer enters details** (name, email, phone)
2. **Clicks "Pay with Mobile Money"**
3. **Payment order created** via ZenoPay API
4. **Customer receives payment prompt** on their phone
5. **Customer completes payment** on their device
6. **Payment status updates** automatically
7. **Sale completes** and receipt generated

### User Interface

- **Clear payment instructions** for customers
- **Real-time status updates** during payment
- **Error handling** with helpful messages
- **Success confirmation** with sale details

## 🚨 Troubleshooting

### Common Issues

1. **"Customer information required"**
   - Ensure customer has email and phone number
   - Validate phone number format (Tanzanian)

2. **"Payment order creation failed"**
   - Check API key configuration
   - Verify network connectivity
   - Check server logs

3. **"Payment timeout"**
   - Customer didn't complete payment within 10 minutes
   - Check customer's phone for payment prompt
   - Retry with smaller amount

4. **"Webhook not received"**
   - Verify webhook URL configuration
   - Check server accessibility
   - Monitor webhook logs

### Debug Steps

1. **Check PHP logs**: `/logs/zenopay_errors.log`
2. **Check webhook logs**: `/logs/zenopay_webhooks.log`
3. **Test with small amounts**: Start with 100 TZS
4. **Verify API key**: Test with curl commands
5. **Check network**: Ensure server can reach ZenoPay API

## 📞 Support

For ZenoPay API support:
- **Email:** support@zenoapi.com
- **Website:** https://zenoapi.com
- **Documentation:** [ZenoPay PHP Repository](https://github.com/ZenoPay/zenopay-php.git)

For LATS integration support:
- Check the test page for functionality
- Review error logs for debugging
- Test with the provided examples

---

**Built for LATS - Simplifying Digital Payments in Tanzania 🇹🇿**

