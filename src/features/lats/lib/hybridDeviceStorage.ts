// Hybrid Device Storage Service
// Uses database in production, localStorage as fallback in development/offline

import { userDevicePreferencesApi, UserDevicePreference } from './userDevicePreferencesApi';
import { deviceStorageFallback } from './deviceStorageFallback';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

export interface DeviceStorageItem {
  device_name: string;
  device_category?: string;
  device_brand?: string;
  usage_count: number;
  last_used: string;
}

class HybridDeviceStorage {
  private readonly STORAGE_KEY = 'lats_saved_devices';
  private readonly isProduction: boolean;
  private cache: Map<string, DeviceStorageItem> = new Map();
  private cacheLoaded = false;

  constructor() {
    // Check if we're in production mode
    this.isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
    
    // TEMPORARY: Always use localStorage until database migration is applied
    // TODO: Remove this line after running the migration: 20250201000001_create_user_device_preferences.sql
    this.isProduction = false;
    
    // Load cache on initialization
    this.loadCache();
  }

  /**
   * Load device preferences from appropriate storage
   */
  async loadDevices(): Promise<DeviceStorageItem[]> {
    if (this.isProduction) {
      return await this.loadFromDatabase();
    } else {
      return await this.loadFromLocalStorage();
    }
  }

  /**
   * Save device preference to appropriate storage
   */
  async saveDevice(deviceName: string, category?: string, brand?: string): Promise<boolean> {
    const deviceData = {
      device_name: deviceName,
      device_category: category,
      device_brand: brand,
      usage_count: 1,
      last_used: new Date().toISOString()
    };

    if (this.isProduction) {
      return await this.saveToDatabase(deviceData);
    } else {
      return await this.saveToLocalStorage(deviceData);
    }
  }

  /**
   * Increment usage count for a device
   */
  async incrementUsage(deviceName: string): Promise<void> {
    if (this.isProduction) {
      await this.incrementUsageInDatabase(deviceName);
    } else {
      await this.incrementUsageInLocalStorage(deviceName);
    }
  }

  /**
   * Remove device preference
   */
  async removeDevice(deviceName: string): Promise<boolean> {
    if (this.isProduction) {
      return await this.removeFromDatabase(deviceName);
    } else {
      return await this.removeFromLocalStorage(deviceName);
    }
  }

  /**
   * Search devices
   */
  async searchDevices(query: string): Promise<DeviceStorageItem[]> {
    try {
      // If we're in production mode, try database search first
      if (this.isProduction) {
        try {
          const { error: tableCheckError } = await supabase
            .from('user_device_preferences')
            .select('id')
            .limit(1);

          // If table exists, use database search
          if (!tableCheckError || tableCheckError.code !== '42P01') {
            return await userDevicePreferencesApi.searchDevices(query);
          }
        } catch (error) {
          console.log('Database search failed, falling back to local search');
        }
      }

      // Fall back to local search
      const allDevices = await this.loadDevices();
      return allDevices
        .filter(device => 
          device.device_name.toLowerCase().includes(query.toLowerCase()) ||
          device.device_brand?.toLowerCase().includes(query.toLowerCase()) ||
          device.device_category?.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 8);
    } catch (error) {
      console.error('Error searching devices:', error);
      return [];
    }
  }

  // Database methods
  private async loadFromDatabase(): Promise<DeviceStorageItem[]> {
    try {
      // Check if the table exists by trying a simple query
      const { data, error } = await supabase
        .from('user_device_preferences')
        .select('id')
        .limit(1);

      // If table doesn't exist, fall back to localStorage
      if (error && error.code === '42P01') { // Table doesn't exist
        console.log('User device preferences table not found, using localStorage');
        return await this.loadFromLocalStorage();
      }

      const preferences = await userDevicePreferencesApi.getUserDevicePreferences();
      const devices: DeviceStorageItem[] = preferences.map(pref => ({
        device_name: pref.device_name,
        device_category: pref.device_category,
        device_brand: pref.device_brand,
        usage_count: pref.usage_count,
        last_used: pref.last_used
      }));

      // Update cache
      this.updateCache(devices);
      return devices;
    } catch (error) {
      console.error('Failed to load from database, falling back to localStorage:', error);
      return await this.loadFromLocalStorage();
    }
  }

