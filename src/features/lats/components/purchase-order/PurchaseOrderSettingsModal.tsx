// PurchaseOrderSettingsModal component - Settings for purchase order system
import React, { useState } from 'react';
import {
  Settings, Globe, DollarSign, Calendar, FileText, Bell, 
  Truck, Scale, Target, Coins, Clock, CheckCircle, XCircle,
  Save, RefreshCw, AlertCircle, Info, Zap, Shield
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface PurchaseOrderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseOrderSettingsModal: React.FC<PurchaseOrderSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'currency' | 'approval' | 'notifications'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    defaultCurrency: 'TZS',
    defaultPaymentTerms: 'net_30',
    defaultLeadTimeDays: 14,
    taxRate: 18,
    enableAutoNumbering: true,
    numberingPrefix: 'PO',
    enableDrafts: true,
    autoSaveDrafts: true
  });

  // Currency Settings
  const [currencySettings, setCurrencySettings] = useState({
    enableMultiCurrency: true,
    autoUpdateExchangeRates: true,
    exchangeRateSource: 'bank_of_tanzania',
    roundingPrecision: 2,
    showCurrencyFlags: true
  });

  // Approval Settings
  const [approvalSettings, setApprovalSettings] = useState({
    enableApprovalWorkflow: true,
    requireApprovalAbove: 100000, // TZS
    approvalLevels: 2,
    enableParallelApproval: false,
    autoApproveBelow: 10000 // TZS
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    enableNotifications: true,
    notifyOnCreation: true,
    notifyOnApproval: true,
    notifyOnDelivery: true,
    notifyLowStock: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Show success message
      alert('Purchase Order settings saved successfully!');
      onClose();
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Settings className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Purchase Order Settings</h2>
                <p className="text-gray-600">Configure purchase order system preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 p-2">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'currency', label: 'Currency', icon: Globe },
              { id: 'approval', label: 'Approval', icon: CheckCircle },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">General Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Currency
                    </label>
                    <select
                      value={generalSettings.defaultCurrency}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="TZS">TZS - Tanzanian Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Payment Terms
                    </label>
                    <select
                      value={generalSettings.defaultPaymentTerms}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, defaultPaymentTerms: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="net_15">Net 15</option>
                      <option value="net_30">Net 30</option>
                      <option value="net_45">Net 45</option>
                      <option value="net_60">Net 60</option>
                      <option value="advance">Advance Payment</option>
                      <option value="cod">Cash on Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      value={generalSettings.defaultLeadTimeDays}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, defaultLeadTimeDays: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="1"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={generalSettings.taxRate}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PO Number Prefix
                    </label>
                    <input
                      type="text"
                      value={generalSettings.numberingPrefix}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, numberingPrefix: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="PO"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={generalSettings.enableAutoNumbering}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, enableAutoNumbering: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable automatic PO numbering</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={generalSettings.enableDrafts}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, enableDrafts: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable draft purchase orders</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={generalSettings.autoSaveDrafts}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, autoSaveDrafts: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={!generalSettings.enableDrafts}
                    />
                    <span className="text-sm text-gray-700">Auto-save drafts</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Currency Settings Tab */}
          {activeTab === 'currency' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Currency Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={currencySettings.enableMultiCurrency}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, enableMultiCurrency: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable multi-currency support</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={currencySettings.autoUpdateExchangeRates}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, autoUpdateExchangeRates: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={!currencySettings.enableMultiCurrency}
                    />
                    <span className="text-sm text-gray-700">Auto-update exchange rates</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={currencySettings.showCurrencyFlags}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, showCurrencyFlags: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Show currency flags</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exchange Rate Source
                    </label>
                    <select
                      value={currencySettings.exchangeRateSource}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, exchangeRateSource: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={!currencySettings.enableMultiCurrency}
                    >
                      <option value="bank_of_tanzania">Bank of Tanzania</option>
                      <option value="xe_com">XE.com</option>
                      <option value="fixer_io">Fixer.io</option>
                      <option value="manual">Manual Entry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rounding Precision
                    </label>
                    <select
                      value={currencySettings.roundingPrecision}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, roundingPrecision: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="0">0 decimal places</option>
                      <option value="2">2 decimal places</option>
                      <option value="4">4 decimal places</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Settings Tab */}
          {activeTab === 'approval' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval Workflow</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={approvalSettings.enableApprovalWorkflow}
                      onChange={(e) => setApprovalSettings(prev => ({ ...prev, enableApprovalWorkflow: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable approval workflow</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={approvalSettings.enableParallelApproval}
                      onChange={(e) => setApprovalSettings(prev => ({ ...prev, enableParallelApproval: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={!approvalSettings.enableApprovalWorkflow}
                    />
                    <span className="text-sm text-gray-700">Enable parallel approval</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Require Approval Above (TZS)
                    </label>
                    <input
                      type="number"
                      value={approvalSettings.requireApprovalAbove}
                      onChange={(e) => setApprovalSettings(prev => ({ ...prev, requireApprovalAbove: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      disabled={!approvalSettings.enableApprovalWorkflow}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-approve Below (TZS)
                    </label>
                    <input
                      type="number"
                      value={approvalSettings.autoApproveBelow}
                      onChange={(e) => setApprovalSettings(prev => ({ ...prev, autoApproveBelow: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      disabled={!approvalSettings.enableApprovalWorkflow}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Levels
                    </label>
                    <select
                      value={approvalSettings.approvalLevels}
                      onChange={(e) => setApprovalSettings(prev => ({ ...prev, approvalLevels: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={!approvalSettings.enableApprovalWorkflow}
                    >
                      <option value="1">1 Level</option>
                      <option value="2">2 Levels</option>
                      <option value="3">3 Levels</option>
                      <option value="4">4 Levels</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.enableNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable notifications</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={!notificationSettings.enableNotifications}
                    />
                    <span className="text-sm text-gray-700">Email notifications</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={!notificationSettings.enableNotifications}
                    />
                    <span className="text-sm text-gray-700">SMS notifications</span>
                  </label>
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Notification Events</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyOnCreation}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnCreation: e.target.checked }))}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        disabled={!notificationSettings.enableNotifications}
                      />
                      <span className="text-sm text-gray-700">Purchase order creation</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyOnApproval}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnApproval: e.target.checked }))}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        disabled={!notificationSettings.enableNotifications}
                      />
                      <span className="text-sm text-gray-700">Approval status changes</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyOnDelivery}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnDelivery: e.target.checked }))}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        disabled={!notificationSettings.enableNotifications}
                      />
                      <span className="text-sm text-gray-700">Delivery updates</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyLowStock}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyLowStock: e.target.checked }))}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        disabled={!notificationSettings.enableNotifications}
                      />
                      <span className="text-sm text-gray-700">Low stock alerts</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Changes will be applied to all future purchase orders
            </div>
            <div className="flex gap-3">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleSave}
                disabled={isSaving}
                icon={isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                className="bg-gradient-to-r from-orange-500 to-amber-600 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default PurchaseOrderSettingsModal;