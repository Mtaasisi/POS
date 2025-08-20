import React, { useState, useEffect } from 'react';
import { X, Settings, CheckCircle, AlertCircle, Eye, EyeOff, Copy, ExternalLink, Info } from 'lucide-react';
import { whatsappBusinessApi, WhatsAppBusinessConfig } from '../../../services/whatsappBusinessApi';
import GlassCard from '../../../features/shared/components/ui/GlassCard';

interface WhatsAppBusinessConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

const WhatsAppBusinessConfigModal: React.FC<WhatsAppBusinessConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<Partial<WhatsAppBusinessConfig>>({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
    webhookVerifyToken: '',
    apiVersion: 'v18.0'
  });

  const [showSecrets, setShowSecrets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; data?: any } | null>(null);
  const [currentConfig, setCurrentConfig] = useState<WhatsAppBusinessConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig();
    }
  }, [isOpen]);

  const loadCurrentConfig = async () => {
    const current = whatsappBusinessApi.getConfig();
    setCurrentConfig(current);
    
    if (current) {
      setConfig({
        accessToken: current.accessToken,
        phoneNumberId: current.phoneNumberId,
        businessAccountId: current.businessAccountId,
        appId: current.appId,
        appSecret: current.appSecret,
        webhookVerifyToken: current.webhookVerifyToken,
        apiVersion: current.apiVersion
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await whatsappBusinessApi.updateConfig(config);
      if (success) {
        onConfigSaved();
        onClose();
      } else {
        alert('Failed to save configuration. Please try again.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await whatsappBusinessApi.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const generateWebhookToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setConfig(prev => ({ ...prev, webhookVerifyToken: token }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="text-green-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">WhatsApp Business API Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Setup Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="text-blue-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Create a Meta Developer account at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a></li>
                  <li>2. Create a WhatsApp Business App in the Meta Developer Console</li>
                  <li>3. Add a phone number to your WhatsApp Business App</li>
                  <li>4. Get your Access Token, Phone Number ID, and Business Account ID</li>
                  <li>5. Configure your webhook URL and verify token</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>

              {/* Access Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={config.accessToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="EAA..."
                  />
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Your Meta App's access token</p>
              </div>

              {/* Phone Number ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID *
                </label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) => setConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="123456789"
                />
                <p className="text-xs text-gray-500 mt-1">The ID of your WhatsApp Business phone number</p>
              </div>

              {/* Business Account ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID *
                </label>
                <input
                  type="text"
                  value={config.businessAccountId}
                  onChange={(e) => setConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="123456789"
                />
                <p className="text-xs text-gray-500 mt-1">Your Meta Business Account ID</p>
              </div>

              {/* App ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App ID
                </label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={(e) => setConfig(prev => ({ ...prev, appId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="123456789"
                />
                <p className="text-xs text-gray-500 mt-1">Your Meta App ID (optional)</p>
              </div>

              {/* App Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={config.appSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="abc123..."
                  />
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Your Meta App Secret (optional)</p>
              </div>

              {/* API Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Version
                </label>
                <select
                  value={config.apiVersion}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiVersion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="v18.0">v18.0 (Latest)</option>
                  <option value="v17.0">v17.0</option>
                  <option value="v16.0">v16.0</option>
                  <option value="v15.0">v15.0</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Meta Graph API version to use</p>
              </div>
            </div>

            {/* Right Column - Webhook & Testing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>

              {/* Webhook Verify Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Verify Token *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={config.webhookVerifyToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your-verify-token"
                  />
                  <button
                    onClick={generateWebhookToken}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Token for webhook verification</p>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/api/whatsapp-webhook`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/api/whatsapp-webhook`)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use this URL in your Meta App webhook settings</p>
              </div>

              {/* Connection Test */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Test Connection</h4>
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.accessToken || !config.phoneNumberId}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    testResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {testResult.success ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600" size={20} />
                      )}
                      <span className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                      </span>
                    </div>
                    {testResult.error && (
                      <p className="text-sm text-red-700 mt-1">{testResult.error}</p>
                    )}
                    {testResult.success && testResult.data && (
                      <div className="text-sm text-green-700 mt-2">
                        <p><strong>Phone Number:</strong> {testResult.data.phoneNumber}</p>
                        <p><strong>Verified Name:</strong> {testResult.data.verifiedName}</p>
                        <p><strong>Quality Rating:</strong> {testResult.data.qualityRating}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Help Links */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Helpful Links</h4>
                <div className="space-y-2">
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={14} />
                    <span>WhatsApp Business API Documentation</span>
                  </a>
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={14} />
                    <span>Meta Developer Console</span>
                  </a>
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={14} />
                    <span>Webhook Setup Guide</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !config.accessToken || !config.phoneNumberId}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default WhatsAppBusinessConfigModal;
