import React, { useState } from 'react';
import { X, MessageCircle, Phone, Mail, Send, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  LoyaltyCustomer 
} from '../../../../lib/customerLoyaltyService';
import { whatsappService } from '../../../../services/whatsappService';
import { smsService } from '../../../../services/smsService';
import { toast } from 'react-hot-toast';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LoyaltyCustomer | null;
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({ 
  isOpen, 
  onClose, 
  customer 
}) => {
  const [communicationType, setCommunicationType] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Predefined message templates
  const messageTemplates = {
    welcome: {
      whatsapp: "🎉 Welcome to our loyalty program! You've earned {points} points on your first purchase. Thank you for choosing us!",
      sms: "Welcome to our loyalty program! You've earned {points} points. Thank you for choosing us!",
      email: "Welcome to our loyalty program! You've earned {points} points on your first purchase. We're excited to have you as a valued customer."
    },
    pointsUpdate: {
      whatsapp: "⭐ Great news! You've earned {points} points on your recent purchase. Your total balance is now {totalPoints} points.",
      sms: "You've earned {points} points! Total balance: {totalPoints} points.",
      email: "Great news! You've earned {points} points on your recent purchase. Your total balance is now {totalPoints} points."
    },
    tierUpgrade: {
      whatsapp: "👑 Congratulations! You've been upgraded to {tier} tier! Enjoy exclusive benefits and rewards.",
      sms: "Congratulations! You've been upgraded to {tier} tier!",
      email: "Congratulations! You've been upgraded to {tier} tier! Enjoy exclusive benefits and rewards."
    },
    rewardAvailable: {
      whatsapp: "🎁 You have {points} points available for redemption! Visit us to claim your rewards.",
      sms: "You have {points} points available for redemption!",
      email: "You have {points} points available for redemption! Visit us to claim your rewards."
    },
    custom: {
      whatsapp: "",
      sms: "",
      email: ""
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey !== 'custom') {
      const template = messageTemplates[templateKey as keyof typeof messageTemplates];
      let templateMessage = template[communicationType];
      
      // Replace placeholders with actual values
      if (customer) {
        templateMessage = templateMessage
          .replace('{points}', '100')
          .replace('{totalPoints}', customer.points.toString())
          .replace('{tier}', customer.tier);
      }
      
      setMessage(templateMessage);
    } else {
      setMessage('');
    }
  };

  const handleSendMessage = async () => {
    if (!customer || !message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSending(true);
      
      let success = false;
      
      switch (communicationType) {
        case 'whatsapp':
          success = await whatsappService.sendMessage(customer.phone, message);
          break;
        case 'sms':
          success = await smsService.sendSMS(customer.phone, message);
          break;
        case 'email':
          if (customer.email) {
            // Email service would be implemented here
            success = true; // Placeholder
          } else {
            toast.error('Customer has no email address');
            return;
          }
          break;
      }

      if (success) {
        toast.success(`Message sent via ${communicationType.toUpperCase()}`);
        setMessage('');
        setSelectedTemplate('');
        onClose();
      } else {
        toast.error(`Failed to send ${communicationType.toUpperCase()} message`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageCircle className="w-5 h-5" />;
      case 'sms': return <Phone className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getCommunicationColor = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'bg-green-500 hover:bg-green-600';
      case 'sms': return 'bg-blue-500 hover:bg-blue-600';
      case 'email': return 'bg-purple-500 hover:bg-purple-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Send Message</h2>
                <p className="text-sm text-gray-600">Contact {customer.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Customer Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-600">{customer.phone}</p>
                {customer.email && (
                  <p className="text-sm text-gray-600">{customer.email}</p>
                )}
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  customer.tier === 'VIP' ? 'bg-purple-100 text-purple-800' :
                  customer.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                  customer.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {customer.tier}
                </span>
                <p className="text-sm text-gray-600 mt-1">{customer.points} points</p>
              </div>
            </div>
          </div>

          {/* Communication Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Communication Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['whatsapp', 'sms', 'email'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setCommunicationType(type)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-colors ${
                    communicationType === type
                      ? `${getCommunicationColor(type)} text-white border-transparent`
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {getCommunicationIcon(type)}
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Templates */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Message Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(messageTemplates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleTemplateSelect(key)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === key
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {template[communicationType].substring(0, 50)}...
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {message.length} characters
              </span>
              {communicationType === 'sms' && (
                <span className="text-xs text-gray-500">
                  {Math.ceil(message.length / 160)} SMS
                </span>
              )}
            </div>
          </div>

          {/* Send Button */}
          <div className="flex gap-3">
            <GlassButton
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              className={`flex-1 ${getCommunicationColor(communicationType)}`}
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send {communicationType.toUpperCase()}
            </GlassButton>
          </div>

          {/* Communication Tips */}
          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Communication Tips</h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Keep messages personal and relevant to the customer</li>
                  <li>• Include their name and loyalty tier when appropriate</li>
                  <li>• Use emojis for WhatsApp messages to make them more engaging</li>
                  <li>• Keep SMS messages under 160 characters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CommunicationModal;
