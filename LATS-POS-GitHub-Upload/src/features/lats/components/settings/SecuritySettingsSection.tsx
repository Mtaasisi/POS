import React from 'react';
import { GreenApiSettings } from '../../../../services/greenApiSettingsService';
import { Shield, Key, QrCode, Info, AlertTriangle, Lock } from 'lucide-react';

interface SecuritySettingsSectionProps {
  settings: GreenApiSettings;
  setSettings: React.Dispatch<React.SetStateAction<GreenApiSettings>>;
}

const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({ settings, setSettings }) => {
  const handleChange = (key: keyof GreenApiSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Authentication Methods */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-red-600" />
          <h4 className="font-medium text-gray-900">Authentication Methods</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <QrCode className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900 mb-1">QR Code Authentication</h5>
                <p className="text-sm text-blue-800">
                  Scan a QR code with your WhatsApp mobile app to authenticate this instance.
                  This is the most secure method for initial setup.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-green-900 mb-1">Authorization Code</h5>
                <p className="text-sm text-green-800">
                  Use an authorization code from your WhatsApp mobile app to authenticate.
                  This method is useful for re-authentication without scanning QR codes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Token Security */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-5 w-5 text-purple-600" />
          <h4 className="font-medium text-gray-900">API Token Security</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-900 mb-1">Security Best Practices</h5>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Keep your API token secure and never share it publicly</li>
                  <li>• Regularly rotate your API token for enhanced security</li>
                  <li>• Use HTTPS for all API communications</li>
                  <li>• Monitor API usage for suspicious activity</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-red-900 mb-1">Important Security Notes</h5>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Never expose your API token in client-side code</li>
                  <li>• Store tokens securely in environment variables</li>
                  <li>• Implement proper access controls for your webhook endpoints</li>
                  <li>• Regularly audit your instance access and permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Security */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-indigo-600" />
          <h4 className="font-medium text-gray-900">Webhook Security</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Token
            </label>
            <input
              type="password"
              value={settings.webhookUrlToken || ''}
              onChange={(e) => handleChange('webhookUrlToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="Enter webhook verification token"
            />
            <p className="text-xs text-gray-500 mt-1">
              This token will be included in webhook requests for verification
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900 mb-1">Webhook Token Usage</h5>
                <p className="text-sm text-blue-800">
                  When you set a webhook token, Green API will include it in the Authorization header 
                  of all webhook requests. Verify this token in your webhook handler to ensure 
                  requests are coming from Green API.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Security */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Session Security</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shared Session
            </label>
            <select
              value={settings.sharedSession || 'no'}
              onChange={(e) => handleChange('sharedSession', e.target.value as 'yes' | 'no')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Allow multiple instances to share the same WhatsApp session (deprecated)
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-900 mb-1">Session Security Warning</h5>
                <p className="text-sm text-yellow-800">
                  The shared session feature is deprecated and may cause security issues. 
                  It's recommended to keep this setting disabled and use separate instances 
                  for different applications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-2">Security Recommendations</h4>
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>Authentication:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use QR code authentication for initial setup</li>
                <li>Keep authorization codes secure and temporary</li>
                <li>Regularly re-authenticate instances for security</li>
              </ul>
              
              <p className="mt-3"><strong>API Security:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Rotate API tokens regularly (every 30-90 days)</li>
                <li>Use environment variables for token storage</li>
                <li>Implement rate limiting on your API endpoints</li>
                <li>Monitor API usage for unusual patterns</li>
              </ul>
              
              <p className="mt-3"><strong>Webhook Security:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Always use HTTPS for webhook URLs</li>
                <li>Implement webhook token verification</li>
                <li>Validate webhook payload signatures</li>
                <li>Set up proper error handling for webhook failures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Security Checklist */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Security Checklist</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>API token is stored securely (not in code)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Webhook URL uses HTTPS</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Webhook token is configured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Instance is properly authenticated</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Access logs are being monitored</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Backup authentication method is available</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsSection;
