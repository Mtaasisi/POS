import React from 'react';
import { GreenApiSettings } from '../../../../services/greenApiSettingsService';
import { MessageCircle, Clock, Info, AlertTriangle } from 'lucide-react';

interface MessageSettingsSectionProps {
  settings: GreenApiSettings;
  setSettings: React.Dispatch<React.SetStateAction<GreenApiSettings>>;
}

const MessageSettingsSection: React.FC<MessageSettingsSectionProps> = ({ settings, setSettings }) => {
  const handleChange = (key: keyof GreenApiSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Message Delivery Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-purple-600" />
          <h4 className="font-medium text-gray-900">Message Delivery Settings</h4>
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
              step="100"
              value={settings.delaySendMessagesMilliseconds || 5000}
              onChange={(e) => handleChange('delaySendMessagesMilliseconds', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="5000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Delay between sending messages to avoid rate limiting. Recommended: 1000-5000ms
            </p>
          </div>
        </div>
      </div>

      {/* Message Read Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Message Read Settings</h4>
        </div>
        
        <div className="space-y-4">
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
                Automatically mark incoming messages as read in WhatsApp
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
                Mark messages as read when replying via API (overrides above setting)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Status Tracking */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-gray-900">Message Status Tracking</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Message Status Flow</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span><strong>Pending:</strong> Message queued for sending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span><strong>Sending:</strong> Message being sent to WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>Sent:</strong> Message delivered to WhatsApp servers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span><strong>Delivered:</strong> Message delivered to recipient's device</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span><strong>Read:</strong> Message read by recipient</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limiting Information */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">Rate Limiting Guidelines</h4>
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>WhatsApp Business API Limits:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Maximum 1000 messages per day per phone number</li>
                <li>Maximum 5 messages per second per phone number</li>
                <li>Recommended delay: 1-5 seconds between messages</li>
                <li>Bulk messaging: Use longer delays (5-10 seconds)</li>
              </ul>
              
              <p className="mt-3"><strong>Best Practices:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Start with 5-second delays for new instances</li>
                <li>Monitor delivery rates and adjust accordingly</li>
                <li>Use webhooks to track message status</li>
                <li>Implement retry logic for failed messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Message Settings Tips */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-2">Message Settings Tips</h4>
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>Recommended Configuration:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Message Delay:</strong> 3000-5000ms for normal use, 5000-10000ms for bulk messaging</li>
                <li><strong>Mark as Read:</strong> Enable for better user experience</li>
                <li><strong>Mark Read on Reply:</strong> Enable to automatically mark messages as read when responding</li>
              </ul>
              
              <p className="mt-3"><strong>Performance Optimization:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use webhooks to track message delivery status</li>
                <li>Implement message queuing for high-volume scenarios</li>
                <li>Monitor delivery rates and adjust delays as needed</li>
                <li>Use message templates for consistent formatting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSettingsSection;
