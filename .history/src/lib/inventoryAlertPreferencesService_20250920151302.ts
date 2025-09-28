import { supabase } from './supabaseClient';

export interface InventoryAlertPreferences {
  id?: string;
  user_id: string;
  low_stock_threshold: number;
  enable_low_stock_alerts: boolean;
  enable_out_of_stock_alerts: boolean;
  enable_price_change_alerts: boolean;
  enable_new_arrival_alerts: boolean;
  show_alerts_as_modal: boolean;
  show_alerts_as_notification: boolean;
  auto_hide_notification_seconds: number;
  alerts_dismissed_until?: string;
  alerts_permanently_disabled: boolean;
  enable_sound_alerts: boolean;
  enable_email_alerts: boolean;
  enable_whatsapp_alerts: boolean;
  alert_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  group_similar_alerts: boolean;
  max_alerts_per_session: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryAlertHistory {
  id?: string;
  user_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'price_change' | 'new_arrival';
  product_id?: string;
  product_name: string;
  alert_data: Record<string, any>;
  dismissed_at?: string;
  dismissed_until?: string;
  permanently_dismissed: boolean;
  created_at?: string;
}

class InventoryAlertPreferencesService {
  /**
   * Get user's inventory alert preferences
   */
  async getUserPreferences(userId: string): Promise<InventoryAlertPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('inventory_alert_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          return await this.createDefaultPreferences(userId);
        }
        // If table doesn't exist, return null and let the hook handle it
        if (error.message?.includes('relation "inventory_alert_preferences" does not exist') ||
            error.message?.includes('table "inventory_alert_preferences" does not exist')) {
          throw new Error('Table does not exist yet');
        }
        console.error('Error fetching inventory alert preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      throw error; // Re-throw to let the hook handle it
    }
  }

  /**
   * Create default preferences for a user
   */
  async createDefaultPreferences(userId: string): Promise<InventoryAlertPreferences | null> {
    try {
      const defaultPreferences: Omit<InventoryAlertPreferences, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        low_stock_threshold: 10,
        enable_low_stock_alerts: true,
        enable_out_of_stock_alerts: true,
        enable_price_change_alerts: false,
        enable_new_arrival_alerts: false,
        show_alerts_as_modal: true,
        show_alerts_as_notification: true,
        auto_hide_notification_seconds: 5,
        alerts_permanently_disabled: false,
        enable_sound_alerts: false,
        enable_email_alerts: false,
        enable_whatsapp_alerts: false,
        alert_frequency: 'immediate',
        group_similar_alerts: true,
        max_alerts_per_session: 5,
      };

      const { data, error } = await supabase
        .from('inventory_alert_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (error) {
        console.error('Error creating default preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createDefaultPreferences:', error);
      return null;
    }
  }

  /**
   * Update user's inventory alert preferences
   */
  async updatePreferences(userId: string, updates: Partial<InventoryAlertPreferences>): Promise<InventoryAlertPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('inventory_alert_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating inventory alert preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return null;
    }
  }

  /**
   * Dismiss alerts for today
   */
  async dismissAlertsForToday(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('inventory_alert_preferences')
        .update({ alerts_dismissed_until: today })
        .eq('user_id', userId);

      if (error) {
        console.error('Error dismissing alerts for today:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in dismissAlertsForToday:', error);
      return false;
    }
  }

  /**
   * Permanently disable alerts
   */
  async permanentlyDisableAlerts(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inventory_alert_preferences')
        .update({ 
          alerts_permanently_disabled: true,
          enable_low_stock_alerts: false,
          enable_out_of_stock_alerts: false
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error permanently disabling alerts:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in permanentlyDisableAlerts:', error);
      return false;
    }
  }

  /**
   * Re-enable alerts
   */
  async reEnableAlerts(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inventory_alert_preferences')
        .update({ 
          alerts_permanently_disabled: false,
          enable_low_stock_alerts: true,
          enable_out_of_stock_alerts: true,
          alerts_dismissed_until: null
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error re-enabling alerts:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in reEnableAlerts:', error);
      return false;
    }
  }

  /**
   * Check if alerts are dismissed for today
   */
  async areAlertsDismissedForToday(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return false;

      if (preferences.alerts_permanently_disabled) {
        return true;
      }

      if (preferences.alerts_dismissed_until) {
        const today = new Date().toISOString().split('T')[0];
        return preferences.alerts_dismissed_until >= today;
      }

      return false;
    } catch (error) {
      console.error('Error in areAlertsDismissedForToday:', error);
      return false;
    }
  }

  /**
   * Log alert history
   */
  async logAlertHistory(alertData: Omit<InventoryAlertHistory, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inventory_alert_history')
        .insert(alertData);

      if (error) {
        console.error('Error logging alert history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in logAlertHistory:', error);
      return false;
    }
  }

  /**
   * Get alert history for a user
   */
  async getAlertHistory(userId: string, limit: number = 50): Promise<InventoryAlertHistory[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_alert_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching alert history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAlertHistory:', error);
      return [];
    }
  }

  /**
   * Update alert dismissal in history
   */
  async updateAlertDismissal(
    userId: string, 
    alertType: string, 
    productId: string, 
    dismissedUntil?: string, 
    permanentlyDismissed: boolean = false
  ): Promise<boolean> {
    try {
      const updateData: any = {
        dismissed_at: new Date().toISOString(),
        permanently_dismissed: permanentlyDismissed
      };

      if (dismissedUntil) {
        updateData.dismissed_until = dismissedUntil;
      }

      const { error } = await supabase
        .from('inventory_alert_history')
        .update(updateData)
        .eq('user_id', userId)
        .eq('alert_type', alertType)
        .eq('product_id', productId)
        .is('dismissed_at', null); // Only update undismissed alerts

      if (error) {
        console.error('Error updating alert dismissal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateAlertDismissal:', error);
      return false;
    }
  }
}

export const inventoryAlertPreferencesService = new InventoryAlertPreferencesService();
