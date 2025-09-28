import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface SMSSetting {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

interface SMSProvider {
  id: string;
  name: string;
  apiUrl: string;
  description: string;
  pricing: string;
}

const SMS_PROVIDERS: SMSProvider[] = [
  {
    id: 'mobishastra',
    name: 'Mobishastra',
    apiUrl: 'https://mshastra.com/sendurl.aspx',
    description: 'Popular SMS provider in Tanzania',
    pricing: '~15 TZS per SMS'
  },
  {
    id: 'sms_tanzania',
    name: 'SMS Tanzania',
    apiUrl: 'https://api.smstanzania.com/send',
    description: 'Reliable SMS service for Tanzania',
    pricing: '~12 TZS per SMS'
  },
  {
    id: 'bulksms',
    name: 'BulkSMS',
    apiUrl: 'https://api.bulksms.com/send',
    description: 'International SMS provider',
    pricing: '~10 TZS per SMS'
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    apiUrl: '',
    description: 'Use your own SMS provider',
    pricing: 'Varies'
  }
];

const SMSSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SMSSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [formData, setFormData] = useState({
    apiKey: '',
    apiUrl: '',
    price: '15'
  });

  useEffect(() => {
    fetchSMSSettings();
  }, []);

  const fetchSMSSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .or('key.eq.sms_provider_api_key,key.eq.sms_api_url,key.eq.sms_price')
        .order('key');

      if (error) {
        console.error('Error fetching SMS settings:', error);
        toast.error('Failed to fetch SMS settings');
        return;
      }

      setSettings(data || []);
      
      // Populate form data
      const apiKeySetting = data?.find(s => s.key === 'sms_provider_api_key');
      const apiUrlSetting = data?.find(s => s.key === 'sms_api_url');
      const priceSetting = data?.find(s => s.key === 'sms_price');

      setFormData({
        apiKey: apiKeySetting?.value || '',
        apiUrl: apiUrlSetting?.value || '',
        price: priceSetting?.value || '15'
      });

      // Auto-select provider based on URL
      if (apiUrlSetting?.value) {
        const provider = SMS_PROVIDERS.find(p => 
          apiUrlSetting.value.includes(p.apiUrl) || 
          (p.id === 'custom' && !SMS_PROVIDERS.some(pr => apiUrlSetting.value.includes(pr.apiUrl)))
        );
        if (provider) {
          setSelectedProvider(provider.id);
        }
      }

    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      toast.error('Failed to fetch SMS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = SMS_PROVIDERS.find(p => p.id === providerId);
    if (provider && provider.apiUrl) {
      setFormData(prev => ({
        ...prev,
        apiUrl: provider.apiUrl
      }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const settingsToUpdate = [
        { key: 'sms_provider_api_key', value: formData.apiKey },
        { key: 'sms_api_url', value: formData.apiUrl },
        { key: 'sms_price', value: formData.price }
      ];

      const { error } = await supabase
        .from('settings')
        .upsert(settingsToUpdate, { onConflict: 'key' });

      if (error) {
        console.error('Error saving SMS settings:', error);
        toast.error('Failed to save SMS settings');
        return;
      }

      toast.success('SMS settings saved successfully!');
      setEditing(false);
      await fetchSMSSettings();

    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast.error('Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    try {
      // Import SMS service dynamically to avoid circular imports
      const { smsService } = await import('../../../services/smsService');
      
      // Test SMS functionality using the SMS service
      const testResult = await smsService.sendSMS(
        '255700000000', 
        'Test SMS from LATS CHANCE - Configuration working!',
        { ai_enhanced: false }
      );

      if (testResult.success) {
        toast.success('SMS test successful! Check SMS logs for details.');
      } else {
        toast.error(`SMS test failed: ${testResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('SMS test error:', error);
      toast.error('SMS test failed. Check console for details.');
    }
  };

  const getSettingValue = (key: string) => {
    return settings.find(s => s.key === key)?.value || 'Not configured';
  };

  const getSettingStatus = (key: string) => {
    const value = getSettingValue(key);
    if (value === 'Not configured') return '❌';
    if (key === 'sms_provider_api_key' && value.length > 0) return '✅';
    if (key === 'sms_api_url' && value.includes('http')) return '✅';
    if (key === 'sms_price' && !isNaN(Number(value))) return '✅';
    return '⚠️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Settings</h1>
          <p className="text-gray-600">Configure your SMS provider credentials and settings</p>
        </div>

        {/* Current Settings Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">API Key</h3>
                <span className="text-2xl">{getSettingStatus('sms_provider_api_key')}</span>
              </div>
              <p className="text-sm text-gray-600">
                {getSettingValue('sms_provider_api_key') === 'Not configured' 
                  ? 'Not configured' 
                  : `${getSettingValue('sms_provider_api_key').substring(0, 10)}...`
                }
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">API URL</h3>
                <span className="text-2xl">{getSettingStatus('sms_api_url')}</span>
              </div>
              <p className="text-sm text-gray-600 break-all">
                {getSettingValue('sms_api_url')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Price per SMS</h3>
                <span className="text-2xl">{getSettingStatus('sms_price')}</span>
              </div>
              <p className="text-sm text-gray-600">
                {getSettingValue('sms_price')} TZS
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Configure SMS Provider</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Cancel' : 'Edit Settings'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMS Provider
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SMS_PROVIDERS.map((provider) => (
                    <div
                      key={provider.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedProvider === provider.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleProviderSelect(provider.id)}
                    >
                      <h3 className="font-medium text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{provider.pricing}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your SMS provider API key"
                />
              </div>

              {/* API URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://your-sms-provider.com/api/send"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per SMS (TZS)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={handleTestSMS}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Test SMS
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Click "Edit Settings" to configure your SMS provider</p>
              <button
                onClick={handleTestSMS}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test Current Configuration
              </button>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Popular SMS Providers</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Mobishastra:</strong> https://mshastra.com/</li>
                <li>• <strong>SMS Tanzania:</strong> https://smstanzania.com/</li>
                <li>• <strong>BulkSMS:</strong> https://www.bulksms.com/</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Testing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use phone number: <code>255700000000</code> for testing</li>
                <li>• Test SMS will simulate success</li>
                <li>• Check SMS logs for delivery status</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSSettingsPage;
