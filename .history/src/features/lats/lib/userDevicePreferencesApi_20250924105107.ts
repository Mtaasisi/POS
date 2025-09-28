// User Device Preferences API
// Handles saving and retrieving user's custom device preferences for spare parts

import { supabase } from '../../../lib/supabase';

export interface UserDevicePreference {
  id: string;
  user_id: string;
  device_name: string;
  device_category?: string;
  device_brand?: string;
  usage_count: number;
  last_used: string;
  created_at: string;
  updated_at: string;
}

export interface DevicePreferenceInput {
  device_name: string;
  device_category?: string;
  device_brand?: string;
}

class UserDevicePreferencesApi {
  /**
   * Get all device preferences for the current user
   */
  async getUserDevicePreferences(): Promise<UserDevicePreference[]> {
    try {
      const { data, error } = await supabase
        .from('user_device_preferences')
        .select('*')
        .order('last_used', { ascending: false });

      if (error) {
        console.error('Error fetching user device preferences:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user device preferences:', error);
      return [];
    }
  }

  /**
   * Save or update a device preference for the current user
   */
  async saveDevicePreference(deviceData: DevicePreferenceInput): Promise<UserDevicePreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_device_preferences')
        .upsert({
          device_name: deviceData.device_name,
          device_category: deviceData.device_category,
          device_brand: deviceData.device_brand,
          usage_count: 1,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'user_id,device_name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving device preference:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save device preference:', error);
      return null;
    }
  }

  /**
   * Increment usage count for a device
   */
  async incrementDeviceUsage(deviceName: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('increment_device_usage', {
          device_name_param: deviceName
        });

      if (error) {
        console.error('Error incrementing device usage:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to increment device usage:', error);
    }
  }

  /**
   * Remove a device preference
   */
  async removeDevicePreference(deviceName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_device_preferences')
        .delete()
        .eq('device_name', deviceName);

      if (error) {
        console.error('Error removing device preference:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to remove device preference:', error);
      return false;
    }
  }

  /**
   * Get most frequently used devices
   */
  async getMostUsedDevices(limit: number = 10): Promise<UserDevicePreference[]> {
    try {
      const { data, error } = await supabase
        .from('user_device_preferences')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching most used devices:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch most used devices:', error);
      return [];
    }
  }

  /**
   * Get recently used devices
   */
  async getRecentDevices(limit: number = 10): Promise<UserDevicePreference[]> {
    try {
      const { data, error } = await supabase
        .from('user_device_preferences')
        .select('*')
        .order('last_used', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent devices:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch recent devices:', error);
      return [];
    }
  }

  /**
   * Search devices by name
   */
  async searchDevices(query: string, limit: number = 8): Promise<UserDevicePreference[]> {
    try {
      const { data, error } = await supabase
        .from('user_device_preferences')
        .select('*')
        .ilike('device_name', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching devices:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search devices:', error);
      return [];
    }
  }
}

// Export singleton instance
export const userDevicePreferencesApi = new UserDevicePreferencesApi();
export default userDevicePreferencesApi;
