import React, { useState } from 'react';
import { MessageSquare, Send, Phone, Smartphone, Loader2, Gift, X } from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Customer } from '../../../types';
import { toast } from 'react-hot-toast';

interface BirthdayMessageSenderProps {
  todaysBirthdays: Customer[];
  onClose?: () => void;
}

const BirthdayMessageSender: React.FC<BirthdayMessageSenderProps> = ({
  todaysBirthdays,
  onClose
}) => {
  const [sending, setSending] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'sms' | 'whatsapp'>('whatsapp');

  const defaultMessages = {
    sms: "Happy Birthday! 🎉 Thank you for choosing our services. We hope your special day is filled with joy! - LATS Team",
    whatsapp: "🎉 *Happy Birthday!* 🎉\n\nDear {name},\n\nWishing you a fantastic birthday filled with joy and happiness! Thank you for being a valued customer.\n\nMay your day be as special as you are! 🎂✨\n\nBest regards,\nLATS Team"
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === todaysBirthdays.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(todaysBirthdays.map(c => c.id));
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const sendBirthdayMessages = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }

    setSending(true);
    try {
      const selectedCustomersData = todaysBirthdays.filter(c => 
        selectedCustomers.includes(c.id)
      );

      // Simulate sending messages
      for (const customer of selectedCustomersData) {
        const message = defaultMessages[messageType].replace('{name}', customer.name);
        
        if (messageType === 'whatsapp' && customer.whatsapp) {
          // Send WhatsApp message
          console.log(`Sending WhatsApp to ${customer.whatsapp}: ${message}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        } else if (messageType === 'sms' && customer.phone) {
          // Send SMS
          console.log(`Sending SMS to ${customer.phone}: ${message}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        }
      }

      toast.success(`Birthday messages sent to ${selectedCustomersData.length} customer(s)!`);
      setSelectedCustomers([]);
    } catch (error) {
      toast.error('Failed to send birthday messages');
      console.error('Error sending birthday messages:', error);
    } finally {
      setSending(false);
    }
  };

  if (todaysBirthdays.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-600" />
              Send Birthday Messages
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Message Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Message Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="messageType"
                  value="whatsapp"
                  checked={messageType === 'whatsapp'}
                  onChange={(e) => setMessageType(e.target.value as 'whatsapp')}
                  className="text-pink-600"
                />
                <Smartphone className="w-4 h-4 text-green-600" />
                <span className="text-sm">WhatsApp</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="messageType"
                  value="sms"
                  checked={messageType === 'sms'}
                  onChange={(e) => setMessageType(e.target.value as 'sms')}
                  className="text-pink-600"
                />
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm">SMS</span>
              </label>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Customers ({selectedCustomers.length}/{todaysBirthdays.length})
              </label>
              <button
                onClick={handleSelectAll}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                {selectedCustomers.length === todaysBirthdays.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {todaysBirthdays.map((customer) => (
                <label
                  key={customer.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => handleSelectCustomer(customer.id)}
                    className="text-pink-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{customer.name}</span>
                      {customer.loyaltyLevel && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.loyaltyLevel === 'platinum' ? 'bg-purple-100 text-purple-700' :
                          customer.loyaltyLevel === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                          customer.loyaltyLevel === 'silver' ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {customer.loyaltyLevel}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {messageType === 'whatsapp' ? customer.whatsapp || 'No WhatsApp' : customer.phone}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Preview
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              {defaultMessages[messageType].replace('{name}', 'Customer Name')}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {onClose && (
              <GlassButton
                onClick={onClose}
                variant="outline"
                disabled={sending}
              >
                Cancel
              </GlassButton>
            )}
            <GlassButton
              onClick={sendBirthdayMessages}
              disabled={selectedCustomers.length === 0 || sending}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Messages ({selectedCustomers.length})
                </>
              )}
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default BirthdayMessageSender;
