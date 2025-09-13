import React, { useState, useEffect } from 'react';
import { Customer } from '../../../types';
import { whatsappService } from '../../../services/whatsappService';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { MessageSquare, Send, AlertCircle, CheckCircle, XCircle, Loader2, Users, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BulkWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  onMessagesSent?: () => void;
}

const BulkWhatsAppModal: React.FC<BulkWhatsAppModalProps> = ({
  isOpen,
  onClose,
  selectedCustomers,
  onMessagesSent
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [instanceStatus, setInstanceStatus] = useState<{
    authorized: boolean;
    state: string;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Filter customers with phone numbers
  const customersWithPhone = selectedCustomers.filter(customer => customer.phone);

  useEffect(() => {
    if (isOpen) {
      checkInstanceStatus();
      setProgress({ sent: 0, failed: 0, total: customersWithPhone.length });
    }
  }, [isOpen, customersWithPhone.length]);

  const checkInstanceStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await whatsappService.checkInstanceStatus();
      setInstanceStatus(status);
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error);
      setInstanceStatus({ authorized: false, state: 'error' });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSendBulkMessages = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (customersWithPhone.length === 0) {
      toast.error('No customers with phone numbers selected');
      return;
    }

    setSending(true);
    setProgress({ sent: 0, failed: 0, total: customersWithPhone.length });

    try {
      const phoneNumbers = customersWithPhone.map(c => c.phone);
      const customerIds = customersWithPhone.map(c => c.id);

      const result = await whatsappService.sendBulkWhatsApp({
        phoneNumbers,
        message: message.trim(),
        customerIds
      });

      if (result.success) {
        toast.success(`Successfully sent ${result.sent} WhatsApp messages!`);
        setMessage('');
        onMessagesSent?.();
        onClose();
      } else {
        toast.error(`Sent ${result.sent} messages, failed ${result.failed}. Check console for details.`);
        console.error('Bulk WhatsApp errors:', result.errors);
      }
    } catch (error) {
      console.error('Bulk WhatsApp send error:', error);
      toast.error('Failed to send bulk WhatsApp messages');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSending(false);
    setProgress({ sent: 0, failed: 0, total: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Bulk WhatsApp Messages
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {customersWithPhone.length} customers selected
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {selectedCustomers.length - customersWithPhone.length} customers without phone numbers will be skipped
            </p>
          </div>

          {/* WhatsApp Status */}
          <div className="mb-4">
            {loadingStatus ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking WhatsApp status...
              </div>
            ) : instanceStatus ? (
              <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                instanceStatus.authorized 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {instanceStatus.authorized ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                WhatsApp: {instanceStatus.authorized ? 'Connected' : 'Not Connected'}
              </div>
            ) : null}
          </div>

          {/* Message Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your WhatsApp message here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
              disabled={sending || !instanceStatus?.authorized}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Progress Indicator */}
          {sending && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
                <span>Sending messages...</span>
                <span>{progress.sent + progress.failed}/{progress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-blue-600 mt-1">
                <span>Sent: {progress.sent}</span>
                <span>Failed: {progress.failed}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <GlassButton
              onClick={handleClose}
              variant="secondary"
              className="flex-1"
              disabled={sending}
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleSendBulkMessages}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={sending || !message.trim() || !instanceStatus?.authorized || customersWithPhone.length === 0}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {customersWithPhone.length} Customers
                </>
              )}
            </GlassButton>
          </div>

          {/* Help Text */}
          {!instanceStatus?.authorized && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                WhatsApp is not connected. Please check your GreenAPI configuration.
              </p>
            </div>
          )}

          {customersWithPhone.length === 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                No customers with phone numbers selected. Please select customers with valid phone numbers.
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default BulkWhatsAppModal;
