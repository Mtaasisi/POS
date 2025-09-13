import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { CreditCard, Save, Shield, Key, TestTube } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PaymentSettingsProps {
  isActive?: boolean;
}

const PaymentSettings: React.FC<PaymentSettingsProps> = ({ isActive }) => {
  const [settings, setSettings] = useState({
    beemEnabled: true,
    beemApiKey: '',
    beemSecretKey: '',
    beemEnvironment: 'sandbox',
    cashEnabled: true,
    cardEnabled: true,
    mobileMoneyEnabled: true,
    autoConfirmPayments: false,
    requireReceipt: true
  });

  const handleSave = () => {
    localStorage.setItem('paymentSettings', JSON.stringify(settings));
    toast.success('Payment settings saved');
  };

  const testConnection = () => {
    toast.success('Testing payment connection...');
    // Add actual payment gateway test logic here
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5" />
          Payment Configuration
        </h3>

        <div className="space-y-6">
          {/* Beem Payment Gateway */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Beem Payment Gateway
              </h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.beemEnabled}
                  onChange={(e) => setSettings({ ...settings, beemEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white text-sm">Enable</span>
              </label>
            </div>

            {settings.beemEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings.beemApiKey}
                    onChange={(e) => setSettings({ ...settings, beemApiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Enter API Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    value={settings.beemSecretKey}
                    onChange={(e) => setSettings({ ...settings, beemSecretKey: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Enter Secret Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Environment
                  </label>
                  <select
                    value={settings.beemEnvironment}
                    onChange={(e) => setSettings({ ...settings, beemEnvironment: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <GlassButton
                    onClick={testConnection}
                    className="flex items-center gap-2"
                    variant="secondary"
                  >
                    <TestTube className="w-4 h-4" />
                    Test Connection
                  </GlassButton>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Payment Methods</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.cashEnabled}
                  onChange={(e) => setSettings({ ...settings, cashEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Cash Payments</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.cardEnabled}
                  onChange={(e) => setSettings({ ...settings, cardEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Card Payments</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.mobileMoneyEnabled}
                  onChange={(e) => setSettings({ ...settings, mobileMoneyEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Mobile Money</span>
              </label>
            </div>
          </div>

          {/* Payment Preferences */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Payment Preferences</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.autoConfirmPayments}
                  onChange={(e) => setSettings({ ...settings, autoConfirmPayments: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Auto-confirm successful payments</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.requireReceipt}
                  onChange={(e) => setSettings({ ...settings, requireReceipt: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Require receipt for all transactions</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <GlassButton
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Payment Settings
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentSettings;
