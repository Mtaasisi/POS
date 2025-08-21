import React, { useState } from 'react';
import { whatsappMessageService, WhatsAppMessageRequest } from '../lib/whatsappMessageService';
import { WHATSAPP_CREDENTIALS } from '../config/whatsappCredentials';

interface WhatsAppMessageSenderProps {
  onMessageSent?: (response: any) => void;
  onError?: (error: string) => void;
}

export const WhatsAppMessageSender: React.FC<WhatsAppMessageSenderProps> = ({
  onMessageSent,
  onError
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const handleSendMessage = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      onError?.('Please enter both phone number and message');
      return;
    }

    setIsLoading(true);
    setLastResponse(null);

    try {
      const request: WhatsAppMessageRequest = {
        phoneNumber: phoneNumber.trim(),
        message: message.trim(),
        type: 'text'
      };

      const response = await whatsappMessageService.sendMessageWithRetry(request);
      setLastResponse(response);

      if (response.status === 'sent') {
        onMessageSent?.(response);
        // Clear form on success
        setPhoneNumber('');
        setMessage('');
      } else {
        onError?.(response.error || 'Failed to send message');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      setLastResponse({ status: 'failed', error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSend = (number: string, presetMessage: string) => {
    setPhoneNumber(number);
    setMessage(presetMessage);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">📱 Send WhatsApp Message</h3>
      
      {/* Status Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Status:</strong> {WHATSAPP_CREDENTIALS.status}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Allowed Numbers:</strong> {WHATSAPP_CREDENTIALS.allowedNumbers.length} numbers
        </p>
      </div>

      {/* Quick Send Buttons */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Send:</p>
        <div className="flex flex-wrap gap-2">
          {WHATSAPP_CREDENTIALS.allowedNumbers.map((number, index) => (
            <button
              key={index}
              onClick={() => handleQuickSend(number, `Hello! This is a test message from LATS. 🚀`)}
              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
            >
              {number.replace('@c.us', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., 255746605561"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={isLoading || !phoneNumber.trim() || !message.trim()}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '📤 Sending...' : '📤 Send Message'}
        </button>
      </div>

      {/* Response */}
      {lastResponse && (
        <div className={`mt-4 p-3 rounded-lg ${
          lastResponse.status === 'sent' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm">
            <strong>Status:</strong> {lastResponse.status}
          </p>
          {lastResponse.idMessage && (
            <p className="text-sm">
              <strong>Message ID:</strong> {lastResponse.idMessage}
            </p>
          )}
          {lastResponse.error && (
            <p className="text-sm">
              <strong>Error:</strong> {lastResponse.error}
            </p>
          )}
        </div>
      )}

      {/* Quota Warning */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Due to quota limits, you can only send messages to the allowed numbers above. 
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

export default WhatsAppMessageSender;
