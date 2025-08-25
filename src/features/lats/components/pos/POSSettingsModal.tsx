import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { X, Save, Settings } from 'lucide-react';

// Import settings tabs
import GeneralSettingsTab from './GeneralSettingsTab';
import DynamicPricingSettingsTab from './DynamicPricingSettingsTab';
import ReceiptSettingsTab from './ReceiptSettingsTab';
import BarcodeScannerSettingsTab from './BarcodeScannerSettingsTab';
import DeliverySettingsTab from './DeliverySettingsTab';
import SearchFilterSettingsTab from './SearchFilterSettingsTab';
import UserPermissionsSettingsTab from './UserPermissionsSettingsTab';
import LoyaltyCustomerSettingsTab from './LoyaltyCustomerSettingsTab';
import AnalyticsReportingSettingsTab from './AnalyticsReportingSettingsTab';
import AdvancedNotificationSettingsTab from './AdvancedNotificationSettingsTab';
import AdvancedSettingsTab from './AdvancedSettingsTab';

// Import hooks
import { 
  useDynamicPricingSettings,
  useGeneralSettings,
  useReceiptSettings,
  useBarcodeScannerSettings,
  useDeliverySettings,
  useSearchFilterSettings,
  useUserPermissionsSettings,
  useLoyaltyCustomerSettings,
  useAnalyticsReportingSettings,
  useNotificationSettings,
  useAdvancedSettings
} from '../../../../hooks/usePOSSettings';

interface POSSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface POSSettingsModalRef {
  saveCurrentTabSettings: () => Promise<boolean>;
}

