import { supabase } from '../../../lib/supabase';

export interface DevicePriceHistoryEntry {
  id: string;
  device_id: string;
  old_price: number;
  new_price: number;
  price_change: number;
  change_percentage: number;
  reason: string;
  change_type: 'manual' | 'bulk_update' | 'supplier_change' | 'market_adjustment' | 'promotion' | 'cost_update';
  source: 'system' | 'admin' | 'api' | 'import';
  metadata: any;
  updated_by: string;
  updated_at: string;
  created_at: string;
  user_name?: string;
}

export interface PriceHistoryFilters {
  changeType?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface PriceHistoryStats {
  totalChanges: number;
  averageChange: number;
  largestIncrease: number;
  largestDecrease: number;
  mostCommonType: string;
  changesByType: Record<string, number>;
  changesByMonth: Array<{
    month: string;
    count: number;
    averageChange: number;
  }>;
}

class DevicePriceHistoryService {
  
  /**
   * Get price history for a specific device
   */
  async getDevicePriceHistory(
    deviceId: string, 
    filters: PriceHistoryFilters = {}
  ): Promise<DevicePriceHistoryEntry[]> {
    try {
      console.log('📊 [DevicePriceHistoryService] Fetching price history for device:', deviceId);
      
      let query = supabase
        .from('device_price_history')
        .select(`
          *,
          user:auth_users!device_price_history_updated_by_fkey(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.changeType) {
        query = query.eq('change_type', filters.changeType);
      }
      
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [DevicePriceHistoryService] Error fetching price history:', error);
        throw error;
      }

      // Transform the data to include user names
      const transformedData: DevicePriceHistoryEntry[] = data.map(entry => ({
        ...entry,
        user_name: entry.user?.raw_user_meta_data?.name || 
                  entry.user?.email || 
                  'Unknown User'
      }));

      console.log('✅ [DevicePriceHistoryService] Found', transformedData.length, 'price history entries');
      return transformedData;

    } catch (error) {
      console.error('❌ [DevicePriceHistoryService] Error in getDevicePriceHistory:', error);
      throw error;
    }
  }

  /**
   * Get price history statistics for a device
   */
  async getDevicePriceHistoryStats(deviceId: string): Promise<PriceHistoryStats> {
    try {
      console.log('📊 [DevicePriceHistoryService] Fetching price history stats for device:', deviceId);
      
      // Get all price history for the device
      const { data, error } = await supabase
        .from('device_price_history')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [DevicePriceHistoryService] Error fetching price history stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalChanges: 0,
          averageChange: 0,
          largestIncrease: 0,
          largestDecrease: 0,
          mostCommonType: 'manual',
          changesByType: {},
          changesByMonth: []
        };
      }

      // Calculate statistics
      const totalChanges = data.length;
      const averageChange = data.reduce((sum, entry) => sum + entry.price_change, 0) / totalChanges;
      
      const increases = data.filter(entry => entry.price_change > 0);
      const decreases = data.filter(entry => entry.price_change < 0);
      
      const largestIncrease = increases.length > 0 
        ? Math.max(...increases.map(entry => entry.price_change))
        : 0;
      
      const largestDecrease = decreases.length > 0 
        ? Math.min(...decreases.map(entry => entry.price_change))
        : 0;

      // Count changes by type
      const changesByType: Record<string, number> = {};
      data.forEach(entry => {
        changesByType[entry.change_type] = (changesByType[entry.change_type] || 0) + 1;
      });

      const mostCommonType = Object.entries(changesByType)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'manual';

      // Group changes by month
      const changesByMonth: Array<{
        month: string;
        count: number;
        averageChange: number;
      }> = [];

      const monthlyData: Record<string, { count: number; totalChange: number }> = {};
      
      data.forEach(entry => {
        const month = new Date(entry.created_at).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { count: 0, totalChange: 0 };
        }
        monthlyData[month].count++;
        monthlyData[month].totalChange += entry.price_change;
      });

      Object.entries(monthlyData).forEach(([month, data]) => {
        changesByMonth.push({
          month,
          count: data.count,
          averageChange: data.totalChange / data.count
        });
      });

      changesByMonth.sort((a, b) => a.month.localeCompare(b.month));

      const stats: PriceHistoryStats = {
        totalChanges,
        averageChange: Math.round(averageChange * 100) / 100,
        largestIncrease,
        largestDecrease,
        mostCommonType,
        changesByType,
        changesByMonth
      };

      console.log('✅ [DevicePriceHistoryService] Calculated stats:', stats);
      return stats;

    } catch (error) {
      console.error('❌ [DevicePriceHistoryService] Error in getDevicePriceHistoryStats:', error);
      throw error;
    }
  }

  /**
   * Manually log a price change
   */
  async logPriceChange(
    deviceId: string,
    oldPrice: number,
    newPrice: number,
    reason: string,
    changeType: DevicePriceHistoryEntry['change_type'] = 'manual',
    metadata: any = {}
  ): Promise<DevicePriceHistoryEntry> {
    try {
      console.log('📊 [DevicePriceHistoryService] Logging price change for device:', deviceId);
      
      const { data, error } = await supabase
        .from('device_price_history')
        .insert({
          device_id: deviceId,
          old_price: oldPrice,
          new_price: newPrice,
          reason,
          change_type: changeType,
          source: 'admin',
          metadata,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [DevicePriceHistoryService] Error logging price change:', error);
        throw error;
      }

      console.log('✅ [DevicePriceHistoryService] Price change logged successfully');
      return data;

    } catch (error) {
      console.error('❌ [DevicePriceHistoryService] Error in logPriceChange:', error);
      throw error;
    }
  }

  /**
   * Get price history for multiple devices (bulk operation)
   */
  async getBulkDevicePriceHistory(
    deviceIds: string[],
    filters: PriceHistoryFilters = {}
  ): Promise<Record<string, DevicePriceHistoryEntry[]>> {
    try {
      console.log('📊 [DevicePriceHistoryService] Fetching bulk price history for', deviceIds.length, 'devices');
      
      const { data, error } = await supabase
        .from('device_price_history')
        .select(`
          *,
          user:auth_users!device_price_history_updated_by_fkey(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .in('device_id', deviceIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [DevicePriceHistoryService] Error fetching bulk price history:', error);
        throw error;
      }

      // Group by device_id
      const groupedData: Record<string, DevicePriceHistoryEntry[]> = {};
      
      data.forEach(entry => {
        if (!groupedData[entry.device_id]) {
          groupedData[entry.device_id] = [];
        }
        
        groupedData[entry.device_id].push({
          ...entry,
          user_name: entry.user?.raw_user_meta_data?.name || 
                    entry.user?.email || 
                    'Unknown User'
        });
      });

      console.log('✅ [DevicePriceHistoryService] Bulk price history fetched for', Object.keys(groupedData).length, 'devices');
      return groupedData;

    } catch (error) {
      console.error('❌ [DevicePriceHistoryService] Error in getBulkDevicePriceHistory:', error);
      throw error;
    }
  }

  /**
   * Export price history to CSV format
   */
  async exportPriceHistory(
    deviceId: string,
    filters: PriceHistoryFilters = {}
  ): Promise<string> {
    try {
      const priceHistory = await this.getDevicePriceHistory(deviceId, filters);
      
      const csvHeaders = [
        'Date',
        'Old Price',
        'New Price',
        'Price Change',
        'Change Percentage',
        'Reason',
        'Change Type',
        'Source',
        'Updated By'
      ];
      
      const csvRows = priceHistory.map(entry => [
        new Date(entry.created_at).toISOString(),
        entry.old_price.toString(),
        entry.new_price.toString(),
        entry.price_change.toString(),
        entry.change_percentage.toString(),
        entry.reason,
        entry.change_type,
        entry.source,
        entry.user_name || 'Unknown'
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      return csvContent;
      
    } catch (error) {
      console.error('❌ [DevicePriceHistoryService] Error exporting price history:', error);
      throw error;
    }
  }
}

export const devicePriceHistoryService = new DevicePriceHistoryService();
