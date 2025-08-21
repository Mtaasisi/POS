import React from 'react';
import WhatsAppMessageSender from '../components/WhatsAppMessageSender';
import WhatsAppBulkSender from '../components/WhatsAppBulkSender';
import { WHATSAPP_CREDENTIALS } from '../config/whatsappCredentials';

const WhatsAppTestPage: React.FC = () => {
  const handleMessageSent = (response: any) => {
    console.log('✅ Message sent successfully:', response);
    // You can add toast notifications here
  };

  const handleError = (error: string) => {
    console.error('❌ Message sending failed:', error);
    // You can add toast notifications here
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📱 WhatsApp Message Tester
            </h1>
            <p className="text-gray-600">
              Test your WhatsApp integration with Green API
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">🔍 Connection Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50/80 backdrop-blur-sm rounded-lg border border-green-200/30">
                <p className="text-sm font-medium text-green-800">Instance ID</p>
                <p className="text-lg font-mono text-green-900">{WHATSAPP_CREDENTIALS.instanceId}</p>
              </div>
              <div className="p-4 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/30">
                <p className="text-sm font-medium text-blue-800">Status</p>
                <p className="text-lg font-semibold text-blue-900 capitalize">{WHATSAPP_CREDENTIALS.status}</p>
              </div>
              <div className="p-4 bg-purple-50/80 backdrop-blur-sm rounded-lg border border-purple-200/30">
                <p className="text-sm font-medium text-purple-800">Allowed Numbers</p>
                <p className="text-lg font-semibold text-purple-900">{WHATSAPP_CREDENTIALS.allowedNumbers.length}</p>
              </div>
            </div>
          </div>

          {/* Allowed Numbers */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">📞 Allowed Numbers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WHATSAPP_CREDENTIALS.allowedNumbers.map((number, index) => (
                <div key={index} className="p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200/30">
                  <p className="text-sm text-gray-600">Number {index + 1}</p>
                  <p className="font-mono text-gray-900">{number.replace('@c.us', '')}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50/80 backdrop-blur-sm rounded-lg border border-yellow-200/30">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Due to your current Green API plan, you can only send messages to these numbers. 
                <a 
                  href="https://console.green-api.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Upgrade to send to any number
                </a>
              </p>
            </div>
          </div>

          {/* Message Sender */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">💬 Send Single Message</h2>
            <WhatsAppMessageSender 
              onMessageSent={handleMessageSent}
              onError={handleError}
            />
          </div>

          {/* Bulk Message Sender */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-6">
            <h2 className="text-xl font-semibold mb-4">📤 Send Bulk Messages</h2>
            <WhatsAppBulkSender 
              onComplete={(results) => {
                console.log('Bulk sending completed:', results);
              }}
              onProgress={(completed, total) => {
                console.log(`Progress: ${completed}/${total}`);
              }}
            />
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/30 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 How to Use</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>1. <strong>Quick Send:</strong> Click on any allowed number button to pre-fill the form</p>
              <p>2. <strong>Custom Message:</strong> Enter any phone number and message manually</p>
              <p>3. <strong>Send:</strong> Click the "Send Message" button to send your message</p>
              <p>4. <strong>Monitor:</strong> Check the response section for delivery status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTestPage;
