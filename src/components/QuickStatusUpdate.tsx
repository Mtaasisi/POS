import React, { useState } from 'react';
import { Send, MessageSquare, Clock, CheckCircle, AlertTriangle, PackageCheck, Wrench, TestTube } from 'lucide-react';
import { DeviceStatus, Device } from '../types';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface QuickStatusUpdateProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (newStatus: DeviceStatus) => void;
}

interface StatusTemplate {
  id: string;
  status: DeviceStatus;
  title: string;
  message: string;
  icon: React.ReactNode;
  color: string;
  autoUpdate: boolean;
}

const QuickStatusUpdate: React.FC<QuickStatusUpdateProps> = ({
  device,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<StatusTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendSMS, setSendSMS] = useState(true);

  const statusTemplates: StatusTemplate[] = [
    {
      id: 'diagnosis-started',
      status: 'diagnosis-started',
      title: 'Diagnosis Started',
      message: `🔧 Your ${device.brand} ${device.model} is now under diagnosis. We're identifying the issue and will update you soon.`,
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-blue-500',
      autoUpdate: true
    },
    {
      id: 'awaiting-parts',
      status: 'awaiting-parts',
      title: 'Awaiting Parts',
      message: `📦 Parts needed for your ${device.brand} ${device.model} have been ordered. We'll notify you when they arrive.`,
      icon: <PackageCheck className="h-5 w-5" />,
      color: 'bg-yellow-500',
      autoUpdate: true
    },
    {
      id: 'in-repair',
      status: 'in-repair',
      title: 'Repair in Progress',
      message: `🔧 Your ${device.brand} ${device.model} is being repaired. We're working on it and will keep you updated.`,
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-purple-500',
      autoUpdate: true
    },
    {
      id: 'reassembled-testing',
      status: 'reassembled-testing',
      title: 'Testing Phase',
      message: `🧪 Your ${device.brand} ${device.model} is now being tested to ensure everything works perfectly.`,
      icon: <TestTube className="h-5 w-5" />,
      color: 'bg-cyan-500',
      autoUpdate: true
    },
    {
      id: 'repair-complete',
      status: 'repair-complete',
      title: 'Repair Complete',
      message: `✅ Your ${device.brand} ${device.model} repair is complete! Your device is ready for pickup.`,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-green-500',
      autoUpdate: true
    },
    {
      id: 'custom',
      status: device.status,
      title: 'Custom Update',
      message: '',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'bg-gray-500',
      autoUpdate: false
    }
  ];

  const handleTemplateSelect = (template: StatusTemplate) => {
    setSelectedTemplate(template);
    if (template.id === 'custom') {
      setCustomMessage('');
    } else {
      setCustomMessage(template.message);
    }
  };

  const handleSendUpdate = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      // Update device status if auto-update is enabled
      if (selectedTemplate.autoUpdate && selectedTemplate.status !== device.status) {
        const { error: statusError } = await supabase
          .from('devices')
          .update({ 
            status: selectedTemplate.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', device.id);

        if (statusError) throw statusError;
        onStatusUpdate(selectedTemplate.status);
      }

      // Save status update to device history
      const messageToSend = selectedTemplate.id === 'custom' ? customMessage : selectedTemplate.message;
      
      const { error: historyError } = await supabase
        .from('device_status_updates')
        .insert({
          device_id: device.id,
          status: selectedTemplate.status,
          message: messageToSend,
          sent_by: 'technician',
          sent_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      // Send SMS if enabled
      if (sendSMS && device.phoneNumber) {
        try {
          const { error: smsError } = await supabase
            .from('sms_logs')
            .insert({
              phone_number: device.phoneNumber,
              message: messageToSend,
              status: 'sent',
              device_id: device.id,
              sent_at: new Date().toISOString()
            });

          if (smsError) {
            console.warn('SMS logging failed:', smsError);
          }
        } catch (smsError) {
          console.warn('SMS sending failed:', smsError);
        }
      }

      toast.success('Status update sent successfully');
      onClose();
    } catch (error) {
      console.error('Error sending status update:', error);
      toast.error('Failed to send status update');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'diagnosis-started': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'awaiting-parts': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in-repair': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'reassembled-testing': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'repair-complete': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Quick Status Update</h2>
              <p className="text-blue-100">{device.brand} {device.model} - {device.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(device.status)}`}>
              <Clock className="h-4 w-4" />
              Current Status: {device.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </div>

        {/* Template Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Update Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {statusTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`p-4 border rounded-lg text-left transition-all duration-200 ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${template.color} text-white`}>
                    {template.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.title}</h4>
                    {template.autoUpdate && (
                      <span className="text-xs text-blue-600 font-medium">Auto-updates status</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Message Preview */}
          {selectedTemplate && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Message Preview</h3>
              {selectedTemplate.id === 'custom' ? (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your custom message..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                />
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-700">{selectedTemplate.message}</p>
                </div>
              )}
            </div>
          )}

          {/* SMS Toggle */}
          {device.phoneNumber && (
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Send SMS to {device.phoneNumber}
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendUpdate}
              disabled={loading || !selectedTemplate || (selectedTemplate.id === 'custom' && !customMessage.trim())}
              className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? 'Sending...' : 'Send Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatusUpdate; 