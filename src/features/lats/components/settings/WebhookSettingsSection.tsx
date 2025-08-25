import React from 'react';
import { GreenApiSettings } from '../../../../services/greenApiSettingsService';
import { Globe, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface WebhookSettingsSectionProps {
  settings: GreenApiSettings;
  setSettings: React.Dispatch<React.SetStateAction<GreenApiSettings>>;
}

const WebhookSettingsSection: React.FC<WebhookSettingsSectionProps> = ({ settings, setSettings }) => {
  const handleChange = (key: keyof GreenApiSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const webhookSettings = [
    {
      key: 'outgoingWebhook' as keyof GreenApiSettings,
      label: 'Outgoing Message Status Webhooks',
      description: 'Receive notifications about outgoing message statuses (sent, delivered, read)',
      icon: <CheckCircle size={16} className="text-green-600" />
    },
    {
      key: 'outgoingMessageWebhook' as keyof GreenApiSettings,
      label: 'Messages Sent from Phone',
      description: 'Receive notifications about messages sent from your mobile phone',
      icon: <CheckCircle size={16} className="text-blue-600" />
    },
    {
      key: 'outgoingAPIMessageWebhook' as keyof GreenApiSettings,
      label: 'Messages Sent from API',
      description: 'Receive notifications about messages sent via the API',
      icon: <CheckCircle size={16} className="text-purple-600" />
    },
    {
      key: 'incomingWebhook' as keyof GreenApiSettings,
      label: 'Incoming Messages & Files',
      description: 'Receive notifications about incoming messages and file uploads',
      icon: <CheckCircle size={16} className="text-orange-600" />
    },
    {
      key: 'stateWebhook' as keyof GreenApiSettings,
      label: 'Instance State Changes',
      description: 'Receive notifications when instance authorization state changes',
      icon: <CheckCircle size={16} className="text-gray-600" />
    },
    {
      key: 'pollMessageWebhook' as keyof GreenApiSettings,
      label: 'Poll Messages',
      description: 'Receive notifications about polls and poll responses',
      icon: <CheckCircle size={16} className="text-indigo-600" />
    },
    {
      key: 'incomingBlockWebhook' as keyof GreenApiSettings,
      label: 'Incoming Chat Blocks',
      description: 'Receive notifications about incoming chat blocks (temporarily disabled)',
      icon: <AlertTriangle size={16} className="text-red-600" />
    },
    {
      key: 'incomingCallWebhook' as keyof GreenApiSettings,
      label: 'Incoming Calls',
      description: 'Receive notifications about incoming calls',
      icon: <CheckCircle size={16} className="text-teal-600" />
    },
    {
      key: 'editedMessageWebhook' as keyof GreenApiSettings,
      label: 'Edited Messages',
      description: 'Receive notifications about edited messages',
      icon: <CheckCircle size={16} className="text-yellow-600" />
    },
    {
      key: 'deletedMessageWebhook' as keyof GreenApiSettings,
      label: 'Deleted Messages',
      description: 'Receive notifications about deleted messages',
      icon: <CheckCircle size={16} className="text-red-600" />
    }
  ];

  const isWebhookUrlConfigured = settings.webhookUrl && settings.webhookUrl.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Webhook URL Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-gray-900">Webhook URL Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL *
            </label>
            <input
              type="url"
              value={settings.webhookUrl || ''}
              onChange={(e) => handleChange('webhookUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="https://your-domain.com/webhook/green-api/"
            />
            <p className="text-xs text-gray-500 mt-1">
              The URL where Green API will send webhook notifications
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Token
            </label>
            <input
              type="password"
              value={settings.webhookUrlToken || ''}
              onChange={(e) => handleChange('webhookUrlToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="Optional secret token for webhook verification"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional secret token for webhook authentication
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Status */}
      {!isWebhookUrlConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">Webhook URL Required</h4>
              <p className="text-sm text-yellow-800">
                You need to configure a webhook URL to receive notifications. Without a webhook URL, 
                you can only use HTTP API technology to poll for notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Notifications */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Webhook Notifications</h4>
        </div>
        
        <div className="space-y-4">
          {webhookSettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-start gap-3 flex-1">
                {setting.icon}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {setting.label}
                  </label>
                  <p className="text-xs text-gray-600">{setting.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={settings[setting.key] || 'no'}
                  onChange={(e) => handleChange(setting.key, e.target.value as 'yes' | 'no')}
                  disabled={!isWebhookUrlConfigured}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:border-green-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Configuration Guide */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Webhook Configuration Guide</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Required Setup:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Configure a webhook URL that can receive POST requests</li>
                <li>Ensure your server can handle the webhook payload format</li>
                <li>Set up proper authentication using the webhook token</li>
                <li>Test webhook delivery to ensure reliability</li>
              </ul>
              
              <p className="mt-3"><strong>Recommended Notifications:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Incoming Messages:</strong> Essential for receiving messages</li>
                <li><strong>Outgoing Status:</strong> Track message delivery status</li>
                <li><strong>State Changes:</strong> Monitor instance connection status</li>
                <li><strong>Incoming Calls:</strong> Handle call notifications</li>
              </ul>
              
              <p className="mt-3"><strong>Note:</strong> Some webhook types are temporarily disabled by Green API. 
              Check the Green API documentation for current status.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Testing */}
      {isWebhookUrlConfigured && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">Webhook URL Configured</h4>
              <p className="text-sm text-green-800">
                Your webhook URL is configured. You can now enable the webhook notifications above. 
                Make sure your server is ready to receive webhook notifications at: 
                <code className="block mt-1 p-2 bg-green-100 rounded text-xs font-mono">
                  {settings.webhookUrl}
                </code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookSettingsSection;
