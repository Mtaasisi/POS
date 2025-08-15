# ZenoPay Payment Gateway Integration

This integration provides a complete solution for processing mobile money payments in Tanzania using the ZenoPay API.

## 📁 Files Overview

- **`zenopay-config.php`** - Configuration file with API key and settings
- **`zenopay-create-order.php`** - API endpoint to create payment orders
- **`zenopay-check-status.php`** - API endpoint to check payment status
- **`zenopay-webhook.php`** - Webhook handler for payment notifications
- **`zenopay-example.php`** - Example implementation with HTML interface

## 🚀 Quick Start

### 1. Configuration

Your ZenoPay API key is already configured in `zenopay-config.php`:
```php
define('ZP_API_KEY', 'mzhU0r-QaBCW2h1JRsFbOFQ9iU2-Q_bDYty0HT0kZ_bzBys9Ub5HgWCTlYc5QwxkCJJMjVv1yzCLfO3SZQxSZg');
```

### 2. Update Webhook URL

Update the webhook URL in `zenopay-config.php` to your actual domain:
```php
define('ZP_WEBHOOK_URL', 'https://your-domain.com/zenopay-webhook.php');
```

### 3. Test the Integration

Visit `zenopay-example.php` in your browser to test the integration.

## 📋 API Endpoints

### Create Payment Order

**Endpoint:** `zenopay-create-order.php`  
**Method:** POST  
**Content-Type:** application/json

**Request Body:**
```json
{
    "buyer_email": "customer@example.com",
    "buyer_name": "John Doe",
    "buyer_phone": "0744963858",
    "amount": 1000,
    "order_id": "optional_custom_order_id",
    "webhook_url": "optional_custom_webhook",
    "metadata": {
        "product_id": "PROD_001",
        "customer_id": "CUST_001"
    }
}
```

**Response:**
```json
{
    "success": true,
    "order_id": "lats_abc123def456",
    "message": "Request in progress. You will receive a callback shortly",
    "resultcode": "000"
}
```

### Check Payment Status

**Endpoint:** `zenopay-check-status.php`  
**Method:** GET or POST

**GET Request:**
```
zenopay-check-status.php?order_id=lats_abc123def456
```

**POST Request:**
```json
{
    "order_id": "lats_abc123def456"
}
```

**Response:**
```json
{
    "success": true,
    "result": "SUCCESS",
    "orders": [
        {
            "order_id": "lats_abc123def456",
            "payment_status": "COMPLETED",
            "amount": 1000,
            "reference": "1003020496",
            "buyer_email": "customer@example.com",
            "buyer_name": "John Doe",
            "buyer_phone": "0744963858"
        }
    ],
    "count": 1
}
```

## 🔗 Webhook Integration

### Webhook Payload

ZenoPay will send POST requests to your webhook URL with the following payload:

```json
{
    "order_id": "lats_abc123def456",
    "payment_status": "COMPLETED",
    "reference": "1003020496",
    "metadata": {
        "product_id": "PROD_001",
        "customer_id": "CUST_001"
    }
}
```

### Payment Status Values

- `COMPLETED` - Payment was successful
- `FAILED` - Payment failed
- `CANCELLED` - Payment was cancelled
- `PENDING` - Payment is still pending

## 🗄️ Database Integration

### Example Database Schema

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

### Database Functions

Uncomment and modify the database code in `zenopay-webhook.php`:

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

## 🔧 Integration with LATS

### Frontend Integration

Add payment functionality to your LATS React components:

```typescript
// Example: Payment component
const createPayment = async (orderData: PaymentOrderData) => {
    try {
        const response = await fetch('/zenopay-create-order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            // Redirect to payment status page
            return result.order_id;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Payment creation failed:', error);
        throw error;
    }
};

// Example: Check payment status
const checkPaymentStatus = async (orderId: string) => {
    try {
        const response = await fetch(`/zenopay-check-status.php?order_id=${orderId}`);
        const result = await response.json();
        
        if (result.success && result.orders.length > 0) {
            return result.orders[0];
        } else {
            throw new Error(result.error || 'Order not found');
        }
    } catch (error) {
        console.error('Status check failed:', error);
        throw error;
    }
};
```

### POS Integration

Integrate with your LATS POS system:

```typescript
// In your POS store
const processPayment = async (cart: CartItem[], customer: Customer) => {
    const total = calculateTotal(cart);
    
    const orderData = {
        buyer_email: customer.email,
        buyer_name: customer.name,
        buyer_phone: customer.phone,
        amount: total,
        metadata: {
            cart_items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.price
            })),
            customer_id: customer.id,
            pos_session_id: sessionId
        }
    };
    
    const orderId = await createPayment(orderData);
    
    // Store order ID for status checking
    setCurrentOrderId(orderId);
    
    // Start polling for status updates
    startStatusPolling(orderId);
};
```

## 📊 Logging and Monitoring

### Log Files

- `logs/zenopay_errors.log` - API errors and exceptions
- `logs/zenopay_webhooks.log` - Raw webhook payloads

### Monitoring

Monitor your payment processing:

```bash
# Check recent errors
tail -f logs/zenopay_errors.log

# Check webhook activity
tail -f logs/zenopay_webhooks.log

# Check for failed payments
grep "FAILED" logs/zenopay_webhooks.log
```

## 🔒 Security Considerations

1. **API Key Protection**: Keep your API key secure and never expose it in client-side code
2. **Webhook Validation**: Always validate the API key in webhook requests
3. **HTTPS**: Use HTTPS for all payment-related endpoints
4. **Input Validation**: Validate all input data before processing
5. **Error Handling**: Implement proper error handling and logging

## 🧪 Testing

### Test with Small Amounts

Always test with small amounts first:
- Use amounts like 100 TZS for testing
- Verify webhook delivery
- Check database updates
- Test error scenarios

### Test Scenarios

1. **Successful Payment**: Complete payment flow
2. **Failed Payment**: Test with invalid phone numbers
3. **Cancelled Payment**: Test cancellation flow
4. **Webhook Delivery**: Verify webhook notifications
5. **Status Checking**: Test status polling

## 📞 Support

For ZenoPay API support:
- **Email:** support@zenoapi.com
- **Website:** https://zenoapi.com
- **Documentation:** Check the [ZenoPay PHP repository](https://github.com/ZenoPay/zenopay-php.git)

## 🔄 Updates and Maintenance

1. **Regular Monitoring**: Check logs regularly for errors
2. **API Updates**: Stay updated with ZenoPay API changes
3. **Security Updates**: Keep PHP and dependencies updated
4. **Backup**: Regularly backup payment logs and database

---

**Built for LATS - Simplifying Digital Payments in Tanzania 🇹🇿**
