import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface InventoryAlertPreferences {
  id?: string;
  user_id: string;
  is_enabled: boolean;
  low_stock_threshold: number;
  show_as_modal: boolean;
  show_as_notification: boolean;
  auto_hide_notification_seconds: number;
  dismissed_until: string | null;
  permanently_disabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AlertHistory {
  id?: string;
  user_id: string;
  alert_type: string;
  product_name: string;
  product_id: string;
  alert_data: any;
  dismissed_for_today: boolean;
  created_at?: string;
}

export const useInventoryAlertPreferences = () => {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState<InventoryAlertPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user preferences
  const loadPreferences = async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('inventory_alert_preferences')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading inventory alert preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPreferences: Omit<InventoryAlertPreferences, 'id' | 'created_at' | 'updated_at'> = {
          user_id: currentUser.id,
          is_enabled: true,
          low_stock_threshold: 10,
          show_as_modal: true,
          show_as_notification: true,
          auto_hide_notification_seconds: 5,
          dismissed_until: null,
          permanently_disabled: false
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('inventory_alert_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (createError) {
          console.error('Error creating default preferences:', createError);
        } else {
          setPreferences(newPrefs);
        }
      }
    } catch (error) {
      console.error('Error in loadPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update preferences
  const updatePreferences = async (updates: Partial<InventoryAlertPreferences>) => {
    if (!currentUser?.id || !preferences) return false;

    try {
      const { data, error } = await supabase
        .from('inventory_alert_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      setPreferences(data);
      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  };

  // Dismiss alerts for today
  const dismissAlertsForToday = async () => {
    if (!currentUser?.id) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return await updatePreferences({
      dismissed_until: tomorrow.toISOString()
    });
  };

  // Permanently disable alerts
  const permanentlyDisableAlerts = async () => {
    return await updatePreferences({
      permanently_disabled: true,
      is_enabled: false
    });
  };

  // Check if alerts are dismissed for today
  const areAlertsDismissedForToday = async (): Promise<boolean> => {
    if (!preferences?.dismissed_until) return false;

    const dismissedUntil = new Date(preferences.dismissed_until);
    const now = new Date();

    return now < dismissedUntil;
  };

  // Log alert history
  const logAlertHistory = async (
    alertType: string,
    productName: string,
    productId: string,
    alertData: any,
    dismissedForToday: boolean = false
  ) => {
    if (!currentUser?.id) return false;

    try {
      const alertHistory: Omit<AlertHistory, 'id' | 'created_at'> = {
        user_id: currentUser.id,
        alert_type: alertType,
        product_name: productName,
        product_id: productId,
        alert_data: alertData,
        dismissed_for_today: dismissedForToday
      };

      const { error } = await supabase
        .from('inventory_alert_history')
        .insert(alertHistory);

      if (error) {
        console.error('Error logging alert history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in logAlertHistory:', error);
      return false;
    }
  };

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [currentUser?.id]);

  return {
    preferences,
    loading,
    updatePreferences,
    dismissAlertsForToday,
    permanentlyDisableAlerts,
    areAlertsDismissedForToday,
    logAlertHistory,
    isLowStockAlertsEnabled: preferences?.is_enabled ?? true,
    lowStockThreshold: preferences?.low_stock_threshold ?? 10,
    showAlertsAsModal: preferences?.show_as_modal ?? true,
    showAlertsAsNotification: preferences?.show_as_notification ?? true,
    autoHideNotificationSeconds: preferences?.auto_hide_notification_seconds ?? 5,
    areAlertsPermanentlyDisabled: preferences?.permanently_disabled ?? false
  };
};
