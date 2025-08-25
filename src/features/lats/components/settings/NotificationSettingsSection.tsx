import React from 'react';
import { Bell, Globe, MessageCircle, Users, FileText, Settings } from 'lucide-react';

interface GreenApiSettings {
  [key: string]: any;
}

interface NotificationSettingsSectionProps {
  settings: GreenApiSettings;
  setSettings: (settings: GreenApiSettings) => void;
}

const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
  settings,
  setSettings
}) => {
  const updateSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  const notificationEvents = [
    {
      key: 'incomingMessage',
      label: 'Incoming Messages',
      description: 'Receive notifications for new incoming messages',
      icon: <MessageCircle size={16} />
    },
    {
      key: 'outgoingMessage',
      label: 'Outgoing Messages',
      description: 'Receive notifications when messages are sent',
      icon: <MessageCircle size={16} />
    },
    {
      key: 'messageStatus',
      label: 'Message Status Updates',
      description: 'Receive notifications for message delivery status changes',
      icon: <FileText size={16} />
    },
    {
      key: 'instanceStatus',
      label: 'Instance Status Changes',
      description: 'Receive notifications when instance status changes',
      icon: <Settings size={16} />
    },
    {
      key: 'webhookErrors',
      label: 'Webhook Errors',
      description: 'Receive notifications for webhook delivery failures',
      icon: <Globe size={16} />
    },
    {
      key: 'connectionStatus',
      label: 'Connection Status',
      description: 'Receive notifications for connection status changes',
      icon: <Users size={16} />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Events</h4>
        <p className="text-sm text-gray-600 mb-6">
          Configure which events should trigger webhook notifications to your server.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notificationEvents.map((event) => (
            <div key={event.key} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {event.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">{event.label}</h5>
                    <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[`notify_${event.key}`] || false}
                      onChange={(e) => updateSetting(`notify_${event.key}`, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Retry Attempts
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={settings.notification_retry_attempts || 3}
              onChange={(e) => updateSetting('notification_retry_attempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of times to retry failed webhook notifications
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Timeout (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.notification_timeout || 30}
              onChange={(e) => updateSetting('notification_timeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Timeout for webhook notification requests
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_include_metadata || false}
                onChange={(e) => updateSetting('notification_include_metadata', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div>
              <span className="text-sm font-medium text-gray-900">Include Metadata</span>
              <p className="text-xs text-gray-500">Include additional metadata in notification payloads</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_compress_payload || false}
                onChange={(e) => updateSetting('notification_compress_payload', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div>
              <span className="text-sm font-medium text-gray-900">Compress Payload</span>
              <p className="text-xs text-gray-500">Compress notification payloads to reduce bandwidth</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Format</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Format
            </label>
            <select
              value={settings.notification_format || 'json'}
              onChange={(e) => updateSetting('notification_format', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="form">Form Data</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Headers (JSON)
            </label>
            <textarea
              value={settings.notification_custom_headers || '{}'}
              onChange={(e) => updateSetting('notification_custom_headers', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder='{"X-Custom-Header": "value"}'
            />
            <p className="text-xs text-gray-500 mt-1">
              Additional headers to include with webhook notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsSection;
