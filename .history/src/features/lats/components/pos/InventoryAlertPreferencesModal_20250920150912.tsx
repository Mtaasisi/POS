import React, { useState } from 'react';
import { X, Bell, BellOff, Settings, AlertTriangle, Clock, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryAlertPreferences } from '../../../../hooks/useInventoryAlertPreferences';
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock';

interface InventoryAlertPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryAlertPreferencesModal: React.FC<InventoryAlertPreferencesModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    preferences,
    loading,
    error,
    updatePreferences,
    reEnableAlerts,
    isLowStockAlertsEnabled,
    lowStockThreshold,
    showAlertsAsModal,
    showAlertsAsNotification,
    autoHideNotificationSeconds,
    areAlertsPermanentlyDisabled
  } = useInventoryAlertPreferences();

  const [isUpdating, setIsUpdating] = useState(false);

  // Prevent body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleUpdatePreference = async (key: string, value: any) => {
    setIsUpdating(true);
    try {
      const success = await updatePreferences({ [key]: value });
      if (success) {
        toast.success('Preferences updated successfully');
      } else {
        toast.error('Failed to update preferences');
      }
    } catch (err) {
      toast.error('Error updating preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReEnableAlerts = async () => {
    setIsUpdating(true);
    try {
      const success = await reEnableAlerts();
      if (success) {
        toast.success('Alerts re-enabled successfully');
      } else {
        toast.error('Failed to re-enable alerts');
      }
    } catch (err) {
      toast.error('Error re-enabling alerts');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading preferences...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Inventory Alert Preferences</h2>
              <p className="text-sm text-gray-500">Customize your inventory alert settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error loading preferences</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Alert Status */}
          {areAlertsPermanentlyDisabled && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellOff className="w-5 h-5 text-orange-600" />
                  <span className="text-orange-800 font-medium">Alerts are currently disabled</span>
                </div>
                <button
                  onClick={handleReEnableAlerts}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                >
                  {isUpdating ? 'Re-enabling...' : 'Re-enable'}
                </button>
              </div>
            </div>
          )}

          {/* Low Stock Threshold */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Low Stock Threshold
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="1000"
                value={lowStockThreshold}
                onChange={(e) => handleUpdatePreference('low_stock_threshold', parseInt(e.target.value))}
                disabled={isUpdating || areAlertsPermanentlyDisabled}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-500">units</span>
            </div>
            <p className="text-xs text-gray-500">
              Products with stock at or below this level will trigger alerts
            </p>
          </div>

          {/* Alert Types */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Alert Types
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isLowStockAlertsEnabled}
                  onChange={(e) => handleUpdatePreference('enable_low_stock_alerts', e.target.checked)}
                  disabled={isUpdating || areAlertsPermanentlyDisabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Low Stock Alerts</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences?.enable_out_of_stock_alerts ?? true}
                  onChange={(e) => handleUpdatePreference('enable_out_of_stock_alerts', e.target.checked)}
                  disabled={isUpdating || areAlertsPermanentlyDisabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Out of Stock Alerts</span>
              </label>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Display Preferences
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={showAlertsAsModal}
                  onChange={(e) => handleUpdatePreference('show_alerts_as_modal', e.target.checked)}
                  disabled={isUpdating || areAlertsPermanentlyDisabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Show as Modal</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={showAlertsAsNotification}
                  onChange={(e) => handleUpdatePreference('show_alerts_as_notification', e.target.checked)}
                  disabled={isUpdating || areAlertsPermanentlyDisabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Show as Notification</span>
              </label>
            </div>
          </div>

          {/* Notification Auto-Hide */}
          {showAlertsAsNotification && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Notification Auto-Hide
              </label>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={autoHideNotificationSeconds}
                  onChange={(e) => handleUpdatePreference('auto_hide_notification_seconds', parseInt(e.target.value))}
                  disabled={isUpdating || areAlertsPermanentlyDisabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-500">seconds</span>
              </div>
              <p className="text-xs text-gray-500">
                How long notifications stay visible before auto-hiding
              </p>
            </div>
          )}

          {/* Sound Alerts */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Sound Alerts
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences?.enable_sound_alerts ?? false}
                onChange={(e) => handleUpdatePreference('enable_sound_alerts', e.target.checked)}
                disabled={isUpdating || areAlertsPermanentlyDisabled}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <div className="flex items-center gap-2">
                {preferences?.enable_sound_alerts ? (
                  <Volume2 className="w-4 h-4 text-green-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">Enable Sound Alerts</span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryAlertPreferencesModal;
