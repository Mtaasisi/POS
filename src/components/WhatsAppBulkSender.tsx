import React, { useState, useRef } from 'react';
import { whatsappMessageService } from '../lib/whatsappMessageService';
import { WHATSAPP_CREDENTIALS } from '../config/whatsappCredentials';

interface BulkMessage {
  phoneNumber: string;
  message: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  messageId?: string;
  error?: string;
  sentAt?: Date;
}

interface BulkSenderProps {
  onComplete?: (results: BulkMessage[]) => void;
  onProgress?: (completed: number, total: number) => void;
}

export const WhatsAppBulkSender: React.FC<BulkSenderProps> = ({
  onComplete,
  onProgress
}) => {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<BulkMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [delayBetweenMessages, setDelayBetweenMessages] = useState(1000); // 1 second
  const [useTemplates, setUseTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Predefined message templates
  const messageTemplates = [
    {
      id: 'welcome',
      name: 'Welcome Message',
      template: '🎉 Welcome to LATS!\n\nHi {{name}},\n\nThank you for choosing our services. We\'re excited to have you on board!\n\nYour customer ID: {{customerId}}\nRegistration date: {{date}}\n\nIf you have any questions, feel free to reach out to us.\n\nBest regards,\nThe LATS Team 🚀'
    },
    {
      id: 'order_update',
      name: 'Order Update',
      template: '📦 Order Update\n\nHi {{name}},\n\nYour order #{{orderId}} has been {{status}}!\n\nOrder Details:\n📋 Items: {{items}}\n💰 Total: ${{total}}\n📍 {{location}}\n\nThank you for choosing LATS! 🚀'
    },
    {
      id: 'appointment_reminder',
      name: 'Appointment Reminder',
      template: '⏰ Appointment Reminder\n\nHi {{name}},\n\nThis is a friendly reminder about your upcoming appointment:\n\n📅 Date: {{date}}\n🕐 Time: {{time}}\n📍 Location: {{location}}\n👨‍⚕️ Service: {{service}}\n\nPlease arrive 10 minutes before your scheduled time.\n\nThank you,\nLATS Team 🏥'
    },
    {
      id: 'promotion',
      name: 'Promotional Message',
      template: '🎊 Special Offer!\n\nHi {{name}},\n\n{{promotionText}}\n\n🎯 {{offerDetails}}\n⏰ Valid until: {{validUntil}}\n\nDon\'t miss out on this amazing deal!\n\nBest regards,\nLATS Team 🚀'
    },
    {
      id: 'custom',
      name: 'Custom Template',
      template: 'Hi {{name}},\n\n{{customMessage}}\n\nBest regards,\nLATS Team'
    }
  ];

  // Add phone numbers from text input (one per line)
  const addPhoneNumbersFromText = (text: string) => {
    const numbers = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(number => {
        // Clean the number (remove spaces, dashes, etc.)
        return number.replace(/[\s\-\(\)]/g, '');
      });
    
    setPhoneNumbers(prev => [...new Set([...prev, ...numbers])]);
  };

  // Add individual phone number
  const addPhoneNumber = (number: string) => {
    if (number.trim() && !phoneNumbers.includes(number.trim())) {
      setPhoneNumbers(prev => [...prev, number.trim()]);
    }
  };

  // Remove phone number
  const removePhoneNumber = (index: number) => {
    setPhoneNumbers(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all phone numbers
  const clearPhoneNumbers = () => {
    setPhoneNumbers([]);
  };

  // Process template with variables
  const processTemplate = (template: string, variables: Record<string, string>): string => {
    let processedMessage = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedMessage = processedMessage.replace(regex, value);
    });
    
    return processedMessage;
  };

  // Send bulk messages
  const sendBulkMessages = async () => {
    if (!phoneNumbers.length || !message.trim()) {
      alert('Please add phone numbers and enter a message');
      return;
    }

    // Check if any numbers are not allowed
    const notAllowedNumbers = phoneNumbers.filter(
      number => !whatsappMessageService.isNumberAllowed(number)
    );

    if (notAllowedNumbers.length > 0) {
      const confirmSend = confirm(
        `Warning: ${notAllowedNumbers.length} number(s) are not in the allowed list and may fail to send. Continue anyway?`
      );
      if (!confirmSend) return;
    }

    setIsSending(true);
    setCurrentIndex(0);
    setResults([]);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    const bulkMessages: BulkMessage[] = phoneNumbers.map(number => ({
      phoneNumber: number,
      message: useTemplates && selectedTemplate 
        ? processTemplate(selectedTemplate, customVariables)
        : message,
      status: 'pending'
    }));

    setResults(bulkMessages);

    for (let i = 0; i < bulkMessages.length; i++) {
      // Check if cancelled
      if (abortControllerRef.current.signal.aborted) {
        break;
      }

      const bulkMessage = bulkMessages[i];
      setCurrentIndex(i);

      try {
        // Update status to sending
        setResults(prev => prev.map((msg, index) => 
          index === i ? { ...msg, status: 'sending' } : msg
        ));

        // Send the message
        const response = await whatsappMessageService.sendTextMessage(
          bulkMessage.phoneNumber,
          bulkMessage.message
        );

        // Update results
        setResults(prev => prev.map((msg, index) => 
          index === i ? {
            ...msg,
            status: response.status === 'sent' ? 'sent' : 'failed',
            messageId: response.idMessage,
            error: response.error,
            sentAt: new Date()
          } : msg
        ));

        // Call progress callback
        onProgress?.(i + 1, bulkMessages.length);

        // Wait before sending next message (rate limiting)
        if (i < bulkMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
        }

      } catch (error) {
        setResults(prev => prev.map((msg, index) => 
          index === i ? {
            ...msg,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            sentAt: new Date()
          } : msg
        ));
      }
    }

    setIsSending(false);
    onComplete?.(results);
  };

  // Cancel sending
  const cancelSending = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSending(false);
  };

  // Get statistics
  const getStats = () => {
    const total = results.length;
    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const pending = results.filter(r => r.status === 'pending').length;
    
    return { total, sent, failed, pending };
  };

  const stats = getStats();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-6 max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">📤 WhatsApp Bulk Message Sender</h3>
      
      {/* Status Info */}
      <div className="mb-4 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/30">
        <p className="text-sm text-blue-800">
          <strong>Allowed Numbers:</strong> {WHATSAPP_CREDENTIALS.allowedNumbers.length} numbers
        </p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Note:</strong> Only messages to allowed numbers will be delivered. Others will fail.
        </p>
      </div>

      {/* Phone Numbers Section */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">📞 Phone Numbers</h4>
        
        {/* Add numbers from text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Add Multiple Numbers (one per line)
          </label>
          <textarea
            placeholder="255746605561&#10;254700000000&#10;254712345678"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => addPhoneNumbersFromText(e.target.value)}
          />
        </div>

        {/* Add single number */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter phone number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addPhoneNumber(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Enter phone number"]') as HTMLInputElement;
                if (input) {
                  addPhoneNumber(input.value);
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Quick add allowed numbers */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Quick Add Allowed Numbers:</p>
          <div className="flex flex-wrap gap-2">
            {WHATSAPP_CREDENTIALS.allowedNumbers.map((number, index) => (
              <button
                key={index}
                onClick={() => addPhoneNumber(number.replace('@c.us', ''))}
                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
              >
                {number.replace('@c.us', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Phone numbers list */}
        {phoneNumbers.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Numbers ({phoneNumbers.length}):</p>
              <button
                onClick={clearPhoneNumbers}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {phoneNumbers.map((number, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50/80 rounded">
                  <span className="text-sm font-mono">{number}</span>
                  <button
                    onClick={() => removePhoneNumber(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Section */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">💬 Message</h4>
        
        {/* Template Selection */}
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={useTemplates}
              onChange={(e) => setUseTemplates(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Use Message Template</span>
          </label>
          
          {useTemplates && (
            <div className="space-y-3">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {messageTemplates.map(template => (
                  <option key={template.id} value={template.template}>
                    {template.name}
                  </option>
                ))}
              </select>
              
              {selectedTemplate && (
                <div className="p-3 bg-gray-50/80 rounded border">
                  <p className="text-sm font-medium mb-2">Template Variables:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['name', 'customerId', 'date', 'orderId', 'status', 'items', 'total', 'location', 'time', 'service', 'promotionText', 'offerDetails', 'validUntil', 'customMessage'].map(variable => (
                      <div key={variable}>
                        <label className="block text-xs font-medium text-gray-600">{variable}:</label>
                        <input
                          type="text"
                          placeholder={variable}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          value={customVariables[variable] || ''}
                          onChange={(e) => setCustomVariables(prev => ({
                            ...prev,
                            [variable]: e.target.value
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {useTemplates ? 'Template Preview:' : 'Message:'}
          </label>
          <textarea
            value={useTemplates && selectedTemplate 
              ? processTemplate(selectedTemplate, customVariables)
              : message
            }
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your message here..."
            readOnly={useTemplates && selectedTemplate}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="mt-3 p-3 bg-gray-50/80 rounded border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Delay between messages (ms):</label>
                <input
                  type="number"
                  value={delayBetweenMessages}
                  onChange={(e) => setDelayBetweenMessages(Number(e.target.value))}
                  min="500"
                  max="10000"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Recommended: 1000ms (1 second) to avoid rate limiting
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Button */}
      <div className="mb-6">
        {!isSending ? (
          <button
            onClick={sendBulkMessages}
            disabled={!phoneNumbers.length || (!message.trim() && (!useTemplates || !selectedTemplate))}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            📤 Send Bulk Messages ({phoneNumbers.length} recipients)
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Sending... {currentIndex + 1} of {phoneNumbers.length}
              </span>
              <button
                onClick={cancelSending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / phoneNumbers.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">📊 Results</h4>
          
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50/80 rounded border">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-blue-800">Total</p>
            </div>
            <div className="text-center p-3 bg-green-50/80 rounded border">
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              <p className="text-xs text-green-800">Sent</p>
            </div>
            <div className="text-center p-3 bg-red-50/80 rounded border">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-xs text-red-800">Failed</p>
            </div>
            <div className="text-center p-3 bg-gray-50/80 rounded border">
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
              <p className="text-xs text-gray-800">Pending</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded border ${
                result.status === 'sent' ? 'bg-green-50/80 border-green-200' :
                result.status === 'failed' ? 'bg-red-50/80 border-red-200' :
                result.status === 'sending' ? 'bg-yellow-50/80 border-yellow-200' :
                'bg-gray-50/80 border-gray-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono text-sm">{result.phoneNumber}</p>
                    <p className="text-xs text-gray-600">
                      Status: {result.status}
                      {result.messageId && ` | ID: ${result.messageId}`}
                      {result.sentAt && ` | Sent: ${result.sentAt.toLocaleTimeString()}`}
                    </p>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    result.status === 'sent' ? 'bg-green-100 text-green-800' :
                    result.status === 'failed' ? 'bg-red-100 text-red-800' :
                    result.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="p-3 bg-yellow-50/80 rounded-lg border border-yellow-200/30">
        <p className="text-xs text-yellow-800">
          <strong>Important:</strong> Due to your current Green API plan, you can only send messages to the allowed numbers. 
          Messages to other numbers will fail. 
          <a 
            href="https://console.green-api.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline ml-1"
          >
            Upgrade here
          </a>
        </p>
      </div>
    </div>
  );
};

export default WhatsAppBulkSender;
