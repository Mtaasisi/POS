import { supabase } from './supabaseClient';

export interface DevicePriceUpdate {
  deviceId: string;
  repairPrice: number;
  updatedBy: string;
  reason?: string;
}

export interface DevicePriceHistory {
  id: string;
  device_id: string;
  old_price: number;
  new_price: number;
  reason: string;
  updated_by: string;
  updated_at: string;
}

class DevicePriceService {
  // Update device repair price
  async updateDeviceRepairPrice(data: DevicePriceUpdate): Promise<boolean> {
    try {
      console.log('💰 DevicePriceService: Updating device repair price...', data);

      // Get current device price for history
      const { data: currentDevice, error: fetchError } = await supabase
        .from('devices')
        .select('repair_price')
        .eq('id', data.deviceId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current device price:', fetchError);
        throw new Error('Failed to fetch current device price');
      }

      const oldPrice = currentDevice?.repair_price || 0;

      // Update device repair price
      const { error: updateError } = await supabase
        .from('devices')
        .update({ 
          repair_price: data.repairPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.deviceId);

      if (updateError) {
        console.error('❌ Error updating device repair price:', updateError);
        throw new Error('Failed to update device repair price');
      }

      // Record price change history
      await this.recordPriceChange({
        deviceId: data.deviceId,
        oldPrice,
        newPrice: data.repairPrice,
        reason: data.reason || 'Price adjustment',
        updatedBy: data.updatedBy
      });

      console.log('✅ Device repair price updated successfully');
      return true;
    } catch (error) {
      console.error('❌ DevicePriceService: Error updating device repair price:', error);
      throw error;
    }
  }

  // Record price change in history
  private async recordPriceChange(data: {
    deviceId: string;
    oldPrice: number;
    newPrice: number;
    reason: string;
    updatedBy: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('device_price_history')
        .insert({
          device_id: data.deviceId,
          old_price: data.oldPrice,
          new_price: data.newPrice,
          reason: data.reason,
          updated_by: data.updatedBy,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('⚠️ Error recording price change history:', error);
        // Don't throw error as the main update was successful
      }
    } catch (error) {
      console.error('⚠️ Error recording price change history:', error);
    }
  }

  // Get device price history
  async getDevicePriceHistory(deviceId: string): Promise<DevicePriceHistory[]> {
    try {
      const { data, error } = await supabase
        .from('device_price_history')
        .select('*')
        .eq('device_id', deviceId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching device price history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ DevicePriceService: Error fetching device price history:', error);
      return [];
    }
  }

  // Get current device repair price
  async getDeviceRepairPrice(deviceId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('repair_price')
        .eq('id', deviceId)
        .single();

      if (error) {
        console.error('❌ Error fetching device repair price:', error);
        return 0;
      }

      return data?.repair_price || 0;
    } catch (error) {
      console.error('❌ DevicePriceService: Error fetching device repair price:', error);
      return 0;
    }
  }
}

export const devicePriceService = new DevicePriceService();
