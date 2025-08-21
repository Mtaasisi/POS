import React, { useState } from 'react';
import { whatsappMessageService } from '../lib/whatsappMessageService';

/**
 * WhatsApp Integration Examples
 * 
 * This file shows practical examples of how to integrate WhatsApp messaging
 * into different parts of your LATS application.
 */

// Example 1: Customer Welcome Message Component
export const CustomerWelcomeMessage: React.FC<{ customer: any }> = ({ customer }) => {
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string>('');

  const sendWelcomeMessage = async () => {
    setIsSending(true);
    setStatus('');

    try {
      const message = `🎉 Welcome to LATS, ${customer.name}!

Thank you for choosing our services. We're excited to have you on board!

Your customer ID: ${customer.id}
Registration date: ${new Date(customer.created_at).toLocaleDateString()}

If you have any questions, feel free to reach out to us.

Best regards,
The LATS Team 🚀`;

      const response = await whatsappMessageService.sendTextMessage(
        customer.phone,
        message
      );

      if (response.status === 'sent') {
        setStatus('✅ Welcome message sent successfully!');
      } else {
        setStatus(`❌ Failed: ${response.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/30">
      <h3 className="text-lg font-semibold mb-2">Send Welcome Message</h3>
      <p className="text-sm text-gray-600 mb-3">
        Send a welcome message to {customer.name} ({customer.phone})
      </p>
      
      <button
        onClick={sendWelcomeMessage}
        disabled={isSending}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {isSending ? '📤 Sending...' : '📤 Send Welcome Message'}
      </button>
      
      {status && (
        <p className={`mt-2 text-sm ${status.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {status}
        </p>
      )}
    </div>
  );
};

// Example 2: Order Status Notification Component
export const OrderStatusNotification: React.FC<{ order: any }> = ({ order }) => {
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string>('');

  const sendOrderUpdate = async (status: string) => {
    setIsSending(true);
    setStatus('');

    try {
      const statusMessages = {
        'confirmed': '✅ Your order has been confirmed!',
        'processing': '🔄 Your order is being processed...',
        'ready': '🎉 Your order is ready for pickup!',
        'shipped': '📦 Your order has been shipped!',
        'delivered': '🎊 Your order has been delivered!'
      };

      const message = `
${statusMessages[status as keyof typeof statusMessages]}

Order Details:
📋 Order #${order.id}
📅 Date: ${new Date(order.created_at).toLocaleDateString()}
💰 Total: $${order.total}
📍 ${order.shipping_address || 'Pickup location'}

Items:
${order.items.map((item: any) => `• ${item.name} x${item.quantity}`).join('\n')}

Thank you for choosing LATS! 🚀
      `.trim();

      const response = await whatsappMessageService.sendTextMessage(
        order.customer_phone,
        message
      );

      if (response.status === 'sent') {
        setStatus('✅ Order update sent successfully!');
      } else {
        setStatus(`❌ Failed: ${response.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/30">
      <h3 className="text-lg font-semibold mb-2">Order Status Updates</h3>
      <p className="text-sm text-gray-600 mb-3">
        Send status updates for Order #{order.id}
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        {['confirmed', 'processing', 'ready', 'shipped', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => sendOrderUpdate(status)}
            disabled={isSending}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSending ? '📤' : `📤 ${status.charAt(0).toUpperCase() + status.slice(1)}`}
          </button>
        ))}
      </div>
      
      {status && (
        <p className={`mt-2 text-sm ${status.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {status}
        </p>
      )}
    </div>
  );
};

// Example 3: Appointment Reminder Component
export const AppointmentReminder: React.FC<{ appointment: any }> = ({ appointment }) => {
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string>('');

  const sendReminder = async () => {
    setIsSending(true);
    setStatus('');

    try {
      const message = `
⏰ Appointment Reminder

Hi ${appointment.customer_name},

This is a friendly reminder about your upcoming appointment:

📅 Date: ${new Date(appointment.date).toLocaleDateString()}
🕐 Time: ${appointment.time}
📍 Location: ${appointment.location}
👨‍⚕️ Service: ${appointment.service}

Please arrive 10 minutes before your scheduled time.

To reschedule or cancel, please contact us at least 24 hours in advance.

Thank you,
LATS Team 🏥
      `.trim();

      const response = await whatsappMessageService.sendTextMessage(
        appointment.customer_phone,
        message
      );

      if (response.status === 'sent') {
        setStatus('✅ Reminder sent successfully!');
      } else {
        setStatus(`❌ Failed: ${response.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/30">
      <h3 className="text-lg font-semibold mb-2">Send Appointment Reminder</h3>
      <p className="text-sm text-gray-600 mb-3">
        Remind {appointment.customer_name} about their appointment on {new Date(appointment.date).toLocaleDateString()}
      </p>
      
      <button
        onClick={sendReminder}
        disabled={isSending}
        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:bg-gray-400"
      >
        {isSending ? '📤 Sending...' : '⏰ Send Reminder'}
      </button>
      
      {status && (
        <p className={`mt-2 text-sm ${status.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {status}
        </p>
      )}
    </div>
  );
};

// Example 4: Bulk Message Sender Component
export const BulkMessageSender: React.FC = () => {
  const [customers, setCustomers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const sendBulkMessage = async () => {
    if (!customers.length || !message.trim()) {
      alert('Please add customers and enter a message');
      return;
    }

    setIsSending(true);
    setResults([]);

    const results = [];
    
    for (const phoneNumber of customers) {
      try {
        const response = await whatsappMessageService.sendTextMessage(phoneNumber, message);
        results.push({ phoneNumber, response });
        
        // Wait 1 second between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({ 
          phoneNumber, 
          response: { 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } 
        });
      }
    }

    setResults(results);
    setIsSending(false);
  };

  const addCustomer = () => {
    const phone = prompt('Enter phone number:');
    if (phone) {
      setCustomers([...customers, phone]);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/30">
      <h3 className="text-lg font-semibold mb-2">Bulk Message Sender</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customers</label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={addCustomer}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              + Add Customer
            </button>
          </div>
          <div className="space-y-1">
            {customers.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm">{phone}</span>
                <button
                  onClick={() => setCustomers(customers.filter((_, i) => i !== index))}
                  className="text-red-600 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Enter your message..."
          />
        </div>

        <button
          onClick={sendBulkMessage}
          disabled={isSending || !customers.length || !message.trim()}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {isSending ? '📤 Sending...' : '📤 Send Bulk Message'}
        </button>

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Results:</h4>
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="text-sm">
                  <span className={result.response.status === 'sent' ? 'text-green-600' : 'text-red-600'}>
                    {result.phoneNumber}: {result.response.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Example 5: WhatsApp Service Status Component
export const WhatsAppServiceStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);

  const checkStatus = () => {
    const allowedNumbers = whatsappMessageService.getAllowedNumbers();
    const quotaInfo = whatsappMessageService.getQuotaInfo();
    
    setStatus({
      allowedNumbers,
      quotaInfo,
      totalAllowed: allowedNumbers.length
    });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/30">
      <h3 className="text-lg font-semibold mb-2">WhatsApp Service Status</h3>
      
      <button
        onClick={checkStatus}
        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mb-3"
      >
        🔍 Check Status
      </button>

      {status && (
        <div className="space-y-2">
          <p><strong>Allowed Numbers:</strong> {status.totalAllowed}</p>
          <p><strong>Quota Status:</strong> {status.quotaInfo.monthlyLimit}</p>
          <p><strong>Upgrade Required:</strong> {status.quotaInfo.upgradeRequired ? 'Yes' : 'No'}</p>
          
          <div className="mt-2">
            <p className="font-medium">Allowed Numbers:</p>
            <ul className="text-sm text-gray-600">
              {status.allowedNumbers.map((number: string, index: number) => (
                <li key={index}>{number.replace('@c.us', '')}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Example Component
export const WhatsAppIntegrationExample: React.FC = () => {
  // Sample data for examples
  const sampleCustomer = {
    id: 'CUST001',
    name: 'John Doe',
    phone: '255746605561',
    created_at: new Date().toISOString()
  };

  const sampleOrder = {
    id: 'ORD001',
    customer_phone: '255746605561',
    total: 150.00,
    created_at: new Date().toISOString(),
    items: [
      { name: 'Product A', quantity: 2 },
      { name: 'Product B', quantity: 1 }
    ]
  };

  const sampleAppointment = {
    customer_name: 'Jane Smith',
    customer_phone: '255746605561',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    time: '10:00 AM',
    location: 'Main Office',
    service: 'Consultation'
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            📱 WhatsApp Integration Examples
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomerWelcomeMessage customer={sampleCustomer} />
            <OrderStatusNotification order={sampleOrder} />
            <AppointmentReminder appointment={sampleAppointment} />
            <WhatsAppServiceStatus />
          </div>
          
          <div className="mt-8">
            <BulkMessageSender />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppIntegrationExample;
