import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { X, Settings, Calculator, CreditCard, Printer, Keyboard, Save } from 'lucide-react';

interface POSSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POSSettingsModal: React.FC<POSSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'receipt' | 'shortcuts'>('general');
  const [taxRate, setTaxRate] = useState(16);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('cash');
  const [autoPrint, setAutoPrint] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    // TODO: Save settings to localStorage or database
    console.log('Saving POS settings:', {
      taxRate,
      defaultPaymentMethod,
      autoPrint,
      soundEnabled
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-2xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">POS Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'general'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'payment'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payment
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'receipt'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Receipt
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'shortcuts'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Shortcuts
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sound Effects
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Enable sound effects for actions</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Payment Method
                  </label>
                  <select
                    value={defaultPaymentMethod}
                    onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="installment">Installment</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'receipt' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Print Receipt
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={autoPrint}
                      onChange={(e) => setAutoPrint(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Automatically print receipt after sale</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Template
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Customize your receipt template..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Keyboard Shortcuts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Process Sale:</span>
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">Ctrl + Enter</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hold Order:</span>
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">Ctrl + H</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear Cart:</span>
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">Ctrl + C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Print Receipt:</span>
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">Ctrl + P</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exit POS:</span>
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">Escape</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <GlassButton
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save Settings
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default POSSettingsModal; 