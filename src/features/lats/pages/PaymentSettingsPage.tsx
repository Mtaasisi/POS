import React, { useMemo, useState, useEffect } from 'react';
import { usePaymentSettings } from '../payments/SettingsStore';
import { PaymentService } from '../payments';
import { ZENOPAY_CONFIG } from '../config/zenopay';
import toast from 'react-hot-toast';
import { GlassCard, GlassButton } from '../components/ui';

const providers = [
  { id: 'zenopay', name: 'ZenoPay' },
  { id: 'mock', name: 'Mock Provider (Dev)' },
] as const;

const PaymentSettingsPage: React.FC = () => {
  const settings = usePaymentSettings();
  
  // Ensure settings is properly initialized
  if (!settings) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Settings</h1>
          <p className="text-gray-600">Loading payment settings...</p>
        </div>
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </GlassCard>
      </div>
    );
  }
  
  // Safely get credentials with fallback
  const getCredentials = () => {
    try {
      if (settings && typeof settings.getEffectiveCredentials === 'function') {
        return settings.getEffectiveCredentials() ?? {};
      }
      return {};
    } catch (error) {
      console.warn('Failed to get effective credentials:', error);
      return {};
    }
  };
  
  const initialCredentials = getCredentials();
  const [apiKey, setApiKey] = useState(initialCredentials.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(initialCredentials.baseUrl ?? '');
  const [webhookUrl, setWebhookUrl] = useState(initialCredentials.webhookUrl ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const activeProvider = settings?.activeProvider ?? 'zenopay';
  const providerName = useMemo(() => providers.find(p => p.id === activeProvider)?.name ?? activeProvider, [activeProvider]);

  // Update form fields when settings change
  useEffect(() => {
    try {
      const credentials = getCredentials();
      setApiKey(credentials.apiKey ?? '');
      setBaseUrl(credentials.baseUrl ?? '');
      setWebhookUrl(credentials.webhookUrl ?? '');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setIsLoading(false);
    }
  }, [settings?.activeProvider, settings?.credentials]);

  const save = () => {
    try {
      if (settings && typeof settings.setCredentials === 'function') {
        settings.setCredentials(activeProvider, { apiKey, baseUrl, webhookUrl });
        toast.success('Payment settings saved successfully!');
      } else {
        toast.error('Settings service not available');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const switchProvider = (id: 'zenopay' | 'mock') => {
    try {
      if (settings && typeof settings.setActiveProvider === 'function') {
        settings.setActiveProvider(id);
      } else {
        toast.error('Settings service not available');
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      toast.error('Failed to switch provider');
    }
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey || '');
      toast.success('API key copied to clipboard');
    } catch {}
  };

  const testCredentials = async () => {
    setTesting(true);
    try {
      // Test by creating a small test order instead of checking non-existent order
      const testOrderData = {
        buyer_email: 'test@example.com',
        buyer_name: 'Test User',
        buyer_phone: '0744963858',
        amount: 100, // Small test amount
        metadata: { test: true, source: 'credentials_test' }
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (apiKey) headers['X-ZP-API-KEY'] = apiKey;
      if (baseUrl) headers['X-ZP-BASE-URL'] = baseUrl;
      if (webhookUrl) headers['X-ZP-WEBHOOK-URL'] = webhookUrl;

      const res = await fetch(ZENOPAY_CONFIG.getCreateOrderUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify(testOrderData)
      });

      const text = await res.text();
      let ok = res.ok;
      let json: any = {};
      
      try {
        json = JSON.parse(text);
        ok = ok && (json?.success === true || json?.status === 'success');
      } catch {
        ok = false;
      }

      if (ok) {
        toast.success('✅ Credentials test passed! API connection working.');
        console.log('Test order created:', json.order_id);
      } else {
        const errorMsg = json?.message || json?.error || text.slice(0, 200);
        toast.error('❌ Credentials test failed: ' + errorMsg);
      }
    } catch (e: any) {
      toast.error('❌ Credentials test error: ' + (e?.message || 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Settings</h1>
          <p className="text-gray-600">Loading settings...</p>
        </div>
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Settings</h1>
        <p className="text-gray-600">Configure your payment gateway settings and credentials</p>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Active Provider</label>
          <select
            value={activeProvider}
            onChange={(e) => switchProvider(e.target.value as any)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Current: {providerName}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm pr-20"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <button
                    onClick={() => setShowApiKey((s) => !s)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                    type="button"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={copyApiKey}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                    type="button"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              value={baseUrl} 
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://zenoapi.com/api/payments"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              value={webhookUrl} 
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/zenopay-webhook.php"
            />
          </div>

                      <div className="flex gap-3 pt-4">
              <GlassButton
                onClick={save}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                💾 Save Settings
              </GlassButton>
              <GlassButton
                onClick={testCredentials}
                disabled={testing}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50"
              >
                {testing ? '🔄 Testing...' : '🧪 Test Credentials'}
              </GlassButton>
            </div>
            
            <div className="flex gap-3 pt-2">
              <GlassButton
                onClick={() => {
                  setApiKey('mzhU0r-QaBCW2h1JRsFbOFQ9iU2-Q_bDYty0HT0kZ_bzBys9Ub5HgWCTlYc5QwxkCJJMjVv1yzCLfO3SZQxSZg');
                  setBaseUrl('https://zenoapi.com/api/payments');
                  setWebhookUrl('http://localhost:8000/zenopay-webhook.php');
                  toast.success('Reset to default ZenoPay settings!');
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                🔄 Reset to Defaults
              </GlassButton>
            </div>
        </div>
      </GlassCard>

      {/* Provider Status */}
      <GlassCard className="p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Provider Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Active Provider</p>
              <p className="text-sm text-gray-600">{providerName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-green-600">Active</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">API Connection</p>
              <p className="text-sm text-gray-600">Last tested: {testing ? 'Testing...' : 'Not tested'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-yellow-600">Unknown</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentSettingsPage;


