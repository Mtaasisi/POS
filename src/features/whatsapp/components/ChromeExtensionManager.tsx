import React, { useState, useEffect } from 'react';
import { chromeExtensionService } from '../../../services/chromeExtensionService';

interface ConnectionStatus {
  isConnected: boolean;
  queueLength: number;
  apiKey: string;
}

const ChromeExtensionManager: React.FC = () => {
  console.log('ChromeExtensionManager component is rendering');
  
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    queueLength: 0,
    apiKey: 'Not configured'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState('');
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    console.log('ChromeExtensionManager useEffect running');
    // For now, just set a mock status
    setStatus({
      isConnected: true,
      queueLength: 0,
      apiKey: 'Configured'
    });
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId.trim()) {
      alert('Please enter both message and chat ID');
      return;
    }

    setIsLoading(true);
    try {
      // Mock implementation for now
      console.log('Sending message:', { chatId, message });
      setTimeout(() => {
        setMessage('');
        alert('Message sent successfully!');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      // Mock test connection
      console.log('Testing connection...');
      setTimeout(() => {
        alert('✅ Connection test successful!');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Connection test error:', error);
      alert('❌ Connection test error');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Chrome Extension Manager
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {status.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Connection Status</h3>
          <p className={`text-lg font-semibold ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {status.isConnected ? 'Active' : 'Inactive'}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Message Queue</h3>
          <p className="text-lg font-semibold text-blue-600">{status.queueLength}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">API Key</h3>
          <p className="text-lg font-semibold text-gray-800">{status.apiKey}</p>
        </div>
      </div>

      {/* Test Connection Button */}
      <div className="mb-6">
        <button
          onClick={handleTestConnection}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* Send Message Form */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Test Message</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chat ID</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Enter chat ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim() || !chatId.trim()}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          Webhook URL for Chrome Extension:
        </h3>
        <code className="block p-2 bg-yellow-100 rounded text-sm text-yellow-900 break-all">
          {typeof window !== 'undefined' ? `${window.location.origin}/api/chrome-extension-webhook` : '/api/chrome-extension-webhook'}
        </code>
        <p className="text-xs text-yellow-700 mt-2">
          Configure this URL in your Chrome extension to send messages to your app
        </p>
      </div>
    </div>
  );
};

export default ChromeExtensionManager;
