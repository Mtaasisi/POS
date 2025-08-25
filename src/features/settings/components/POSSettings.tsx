import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Smartphone, Save, Receipt, CreditCard, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface POSSettingsProps {
  isActive: boolean;
}

const POSSettings: React.FC<POSSettingsProps> = ({ isActive }) => {
  const [settings, setSettings] = useState({
    receiptHeader: 'LATS CHANCE',
    receiptFooter: 'Thank you for your business!',
    taxRate: 18,
    currency: 'TZS',
    autoPrint: false,
    requireCustomerInfo: true,
    showStockWarning: true,
    barcodeScanner: true
  });

  const handleSave = () => {
    localStorage.setItem('posSettings', JSON.stringify(settings));
    toast.success('POS settings saved');
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
          <Smartphone className="w-5 h-5" />
          POS Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receipt Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Receipt Settings
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Receipt Header
              </label>
              <input
                type="text"
                value={settings.receiptHeader}
                onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Receipt Footer
              </label>
              <textarea
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Business Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Business Settings
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-medium text-white">Preferences</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPrint}
                onChange={(e) => setSettings({ ...settings, autoPrint: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
              />
              <span className="text-white">Auto-print receipts</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireCustomerInfo}
                onChange={(e) => setSettings({ ...settings, requireCustomerInfo: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
              />
              <span className="text-white">Require customer information</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showStockWarning}
                onChange={(e) => setSettings({ ...settings, showStockWarning: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
              />
              <span className="text-white">Show stock warnings</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.barcodeScanner}
                onChange={(e) => setSettings({ ...settings, barcodeScanner: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
              />
              <span className="text-white">Enable barcode scanner</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <GlassButton
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save POS Settings
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default POSSettings;
