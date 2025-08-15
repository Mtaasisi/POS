import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Settings, Key, Smartphone } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { whatsappService } from '../../../services/whatsappService';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [instanceId, setInstanceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['whatsapp_instance_id', 'whatsapp_green_api_key']);

      if (!error && data) {
        const settings: any = {};
        data.forEach(row => {
          settings[row.key] = row.value;
        });
        setCurrentSettings(settings);
        setInstanceId(settings.whatsapp_instance_id || '');
        setApiKey(settings.whatsapp_green_api_key || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleTestConnection = async () => {
    if (!instanceId.trim() || !apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter both Instance ID and API Key' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await whatsappService.testConnection(instanceId.trim(), apiKey.trim());
      setTestResult({
        success: result.success,
        message: result.success ? 'Connection successful! WhatsApp is authorized.' : result.error || 'Connection failed'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!instanceId.trim() || !apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter both Instance ID and API Key' });
      return;
    }

    setIsLoading(true);

    try {
      // Test connection first
      const testResult = await whatsappService.testConnection(instanceId.trim(), apiKey.trim());
      
      if (!testResult.success) {
        setTestResult({
          success: false,
          message: testResult.error || 'Connection test failed. Please check your credentials.'
        });
        setIsLoading(false);
        return;
      }

      // Save to database
      const { error } = await supabase.from('settings').upsert([
        { key: 'whatsapp_instance_id', value: instanceId.trim() },
        { key: 'whatsapp_green_api_key', value: apiKey.trim() }
      ], { onConflict: 'key' });

      if (error) {
        setTestResult({
          success: false,
          message: `Failed to save settings: ${error.message}`
        });
      } else {
        setTestResult({
          success: true,
          message: 'Configuration saved successfully!'
        });
        onConfigSaved();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save configuration'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">WhatsApp Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to get Green API credentials:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Go to <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="underline">green-api.com</a></li>
              <li>2. Create an account and log in</li>
              <li>3. Create a new WhatsApp instance</li>
              <li>4. Copy your Instance ID and API Token</li>
              <li>5. Scan the QR code with WhatsApp Business</li>
            </ol>
          </div>

          {/* Instance ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Smartphone className="inline mr-2" size={16} />
              Instance ID
            </label>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="e.g., 123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="inline mr-2" size={16} />
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Green API token"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <Check size={20} className="text-green-600" />
                ) : (
                  <AlertTriangle size={20} className="text-red-600" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Current Status */}
          {currentSettings && (currentSettings.whatsapp_instance_id || currentSettings.whatsapp_green_api_key) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Configuration:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Instance ID: {currentSettings.whatsapp_instance_id ? '✓ Configured' : '✗ Not set'}</div>
                <div>API Key: {currentSettings.whatsapp_green_api_key ? '✓ Configured' : '✗ Not set'}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleTestConnection}
              disabled={isLoading || !instanceId.trim() || !apiKey.trim()}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isLoading || !instanceId.trim() || !apiKey.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfigModal;