  private async saveToDatabase(deviceData: DeviceStorageItem): Promise<boolean> {
    try {
      // Check if the table exists first
      const { error: tableCheckError } = await supabase
        .from('user_device_preferences')
        .select('id')
        .limit(1);

      // If table doesn't exist, fall back to localStorage
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log('User device preferences table not found, saving to localStorage');
        return await this.saveToLocalStorage(deviceData);
      }

      const result = await userDevicePreferencesApi.saveDevicePreference(deviceData);
      if (result) {
        this.updateCacheItem(deviceData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save to database, falling back to localStorage:', error);
      return await this.saveToLocalStorage(deviceData);
    }
  }

  private async incrementUsageInDatabase(deviceName: string): Promise<void> {
    try {
      // Check if the table exists first
      const { error: tableCheckError } = await supabase
        .from('user_device_preferences')
        .select('id')
        .limit(1);

      // If table doesn't exist, fall back to localStorage
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log('User device preferences table not found, using localStorage');
        await this.incrementUsageInLocalStorage(deviceName);
        return;
      }

      await userDevicePreferencesApi.incrementDeviceUsage(deviceName);
      this.incrementCacheUsage(deviceName);
    } catch (error) {
      console.error('Failed to increment usage in database:', error);
      await this.incrementUsageInLocalStorage(deviceName);
    }
  }

  private async removeFromDatabase(deviceName: string): Promise<boolean> {
    try {
      // Check if the table exists first
      const { error: tableCheckError } = await supabase
        .from('user_device_preferences')
        .select('id')
        .limit(1);

      // If table doesn't exist, fall back to localStorage
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log('User device preferences table not found, using localStorage');
        return await this.removeFromLocalStorage(deviceName);
      }

      const result = await userDevicePreferencesApi.removeDevicePreference(deviceName);
      if (result) {
        this.removeFromCache(deviceName);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove from database, falling back to localStorage:', error);
      return await this.removeFromLocalStorage(deviceName);
    }
  }

  // LocalStorage methods
  private async loadFromLocalStorage(): Promise<DeviceStorageItem[]> {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const devices: DeviceStorageItem[] = JSON.parse(saved);
        this.updateCache(devices);
        return devices;
      }
      return [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  private async saveToLocalStorage(deviceData: DeviceStorageItem): Promise<boolean> {
    try {
      const devices = await this.loadFromLocalStorage();
      const existingIndex = devices.findIndex(d => d.device_name === deviceData.device_name);
      
      if (existingIndex >= 0) {
        devices[existingIndex] = deviceData;
      } else {
        devices.push(deviceData);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(devices));
      this.updateCache(devices);
      
      // Show success message
      toast.success(`"${deviceData.device_name}" added to your device suggestions!`, {
        duration: 3000,
        icon: '📱',
      });
      
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast.error('Failed to save device to suggestions');
      return false;
    }
  }

  private async incrementUsageInLocalStorage(deviceName: string): Promise<void> {
    try {
      const devices = await this.loadFromLocalStorage();
      const device = devices.find(d => d.device_name === deviceName);
      if (device) {
        device.usage_count += 1;
        device.last_used = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(devices));
        this.updateCache(devices);
      }
    } catch (error) {
      console.error('Error incrementing usage in localStorage:', error);
    }
  }

  private async removeFromLocalStorage(deviceName: string): Promise<boolean> {
    try {
      const devices = await this.loadFromLocalStorage();
      const filteredDevices = devices.filter(d => d.device_name !== deviceName);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDevices));
      this.updateCache(filteredDevices);
      toast.success(`"${deviceName}" removed from suggestions`);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // Cache management
  private loadCache(): void {
    // Load cache from localStorage as initial fallback
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const devices: DeviceStorageItem[] = JSON.parse(saved);
        this.updateCache(devices);
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
  }

  private updateCache(devices: DeviceStorageItem[]): void {
    this.cache.clear();
    devices.forEach(device => {
      this.cache.set(device.device_name, device);
    });
    this.cacheLoaded = true;
  }

  private updateCacheItem(device: DeviceStorageItem): void {
    this.cache.set(device.device_name, device);
  }

  private incrementCacheUsage(deviceName: string): void {
    const device = this.cache.get(deviceName);
    if (device) {
      device.usage_count += 1;
      device.last_used = new Date().toISOString();
      this.cache.set(deviceName, device);
    }
  }

  private removeFromCache(deviceName: string): void {
    this.cache.delete(deviceName);
  }

  /**
   * Get cached devices (for immediate access)
   */
  getCachedDevices(): DeviceStorageItem[] {
    return Array.from(this.cache.values());
  }

  /**
   * Check if cache is loaded
   */
  isCacheLoaded(): boolean {
    return this.cacheLoaded;
  }

  /**
   * Get storage mode
   */
  getStorageMode(): 'database' | 'localStorage' {
    return this.isProduction ? 'database' : 'localStorage';
  }
}

// Export singleton instance
export const hybridDeviceStorage = new HybridDeviceStorage();
export default hybridDeviceStorage;
