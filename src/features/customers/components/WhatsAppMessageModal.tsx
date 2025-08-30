import React, { useState, useEffect } from 'react';
import { Customer } from '../../../types';
import { whatsappService } from '../../../services/whatsappService';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { MessageSquare, Send, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WhatsAppMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onMessageSent?: () => void;
}

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  isOpen,
  onClose,
  customer,
  onMessageSent
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<{
    authorized: boolean;
    state: string;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Check WhatsApp instance status on mount
  useEffect(() => {
    if (isOpen) {
      checkInstanceStatus();
    }
  }, [isOpen]);

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

  const handleSendMessage = async () => {
    if (!customer?.phone || !message.trim()) {
      toast.error('Please enter a message and ensure customer has a phone number');
      return;
    }

    setSending(true);
    try {
      const result = await whatsappService.sendWhatsAppMessage(
        customer.phone,
        message.trim(),
        customer.id
      );

      if (result.success) {
        toast.success('WhatsApp message sent successfully!');
        setMessage('');
        onMessageSent?.();
        onClose();
      } else {
        toast.error(`Failed to send message: ${result.error}`);
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      toast.error('Failed to send WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSending(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Send WhatsApp Message
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">To:</p>
              <p className="font-medium text-gray-800">{customer.name}</p>
              <p className="text-sm text-gray-600">{customer.phone}</p>
            </div>
          )}

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
              onClick={handleSendMessage}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={sending || !message.trim() || !instanceStatus?.authorized}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
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
        </div>
      </GlassCard>
    </div>
  );
};

export default WhatsAppMessageModal;
