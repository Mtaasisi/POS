import { supabase } from './supabaseClient';

export interface Setting {
  key: string;
  value: string;
}

export interface SettingsData {
  [key: string]: any;
}

/**
 * Get a single setting by key
 */
export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.error('Error fetching setting:', error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error('Error fetching setting:', error);
    return null;
  }
};

/**
 * Get all settings
 */
export const getSettings = async (): Promise<SettingsData> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching settings:', error);
      return {};
    }

    const settings: SettingsData = {};
    data?.forEach(setting => {
      try {
        // Try to parse JSON values, fallback to string
        settings[setting.key] = JSON.parse(setting.value);
      } catch {
        settings[setting.key] = setting.value;
      }
    });

    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
};

/**
 * Update a single setting
 */
export const updateSetting = async (key: string, value: any): Promise<boolean> => {
  try {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value: stringValue }, { onConflict: 'key' });

    if (error) {
      console.error('Error updating setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
};

/**
 * Update multiple settings at once
 */
export const updateSettings = async (settings: SettingsData): Promise<boolean> => {
  try {
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));

    const { error } = await supabase
      .from('settings')
      .upsert(settingsArray, { onConflict: 'key' });

    if (error) {
      console.error('Error updating settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
};

/**
 * Delete a setting
 */
export const deleteSetting = async (key: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Error deleting setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting setting:', error);
    return false;
  }
};

/**
 * Get default settings (fallback values)
 */
export const getDefaultSettings = (): SettingsData => ({
  app_name: 'Repair Management System',
  app_description: 'Comprehensive device repair and customer management system',
  default_currency: 'TZS',
  timezone: 'Africa/Dar_es_Salaam',
  date_format: 'DD/MM/YYYY',
  time_format: 'HH:mm',
  contact_email: '',
  contact_phone: '',
  background_theme: 'default',
  sms_notifications_enabled: false,
  whatsapp_notifications_enabled: false,
  email_notifications_enabled: false,
  in_app_notifications_enabled: true,
  debug_mode: false,
  reminder_service_enabled: true,
  offline_sync_enabled: true
}); 