import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, Settings } from 'lucide-react';

interface DailyClosureSettingsProps {
  onClose: () => void;
}

const DailyClosureSettings: React.FC<DailyClosureSettingsProps> = ({ onClose }) => {
  const [closureMode, setClosureMode] = useState<'flexible' | 'strict'>('flexible');
  const [requireAdminOverride, setRequireAdminOverride] = useState(false);
  const [autoCloseTime, setAutoCloseTime] = useState('23:00');

  const handleSave = () => {
    // Save settings to localStorage or database
    const settings = {
      closureMode,
      requireAdminOverride,
      autoCloseTime
    };
    
    localStorage.setItem('dailyClosureSettings', JSON.stringify(settings));
    console.log('Daily closure settings saved:', settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Daily Closure Settings</h3>
              <p className="text-sm text-gray-600">Configure closure behavior</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Closure Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Closure Behavior
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="closureMode"
                  value="flexible"
                  checked={closureMode === 'flexible'}
                  onChange={(e) => setClosureMode(e.target.value as 'flexible')}
                  className="text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Flexible Mode</div>
                    <div className="text-sm text-gray-600">Show warning but allow sales to continue</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="closureMode"
                  value="strict"
                  checked={closureMode === 'strict'}
                  onChange={(e) => setClosureMode(e.target.value as 'strict')}
                  className="text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">Strict Mode</div>
                    <div className="text-sm text-gray-600">Block sales after closure (admin override required)</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Admin Override */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={requireAdminOverride}
                onChange={(e) => setRequireAdminOverride(e.target.checked)}
                className="text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Require Admin Override</div>
                <div className="text-sm text-gray-600">Only admins can override closure restrictions</div>
              </div>
            </label>
          </div>

          {/* Auto Close Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Close Time (Optional)
            </label>
            <input
              type="time"
              value={autoCloseTime}
              onChange={(e) => setAutoCloseTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically close daily sales at this time
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyClosureSettings;
