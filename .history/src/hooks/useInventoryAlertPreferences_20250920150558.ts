import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  inventoryAlertPreferencesService, 
  InventoryAlertPreferences 
} from '../lib/inventoryAlertPreferencesService';

export const useInventoryAlertPreferences = () => {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState<InventoryAlertPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userPreferences = await inventoryAlertPreferencesService.getUserPreferences(currentUser.id);
      setPreferences(userPreferences);
    } catch (err) {
      console.error('Error loading inventory alert preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<InventoryAlertPreferences>) => {
    if (!currentUser?.id) return false;

    try {
      setError(null);
      const updatedPreferences = await inventoryAlertPreferencesService.updatePreferences(
        currentUser.id, 
        updates
      );
      
      if (updatedPreferences) {
        setPreferences(updatedPreferences);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating inventory alert preferences:', err);
      setError('Failed to update preferences');
      return false;
    }
  }, [currentUser?.id]);

  // Dismiss alerts for today
  const dismissAlertsForToday = useCallback(async () => {
    if (!currentUser?.id) return false;

    try {
      const success = await inventoryAlertPreferencesService.dismissAlertsForToday(currentUser.id);
      if (success) {
        await loadPreferences(); // Reload preferences to get updated state
      }
      return success;
    } catch (err) {
      console.error('Error dismissing alerts for today:', err);
      setError('Failed to dismiss alerts');
      return false;
    }
  }, [currentUser?.id, loadPreferences]);

  // Permanently disable alerts
  const permanentlyDisableAlerts = useCallback(async () => {
    if (!currentUser?.id) return false;

    try {
      const success = await inventoryAlertPreferencesService.permanentlyDisableAlerts(currentUser.id);
      if (success) {
        await loadPreferences(); // Reload preferences to get updated state
      }
      return success;
    } catch (err) {
      console.error('Error permanently disabling alerts:', err);
      setError('Failed to disable alerts');
      return false;
    }
  }, [currentUser?.id, loadPreferences]);

  // Re-enable alerts
  const reEnableAlerts = useCallback(async () => {
    if (!currentUser?.id) return false;

    try {
      const success = await inventoryAlertPreferencesService.reEnableAlerts(currentUser.id);
      if (success) {
        await loadPreferences(); // Reload preferences to get updated state
      }
      return success;
    } catch (err) {
      console.error('Error re-enabling alerts:', err);
      setError('Failed to re-enable alerts');
      return false;
    }
  }, [currentUser?.id, loadPreferences]);

  // Check if alerts are dismissed for today
  const areAlertsDismissedForToday = useCallback(async (): Promise<boolean> => {
    if (!currentUser?.id) return false;

    try {
      return await inventoryAlertPreferencesService.areAlertsDismissedForToday(currentUser.id);
    } catch (err) {
      console.error('Error checking if alerts are dismissed:', err);
      return false;
    }
  }, [currentUser?.id]);

  // Log alert history
  const logAlertHistory = useCallback(async (
    alertType: 'low_stock' | 'out_of_stock' | 'price_change' | 'new_arrival',
    productName: string,
    productId?: string,
    alertData: Record<string, any> = {}
  ) => {
    if (!currentUser?.id) return false;

    try {
      return await inventoryAlertPreferencesService.logAlertHistory({
        user_id: currentUser.id,
        alert_type: alertType,
        product_id: productId,
        product_name: productName,
        alert_data: alertData
      });
    } catch (err) {
      console.error('Error logging alert history:', err);
      return false;
    }
  }, [currentUser?.id]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    loadPreferences,
    updatePreferences,
    dismissAlertsForToday,
    permanentlyDisableAlerts,
    reEnableAlerts,
    areAlertsDismissedForToday,
    logAlertHistory,
    // Convenience getters
    isLowStockAlertsEnabled: preferences?.enable_low_stock_alerts ?? true,
    isOutOfStockAlertsEnabled: preferences?.enable_out_of_stock_alerts ?? true,
    lowStockThreshold: preferences?.low_stock_threshold ?? 10,
    showAlertsAsModal: preferences?.show_alerts_as_modal ?? true,
    showAlertsAsNotification: preferences?.show_alerts_as_notification ?? true,
    autoHideNotificationSeconds: preferences?.auto_hide_notification_seconds ?? 5,
    areAlertsPermanentlyDisabled: preferences?.alerts_permanently_disabled ?? false,
    areAlertsDismissedUntilToday: preferences?.alerts_dismissed_until ? 
      new Date(preferences.alerts_dismissed_until) >= new Date(new Date().toISOString().split('T')[0]) : false
  };
};
