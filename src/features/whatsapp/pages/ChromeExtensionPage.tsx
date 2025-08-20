import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import ChromeExtensionManager from '../components/ChromeExtensionManager';

const ChromeExtensionPage: React.FC = () => {
  const { currentUser } = useAuth();
  console.log('ChromeExtensionPage component is rendering');
  console.log('Current user:', currentUser);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Chrome Extension Integration
          </h1>
          <p className="text-gray-600">
            Connect your WhatsApp Chrome extension to automate customer interactions and business processes
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Debug Info:</strong> User: {currentUser?.name} | Role: {currentUser?.role}
            </p>
          </div>
        </div>
        
        <ChromeExtensionManager />
        
        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Setup Instructions
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Install your WhatsApp Chrome extension</li>
              <li>2. Configure the webhook URL in your extension settings</li>
              <li>3. Enter your API key: <code className="bg-gray-100 px-1 rounded">1755675069644-f5ab0e92276f1e3332d41ece111c6201</code></li>
              <li>4. Test the connection using the button above</li>
              <li>5. Start receiving and processing WhatsApp messages</li>
            </ol>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              API Endpoints
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-700">Webhook URL:</strong>
                <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                  POST /api/chrome-extension-webhook
                </code>
              </div>
              <div>
                <strong className="text-gray-700">Send Message:</strong>
                <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                  POST /api/chrome-extension/messages
                </code>
              </div>
              <div>
                <strong className="text-gray-700">Status Check:</strong>
                <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                  GET /api/chrome-extension/status
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChromeExtensionPage;
