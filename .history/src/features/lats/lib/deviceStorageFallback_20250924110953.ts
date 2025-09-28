// Device Storage Fallback
// Simple localStorage-based device storage that works immediately
// This will be used when the database table doesn't exist yet

export interface DeviceStorageItem {
  device_name: string;
  device_category?: string;
  device_brand?: string;
  usage_count: number;
  last_used: string;
}

class DeviceStorageFallback {
  private readonly STORAGE_KEY = 'lats_saved_devices';
  private cache: Map<string, DeviceStorageItem> = new Map();
  private cacheLoaded = false;

  constructor() {
    this.loadCache();
  }

  /**
   * Load device preferences from localStorage
   */
  async loadDevices(): Promise<DeviceStorageItem[]> {
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

  /**
   * Save device preference to localStorage
   */
  async saveDevice(deviceName: string, category?: string, brand?: string): Promise<boolean> {
    try {
      const deviceData = {
        device_name: deviceName,
        device_category: category,
        device_brand: brand,
        usage_count: 1,
        last_used: new Date().toISOString()
      };

      const devices = await this.loadDevices();
      const existingIndex = devices.findIndex(d => d.device_name === deviceData.device_name);
      
      if (existingIndex >= 0) {
        devices[existingIndex] = deviceData;
      } else {
        devices.push(deviceData);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(devices));
      this.updateCache(devices);
      
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Increment usage count for a device
   */
  async incrementUsage(deviceName: string): Promise<void> {
    try {
      const devices = await this.loadDevices();
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

  /**
   * Remove device preference
   */
  async removeDevice(deviceName: string): Promise<boolean> {
    try {
      const devices = await this.loadDevices();
      const filteredDevices = devices.filter(d => d.device_name !== deviceName);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDevices));
      this.updateCache(filteredDevices);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Search devices
   */
  async searchDevices(query: string): Promise<DeviceStorageItem[]> {
    const allDevices = await this.loadDevices();
    return allDevices
      .filter(device => 
        device.device_name.toLowerCase().includes(query.toLowerCase()) ||
        device.device_brand?.toLowerCase().includes(query.toLowerCase()) ||
        device.device_category?.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 8);
  }

  // Cache management
  private loadCache(): void {
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
  getStorageMode(): string {
    return 'localStorage (fallback)';
  }
}

// Export singleton instance
export const deviceStorageFallback = new DeviceStorageFallback();
export default deviceStorageFallback;
