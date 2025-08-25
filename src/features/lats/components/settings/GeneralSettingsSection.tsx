import React from 'react';
import { GreenApiSettings } from '../../../../services/greenApiSettingsService';
import { Info, Globe, Clock, Database } from 'lucide-react';

interface GeneralSettingsSectionProps {
  settings: GreenApiSettings;
  setSettings: React.Dispatch<React.SetStateAction<GreenApiSettings>>;
}

const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({ settings, setSettings }) => {
  const handleChange = (key: keyof GreenApiSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Instance Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Instance Information</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp ID
            </label>
            <input
              type="text"
              value={settings.wid || ''}
              onChange={(e) => handleChange('wid', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="e.g., 79876543210@c.us"
            />
            <p className="text-xs text-gray-500 mt-1">Your WhatsApp account ID</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country Instance
            </label>
            <input
              type="text"
              value={settings.countryInstance || ''}
              onChange={(e) => handleChange('countryInstance', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="e.g., US"
            />
            <p className="text-xs text-gray-500 mt-1">Country code for the instance</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <input
              type="text"
              value={settings.typeAccount || ''}
              onChange={(e) => handleChange('typeAccount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="e.g., personal"
            />
            <p className="text-xs text-gray-500 mt-1">Type of WhatsApp account</p>
          </div>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-gray-900">Webhook Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={settings.webhookUrl || ''}
              onChange={(e) => handleChange('webhookUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="https://mysite.com/webhook/green-api/"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL for receiving incoming notifications. Leave empty for HTTP API technology.
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
              placeholder="Secret token for webhook verification"
            />
            <p className="text-xs text-gray-500 mt-1">
              Authorization header for webhook verification
            </p>
          </div>
        </div>
      </div>

      {/* Message Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-purple-600" />
          <h4 className="font-medium text-gray-900">Message Settings</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Send Delay (milliseconds)
            </label>
            <input
              type="number"
              min="0"
              max="60000"
              value={settings.delaySendMessagesMilliseconds || 5000}
              onChange={(e) => handleChange('delaySendMessagesMilliseconds', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="5000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Delay between sending messages to avoid rate limiting (0-60000ms)
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mark Incoming Messages as Read
              </label>
              <select
                value={settings.markIncomingMessagesReaded || 'no'}
                onChange={(e) => handleChange('markIncomingMessagesReaded', e.target.value as 'yes' | 'no')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Automatically mark incoming messages as read
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mark Read on Reply
              </label>
              <select
                value={settings.markIncomingMessagesReadedOnReply || 'no'}
                onChange={(e) => handleChange('markIncomingMessagesReadedOnReply', e.target.value as 'yes' | 'no')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Mark messages as read when replying via API
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Status Settings</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keep Online Status
          </label>
          <select
            value={settings.keepOnlineStatus || 'no'}
            onChange={(e) => handleChange('keepOnlineStatus', e.target.value as 'yes' | 'no')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Keep 'online' status when phone and linked devices are turned off
          </p>
        </div>
      </div>

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Settings Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Webhook URL:</strong> Required for receiving notifications about incoming messages and events</li>
              <li>• <strong>Message Delay:</strong> Helps avoid rate limiting when sending multiple messages</li>
              <li>• <strong>Mark as Read:</strong> Automatically marks incoming messages as read in WhatsApp</li>
              <li>• <strong>Keep Online:</strong> Maintains online status even when devices are offline</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsSection;
