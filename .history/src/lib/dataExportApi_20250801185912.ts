import { supabase } from './supabaseClient';

export interface ExportOptions {
  format?: 'json' | 'csv' | 'sql';
  includeDeleted?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Generate SQL INSERT statements for data
 */
const generateSQLInserts = (tableName: string, data: any[]): string => {
  if (!data || data.length === 0) return '';
  
  const columns = Object.keys(data[0]);
  const values = data.map(row => {
    const rowValues = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return value;
    });
    return `(${rowValues.join(', ')})`;
  });
  
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values.join(',\n')};\n\n`;
};

/**
 * Export customer data as SQL
 */
export const exportCustomerDataAsSQL = async (options: ExportOptions = {}): Promise<Blob> => {
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

    const sqlContent = `-- Customer Data Export
-- Generated on: ${new Date().toISOString()}
-- Total records: ${data?.length || 0}

${generateSQLInserts('customers', data || [])}`;

    return new Blob([sqlContent], { type: 'text/plain' });
  } catch (error) {
    console.error('Error exporting customer data as SQL:', error);
    throw error;
  }
};

/**
 * Export device data as SQL
 */
export const exportDeviceDataAsSQL = async (options: ExportOptions = {}): Promise<Blob> => {
  try {
    let query = supabase.from('devices').select('*');
    
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to export device data: ${error.message}`);
    }

    const sqlContent = `-- Device Data Export
-- Generated on: ${new Date().toISOString()}
-- Total records: ${data?.length || 0}

${generateSQLInserts('devices', data || [])}`;

    return new Blob([sqlContent], { type: 'text/plain' });
  } catch (error) {
    console.error('Error exporting device data as SQL:', error);
    throw error;
  }
};

/**
 * Export payment data as SQL
 */
export const exportPaymentDataAsSQL = async (options: ExportOptions = {}): Promise<Blob> => {
  try {
    let query = supabase.from('customer_payments').select('*');
    
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to export payment data: ${error.message}`);
    }

    const sqlContent = `-- Payment Data Export
-- Generated on: ${new Date().toISOString()}
-- Total records: ${data?.length || 0}

${generateSQLInserts('customer_payments', data || [])}`;

    return new Blob([sqlContent], { type: 'text/plain' });
  } catch (error) {
    console.error('Error exporting payment data as SQL:', error);
    throw error;
  }
};

/**
 * Export all data as SQL
 */
export const exportAllDataAsSQL = async (options: ExportOptions = {}): Promise<Blob> => {
  try {
    const [customers, devices, payments] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('devices').select('*'),
      supabase.from('customer_payments').select('*')
    ]);

    if (customers.error) throw new Error(`Failed to fetch customers: ${customers.error.message}`);
    if (devices.error) throw new Error(`Failed to fetch devices: ${devices.error.message}`);
    if (payments.error) throw new Error(`Failed to fetch payments: ${payments.error.message}`);

    const sqlContent = `-- Complete Database Export
-- Generated on: ${new Date().toISOString()}
-- Customers: ${customers.data?.length || 0} records
-- Devices: ${devices.data?.length || 0} records  
-- Payments: ${payments.data?.length || 0} records

-- Customer Data
${generateSQLInserts('customers', customers.data || [])}

-- Device Data
${generateSQLInserts('devices', devices.data || [])}

-- Payment Data
${generateSQLInserts('customer_payments', payments.data || [])}`;

    return new Blob([sqlContent], { type: 'text/plain' });
  } catch (error) {
    console.error('Error exporting all data as SQL:', error);
    throw error;
  }
};

/**
 * Export database schema
 */
export const exportDatabaseSchema = async (): Promise<Blob> => {
  try {
    // Get all table names
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      throw new Error(`Failed to fetch table list: ${tablesError.message}`);
    }

    let schemaContent = `-- Database Schema Export
-- Generated on: ${new Date().toISOString()}
-- Total tables: ${tables?.length || 0}

`;

    // For each table, get its structure
    for (const table of tables || []) {
      const tableName = table.table_name;
      
      // Get columns for this table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) {
        console.warn(`Failed to fetch columns for table ${tableName}:`, columnsError);
        continue;
      }

      schemaContent += `-- Table: ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
`;

      const columnDefinitions = (columns || []).map(col => {
        const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
        const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        return `  ${col.column_name} ${col.data_type}${nullable}${defaultValue}`;
      });

      schemaContent += columnDefinitions.join(',\n');
      schemaContent += `\n);\n\n`;
    }

    return new Blob([schemaContent], { type: 'text/plain' });
  } catch (error) {
    console.error('Error exporting database schema:', error);
    throw error;
  }
};

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
      customers(name, email, phone)
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
    let query = supabase.from('customer_payments').select(`
      *,
      customers(name, email, phone),
      devices(brand, model)
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