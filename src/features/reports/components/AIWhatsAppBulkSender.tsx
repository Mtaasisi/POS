import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassInput from '../../../features/shared/components/ui/EnhancedInput';
import { MessageSquare, Send, Users, Brain } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AIWhatsAppBulkSenderProps {
  customers?: any[];
  onSend?: (data: any) => void;
}

const AIWhatsAppBulkSender: React.FC<AIWhatsAppBulkSenderProps> = ({ 
  customers = [], 
  onSend 
}) => {
  const [message, setMessage] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }

    setIsLoading(true);
    try {
      // Placeholder for WhatsApp sending logic
      toast.success(`Message sent to ${selectedCustomers.length} customers`);
      if (onSend) {
        onSend({ message, customers: selectedCustomers });
      }
    } catch (error) {
      toast.error('Failed to send messages');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">AI WhatsApp Bulk Sender</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <GlassInput
            as="textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your WhatsApp message..."
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Customers ({selectedCustomers.length} selected)
          </label>
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
            {customers.map((customer) => (
              <label key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedCustomers.includes(customer.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCustomers([...selectedCustomers, customer.id]);
                    } else {
                      setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">
                  {customer.name} - {customer.phone}
                </span>
              </label>
            ))}
          </div>
        </div>

        <GlassButton
          onClick={handleSend}
          disabled={isLoading || !message.trim() || selectedCustomers.length === 0}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {isLoading ? 'Sending...' : `Send to ${selectedCustomers.length} customers`}
        </GlassButton>
      </div>
    </GlassCard>
  );
};

export default AIWhatsAppBulkSender;
