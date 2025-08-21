# How to Send WhatsApp Messages 📱

Your WhatsApp integration is now fully set up and ready to use! Here are all the different ways you can send messages:

## 🚀 **Method 1: Command Line Scripts (Quick & Easy)**

### Send Test Message
```bash
node scripts/send-test-message.js
```

### Send Custom Message
```bash
node scripts/send-custom-message.js 255746605561 "Hello! This is a custom message from LATS!"
```

### Test Connection
```bash
node scripts/test-whatsapp-connection.js
```

## 📱 **Method 2: From Your LATS Application**

### Using the WhatsApp Message Sender Component

1. **Import the component:**
```tsx
import WhatsAppMessageSender from '../components/WhatsAppMessageSender';
```

2. **Use in your React component:**
```tsx
const MyComponent = () => {
  const handleMessageSent = (response) => {
    console.log('Message sent:', response);
  };

  const handleError = (error) => {
    console.error('Error:', error);
  };

  return (
    <WhatsAppMessageSender 
      onMessageSent={handleMessageSent}
      onError={handleError}
    />
  );
};
```

### Using the WhatsApp Service Directly

1. **Import the service:**
```tsx
import { whatsappMessageService } from '../lib/whatsappMessageService';
```

2. **Send a text message:**
```tsx
const sendMessage = async () => {
  const response = await whatsappMessageService.sendTextMessage(
    '255746605561', 
    'Hello from LATS!'
  );
  
  if (response.status === 'sent') {
    console.log('Message sent successfully!', response.idMessage);
  } else {
    console.error('Failed to send message:', response.error);
  }
};
```

3. **Send a file message:**
```tsx
const sendFile = async () => {
  const response = await whatsappMessageService.sendFileMessage(
    '255746605561',
    'https://example.com/image.jpg',
    'image.jpg',
    'Check out this image!'
  );
  
  if (response.status === 'sent') {
    console.log('File sent successfully!', response.idMessage);
  }
};
```

4. **Send with retry logic:**
```tsx
const sendWithRetry = async () => {
  const request = {
    phoneNumber: '255746605561',
    message: 'Hello from LATS!',
    type: 'text'
  };
  
  const response = await whatsappMessageService.sendMessageWithRetry(request, 3);
  console.log('Result:', response);
};
```

## 🎯 **Method 3: Using the Test Page**

1. **Navigate to the WhatsApp test page** in your application
2. **Use the quick send buttons** to pre-fill allowed numbers
3. **Enter custom messages** and send them
4. **Monitor the response** for delivery status

## 📞 **Allowed Numbers (Current Plan)**

Due to your current Green API plan, you can only send messages to these numbers:

1. `254700000000@c.us`
2. `254712345678@c.us`
3. `255746605561@c.us`

## 🔧 **Code Examples**

### Basic Message Sending
```javascript
import { whatsappMessageService } from '../lib/whatsappMessageService';

// Simple text message
const sendSimpleMessage = async () => {
  const result = await whatsappMessageService.sendTextMessage(
    '255746605561',
    'Hello from LATS application! 🚀'
  );
  
  if (result.status === 'sent') {
    console.log('✅ Message sent! ID:', result.idMessage);
  } else {
    console.log('❌ Failed:', result.error);
  }
};
```

### Batch Message Sending
```javascript
const sendBatchMessages = async (numbers, message) => {
  const results = [];
  
  for (const number of numbers) {
    const result = await whatsappMessageService.sendTextMessage(number, message);
    results.push({ number, result });
    
    // Wait 1 second between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};

// Usage
const numbers = ['255746605561', '254700000000'];
const message = 'Bulk message from LATS!';
const results = await sendBatchMessages(numbers, message);
```

### Error Handling
```javascript
const sendMessageWithErrorHandling = async (phoneNumber, message) => {
  try {
    // Check if number is allowed
    if (!whatsappMessageService.isNumberAllowed(phoneNumber)) {
      console.log('❌ Number not allowed due to quota limits');
      console.log('📞 Allowed numbers:', whatsappMessageService.getAllowedNumbers());
      return;
    }
    
    const response = await whatsappMessageService.sendTextMessage(phoneNumber, message);
    
    if (response.status === 'sent') {
      console.log('✅ Message sent successfully!');
      console.log('📨 Message ID:', response.idMessage);
    } else {
      console.log('❌ Failed to send message:', response.error);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
};
```

## 🎨 **Integration Examples**

### In a Customer Management Component
```tsx
const CustomerMessageButton = ({ customer }) => {
  const [isSending, setIsSending] = useState(false);
  
  const sendWelcomeMessage = async () => {
    setIsSending(true);
    
    try {
      const response = await whatsappMessageService.sendTextMessage(
        customer.phone,
        `Welcome ${customer.name}! Thank you for choosing LATS. 🎉`
      );
      
      if (response.status === 'sent') {
        toast.success('Welcome message sent!');
      } else {
        toast.error('Failed to send message: ' + response.error);
      }
    } catch (error) {
      toast.error('Error sending message');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <button 
      onClick={sendWelcomeMessage}
      disabled={isSending}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      {isSending ? 'Sending...' : 'Send Welcome Message'}
    </button>
  );
};
```

### In an Order Notification System
```tsx
const sendOrderNotification = async (order) => {
  const message = `
🎉 Order Update!

Order #${order.id} is ready for pickup!

Items: ${order.items.map(item => item.name).join(', ')}
Total: $${order.total}

Pickup location: ${order.location}

Thank you for choosing LATS!
  `.trim();
  
  const response = await whatsappMessageService.sendTextMessage(
    order.customerPhone,
    message
  );
  
  return response;
};
```

## 🔍 **Monitoring and Debugging**

### Check Message Status
```javascript
// The service automatically returns message IDs
const response = await whatsappMessageService.sendTextMessage('255746605561', 'Test');
console.log('Message ID:', response.idMessage);
```

### Check Quota Status
```javascript
const quotaInfo = whatsappMessageService.getQuotaInfo();
console.log('Quota info:', quotaInfo);
```

### Check Allowed Numbers
```javascript
const allowedNumbers = whatsappMessageService.getAllowedNumbers();
console.log('Allowed numbers:', allowedNumbers);
```

## 🚀 **Next Steps**

1. **Test with the provided scripts** to ensure everything works
2. **Integrate into your LATS application** using the components and services
3. **Upgrade your Green API plan** to send to any number
4. **Set up webhooks** for receiving incoming messages
5. **Add message templates** for common communications

## 💡 **Tips**

- **Always check if a number is allowed** before sending
- **Use retry logic** for important messages
- **Handle errors gracefully** in your UI
- **Monitor message delivery** using the response IDs
- **Respect rate limits** by adding delays between messages

Your WhatsApp integration is ready to use! 🎉
