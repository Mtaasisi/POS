import React from 'react';
import { GreenApiSettings } from '../../../../services/greenApiSettingsService';
import { Activity, Info, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface StatusSettingsSectionProps {
  settings: GreenApiSettings;
  setSettings: React.Dispatch<React.SetStateAction<GreenApiSettings>>;
}

const StatusSettingsSection: React.FC<StatusSettingsSectionProps> = ({ settings, setSettings }) => {
  const handleChange = (key: keyof GreenApiSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Instance Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Instance Status</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Instance States</h5>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span><strong>authorized:</strong> Instance is connected and ready to send/receive messages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span><strong>notAuthorized:</strong> Instance is not authenticated, needs QR code or auth code</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span><strong>blocked:</strong> Instance is blocked, may need to re-authenticate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                <span><strong>sleepMode:</strong> Instance is in sleep mode to save resources</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span><strong>starting:</strong> Instance is starting up</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-gray-900">Online Status</h4>
        </div>
        
        <div className="space-y-4">
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
              Keep 'online' status even when phone and linked devices are turned off
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-green-900 mb-1">Online Status Benefits</h5>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Maintains 'Online' status in WhatsApp</li>
                  <li>• Ensures message status shows as 'delivered'</li>
                  <li>• Improves message delivery reliability</li>
                  <li>• Better user experience for recipients</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-purple-600" />
          <h4 className="font-medium text-gray-900">Monitoring Settings</h4>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State Change Notifications
              </label>
              <select
                value={settings.stateWebhook || 'no'}
                onChange={(e) => handleChange('stateWebhook', e.target.value as 'yes' | 'no')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
              >
                <option value="yes">Enabled</option>
                <option value="no">Disabled</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Get notified when instance state changes
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Status Notifications
              </label>
              <select
                value={settings.deviceWebhook || 'no'}
                onChange={(e) => handleChange('deviceWebhook', e.target.value as 'yes' | 'no')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
                disabled
              >
                <option value="yes">Enabled</option>
                <option value="no">Disabled</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Get device and battery level notifications (temporarily disabled)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Monitoring */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Health Monitoring</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Monitoring Best Practices</h5>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Regular Health Checks:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Monitor instance state every 5-10 minutes</li>
                <li>Check message delivery rates</li>
                <li>Monitor webhook delivery success</li>
                <li>Track API response times</li>
              </ul>
              
              <p className="mt-3"><strong>Alert Thresholds:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Alert if instance state is not 'authorized' for {'>'}5 minutes</li>
                <li>Alert if message delivery rate drops below 95%</li>
                <li>Alert if webhook delivery fails {'>'}3 times</li>
                <li>Alert if API response time exceeds 10 seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Optimization */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-orange-600" />
          <h4 className="font-medium text-gray-900">Performance Optimization</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-orange-900 mb-1">Performance Tips</h5>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Keep online status enabled for better delivery rates</li>
                  <li>• Monitor instance state changes to detect issues early</li>
                  <li>• Use appropriate message delays to avoid rate limiting</li>
                  <li>• Implement retry logic for failed operations</li>
                  <li>• Monitor webhook delivery to ensure notifications are received</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h4 className="font-medium text-gray-900">Troubleshooting</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <h5 className="font-medium text-red-900 mb-2">Common Issues & Solutions</h5>
            <div className="text-sm text-red-800 space-y-2">
              <div>
                <p className="font-medium">Instance not authorized:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Scan QR code or use authorization code</li>
                  <li>Check if phone is connected to internet</li>
                  <li>Ensure WhatsApp is active on the phone</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">Messages not delivering:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check instance state is 'authorized'</li>
                  <li>Verify recipient phone numbers are correct</li>
                  <li>Ensure message content follows WhatsApp guidelines</li>
                  <li>Check rate limiting settings</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">Webhooks not receiving:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verify webhook URL is accessible</li>
                  <li>Check webhook token configuration</li>
                  <li>Ensure server can handle POST requests</li>
                  <li>Monitor webhook delivery logs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-2">Status Monitoring Summary</h4>
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>Key Metrics to Monitor:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Instance State:</strong> Should be 'authorized' for normal operation</li>
                <li><strong>Message Delivery Rate:</strong> Should be {'>'}95% for good performance</li>
                <li><strong>Webhook Delivery:</strong> Monitor for failed webhook notifications</li>
                <li><strong>API Response Time:</strong> Should be {'<'}5 seconds for good performance</li>
                <li><strong>Online Status:</strong> Keep enabled for better delivery rates</li>
              </ul>
              
              <p className="mt-3"><strong>Recommended Actions:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Set up automated monitoring for instance state changes</li>
                <li>Implement alerting for critical issues</li>
                <li>Regularly review performance metrics</li>
                <li>Keep backup authentication methods ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusSettingsSection;
