import { supabase } from './supabaseClient';

export interface ExportOptions {
  format?: 'json' | 'csv';
  includeDeleted?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Export customer data
 */
export const exportCustomerData = async (options: ExportOptions = {}): Promise<Blob> => {
  try {
    let query = supabase.from('customers').select('*');
    
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to export customer data: ${error.message}`);
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      recordCount: data?.length || 0,
      data: data || []
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  } catch (error) {
    console.error('Error exporting customer data:', error);
    throw error;
  }
};

/**
 * Export device data
 */
export const exportDeviceData = async (options: ExportOptions = {}): Promise<Blob> => {
  try {
    let query = supabase.from('devices').select(`
      *,
      customers(name, email, phone),
      categories(name, color)
    `);
    
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to export device data: ${error.message}`);
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      recordCount: data?.length || 0,
      data: data || []
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  } catch (error) {
    console.error('Error exporting device data:', error);
    throw error;
  }
};

/**
 * Export payment data
 */
export const exportPaymentData = async (options: ExportOptions = {}): Promise<Blob> => {
  try {
    let query = supabase.from('payments').select(`
      *,
      customers(name, email, phone),
      devices(device_name, brand, model)
    `);
    
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to export payment data: ${error.message}`);
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      recordCount: data?.length || 0,
      data: data || []
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  } catch (error) {
    console.error('Error exporting payment data:', error);
    throw error;
  }
};

/**
 * Export all data (customers, devices, payments)
 */
export const exportAllData = async (options: ExportOptions = {}): Promise<Blob> => {
  try {
    const [customers, devices, payments] = await Promise.all([
      exportCustomerData(options),
      exportDeviceData(options),
      exportPaymentData(options)
    ]);

    const allData = {
      exportDate: new Date().toISOString(),
      customers: JSON.parse(await customers.text()),
      devices: JSON.parse(await devices.text()),
      payments: JSON.parse(await payments.text())
    };

    const jsonString = JSON.stringify(allData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw error;
  }
};

/**
 * Download blob as file
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Clear offline cache
 */
export const clearOfflineCache = async (): Promise<boolean> => {
  try {
    // Clear IndexedDB caches
    const databases = ['offline-cache', 'pending-actions', 'user-goals'];
    
    for (const dbName of databases) {
      const request = indexedDB.deleteDatabase(dbName);
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }

    // Clear localStorage items
    const keysToRemove = [
      'repair-app-auth-token',
      'supabase.auth.token',
      'custom_brands',
      'custom_model_logos',
      'custom_models'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    return true;
  } catch (error) {
    console.error('Error clearing offline cache:', error);
    return false;
  }
}; 