const POSSettingsModal = forwardRef<POSSettingsModalRef, POSSettingsModalProps>(
  ({ isOpen, onClose }, ref) => {
    const [activeSettingsTab, setActiveSettingsTab] = useState('general');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Settings hooks
    const { settings: generalSettings, saveSettings: saveGeneralSettings } = useGeneralSettings();
    const { settings: dynamicPricingSettings, saveSettings: saveDynamicPricingSettings } = useDynamicPricingSettings();
    const { settings: receiptSettings, saveSettings: saveReceiptSettings } = useReceiptSettings();
    const { settings: barcodeScannerSettings, saveSettings: saveBarcodeScannerSettings } = useBarcodeScannerSettings();
    const { settings: deliverySettings, saveSettings: saveDeliverySettings } = useDeliverySettings();
    const { settings: searchFilterSettings, saveSettings: saveSearchFilterSettings } = useSearchFilterSettings();
    const { settings: userPermissionsSettings, saveSettings: saveUserPermissionsSettings } = useUserPermissionsSettings();
    const { settings: loyaltyCustomerSettings, saveSettings: saveLoyaltyCustomerSettings } = useLoyaltyCustomerSettings();
    const { settings: analyticsReportingSettings, saveSettings: saveAnalyticsReportingSettings } = useAnalyticsReportingSettings();
    const { settings: notificationSettings, saveSettings: saveNotificationSettings } = useNotificationSettings();
    const { settings: advancedSettings, saveSettings: saveAdvancedSettings } = useAdvancedSettings();

    // Settings refs to access current settings from tabs
    const generalSettingsRef = useRef<any>(null);
    const dynamicPricingSettingsRef = useRef<any>(null);
    const receiptSettingsRef = useRef<any>(null);
    const barcodeScannerSettingsRef = useRef<any>(null);
    const deliverySettingsRef = useRef<any>(null);
    const searchFilterSettingsRef = useRef<any>(null);
    const userPermissionsSettingsRef = useRef<any>(null);
    const loyaltyCustomerSettingsRef = useRef<any>(null);
    const analyticsReportingSettingsRef = useRef<any>(null);
    const notificationSettingsRef = useRef<any>(null);
    const advancedSettingsRef = useRef<any>(null);

    // Function to save current active tab settings
    const saveCurrentTabSettings = async () => {
      setIsSavingSettings(true);
      
      try {
        // Get the current settings ref based on active tab
        let saveFunction: (() => Promise<void>) | null = null;
        
        switch (activeSettingsTab) {
          case 'general':
            saveFunction = () => saveGeneralSettings(generalSettingsRef.current?.getSettings() || generalSettings);
            break;
          case 'pricing':
            saveFunction = () => saveDynamicPricingSettings(dynamicPricingSettingsRef.current?.getSettings() || dynamicPricingSettings);
            break;
          case 'receipt':
            saveFunction = () => saveReceiptSettings(receiptSettingsRef.current?.getSettings() || receiptSettings);
            break;
          case 'scanner':
            saveFunction = () => saveBarcodeScannerSettings(barcodeScannerSettingsRef.current?.getSettings() || barcodeScannerSettings);
            break;
          case 'delivery':
            saveFunction = () => saveDeliverySettings(deliverySettingsRef.current?.getSettings() || deliverySettings);
            break;
          case 'search':
            saveFunction = () => saveSearchFilterSettings(searchFilterSettingsRef.current?.getSettings() || searchFilterSettings);
            break;
          case 'permissions':
            saveFunction = () => saveUserPermissionsSettings(userPermissionsSettingsRef.current?.getSettings() || userPermissionsSettings);
            break;
          case 'loyalty':
            saveFunction = () => saveLoyaltyCustomerSettings(loyaltyCustomerSettingsRef.current?.getSettings() || loyaltyCustomerSettings);
            break;
          case 'analytics':
            saveFunction = () => saveAnalyticsReportingSettings(analyticsReportingSettingsRef.current?.getSettings() || analyticsReportingSettings);
            break;
          case 'notifications':
            saveFunction = () => saveNotificationSettings(notificationSettingsRef.current?.getSettings() || notificationSettings);
            break;
          case 'advanced':
            saveFunction = () => saveAdvancedSettings(advancedSettingsRef.current?.getSettings() || advancedSettings);
            break;
          default:
            throw new Error(`Unknown settings tab: ${activeSettingsTab}`);
        }

        if (saveFunction) {
          await saveFunction();
          toast.success(`${activeSettingsTab.charAt(0).toUpperCase() + activeSettingsTab.slice(1)} settings saved successfully`);
          return true;
        } else {
          throw new Error(`No save function available for ${activeSettingsTab} settings`);
        }
      } catch (error) {
        toast.error(`Failed to save ${activeSettingsTab} settings. Please try again.`);
        return false;
      } finally {
        setIsSavingSettings(false);
      }
    };

    // Expose save function to parent component
    useImperativeHandle(ref, () => ({
      saveCurrentTabSettings
    }));

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <GlassCard className="w-full max-w-6xl p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">POS Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Settings Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveSettingsTab('general')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveSettingsTab('pricing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'pricing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dynamic Pricing
            </button>
            <button
              onClick={() => setActiveSettingsTab('receipt')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'receipt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Receipt
            </button>
            <button
              onClick={() => setActiveSettingsTab('scanner')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'scanner'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Barcode Scanner
            </button>
            <button
              onClick={() => setActiveSettingsTab('delivery')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'delivery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setActiveSettingsTab('search')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Search & Filter
            </button>
            <button
              onClick={() => setActiveSettingsTab('permissions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'permissions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Permissions
            </button>
            <button
              onClick={() => setActiveSettingsTab('loyalty')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'loyalty'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Loyalty
            </button>
            <button
              onClick={() => setActiveSettingsTab('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveSettingsTab('notifications')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'notifications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveSettingsTab('advanced')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSettingsTab === 'advanced'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Advanced
            </button>
          </div>

          {/* Settings Content */}
          <div className="min-h-[400px]">
            {/* General Settings Tab */}
            {activeSettingsTab === 'general' && (
              <GeneralSettingsTab ref={generalSettingsRef} />
            )}

            {/* Dynamic Pricing Settings Tab */}
            {activeSettingsTab === 'pricing' && (
              <DynamicPricingSettingsTab ref={dynamicPricingSettingsRef} />
            )}

            {/* Receipt Settings Tab */}
            {activeSettingsTab === 'receipt' && (
              <ReceiptSettingsTab ref={receiptSettingsRef} />
            )}

            {/* Barcode Scanner Settings Tab */}
            {activeSettingsTab === 'scanner' && (
              <BarcodeScannerSettingsTab ref={barcodeScannerSettingsRef} />
            )}

            {/* Delivery Settings Tab */}
            {activeSettingsTab === 'delivery' && (
              <DeliverySettingsTab ref={deliverySettingsRef} />
            )}

            {/* Search & Filter Settings Tab */}
            {activeSettingsTab === 'search' && (
              <SearchFilterSettingsTab ref={searchFilterSettingsRef} />
            )}

            {/* User Permissions Settings Tab */}
            {activeSettingsTab === 'permissions' && (
              <UserPermissionsSettingsTab ref={userPermissionsSettingsRef} />
            )}

            {/* Loyalty & Customer Settings Tab */}
            {activeSettingsTab === 'loyalty' && (
              <LoyaltyCustomerSettingsTab ref={loyaltyCustomerSettingsRef} />
            )}

            {/* Analytics & Reporting Settings Tab */}
            {activeSettingsTab === 'analytics' && (
              <AnalyticsReportingSettingsTab ref={analyticsReportingSettingsRef} />
            )}

            {/* Advanced Notification Settings Tab */}
            {activeSettingsTab === 'notifications' && (
              <AdvancedNotificationSettingsTab ref={notificationSettingsRef} />
            )}

            {/* Advanced Settings Tab */}
            {activeSettingsTab === 'advanced' && (
              <AdvancedSettingsTab ref={advancedSettingsRef} />
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
            <GlassButton
              onClick={onClose}
              variant="secondary"
              className="flex-1 py-3 text-lg font-semibold"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={saveCurrentTabSettings}
              disabled={isSavingSettings}
              className="flex-1 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              {isSavingSettings ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Settings
                </div>
              )}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }
);

POSSettingsModal.displayName = 'POSSettingsModal';

export default POSSettingsModal;
