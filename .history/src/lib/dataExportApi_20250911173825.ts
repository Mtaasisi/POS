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
    let query = supabase.from('customers').select('id, name, email, phone, whatsapp, address, city, country, birth_month, birth_day, gender, notes, is_active, created_at, updated_at, total_returns, profile_image, last_purchase_date, total_purchases, birthday, whatsapp_opt_out, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, created_by, referral_source, initial_notes, referrals, customer_tag, joined_date');
    
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    const { data, error } = await query.limit(50000); // Fetch up to 50,000 customers instead of default 1000

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
      supabase.from('customers').select('id, name, email, phone, gender, city, birth_month, birth_day, total_returns, profile_image, created_at, updated_at, whatsapp, notes, is_active, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, created_by, referral_source, initial_notes, referrals, customer_tag').limit(50000), // Fetch up to 50,000 customers instead of default 1000
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
    // Since Supabase doesn't expose information_schema through REST API,
    // we'll create a schema based on known table structures
    const knownTables = [
      'customers',
      'devices', 
      'customer_payments',
      'auth_users',
      'customer_notes',
      'promo_messages',
      'device_attachments',
      'spare_parts',
      'sms_logs',
      'sms_campaigns',
      'customer_checkins',
      'staff_points',
      'user_daily_goals',
      'audit_logs',
      'finance_expenses',
      'finance_transfers'
    ];

    let schemaContent = `-- Database Schema Export
-- Generated on: ${new Date().toISOString()}
-- Total tables: ${knownTables.length}

`;

    // Define table schemas based on known structure
    const tableSchemas: { [key: string]: string[] } = {
      customers: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'name text NOT NULL',
        'email text',
        'phone text',
        'gender text',
        'city text',
        'joined_date date',
        'loyalty_level text DEFAULT \'bronze\'',
        'color_tag text',
        'total_spent numeric DEFAULT 0',
        'points integer DEFAULT 0',
        'last_visit timestamp with time zone',
        'is_active boolean DEFAULT true',
    
        'referral_source text',
        'birth_month text',
        'birth_day text',
        'customer_tag text',
        'notes text',
        'total_returns integer DEFAULT 0',
        'initial_notes text',
        'location_description text',
        'national_id text',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ],
      devices: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'customer_id uuid REFERENCES customers(id)',
        'device_name text NOT NULL',
        'brand text',
        'model text',
        'serial_number text',
        'imei text',
        'problem_description text',
        'diagnostic_notes text',
        'repair_notes text',
        'status text DEFAULT \'pending\'',
        'estimated_cost numeric DEFAULT 0',
        'actual_cost numeric DEFAULT 0',
        'deposit_amount numeric DEFAULT 0',
        'balance_amount numeric DEFAULT 0',
        'technician_id uuid',
        'intake_date timestamp with time zone DEFAULT now()',
        'estimated_completion_date timestamp with time zone',
        'actual_completion_date timestamp with time zone',
        'pickup_date timestamp with time zone',
        'warranty_expiry_date timestamp with time zone',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ],
      customer_payments: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'customer_id uuid REFERENCES customers(id)',
        'device_id uuid REFERENCES devices(id)',
        'amount numeric NOT NULL',
        'method text DEFAULT \'cash\'',
        'payment_type text DEFAULT \'payment\'',
        'status text DEFAULT \'completed\'',
        'reference_number text',
        'notes text',
        'payment_date timestamp with time zone DEFAULT now()',
        'created_by uuid',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ],
      auth_users: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'email text UNIQUE NOT NULL',
        'name text',
        'role text DEFAULT \'technician\'',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ],
      customer_notes: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'customer_id uuid REFERENCES customers(id)',
        'content text NOT NULL',
        'created_by uuid',
        'created_at timestamp with time zone DEFAULT now()'
      ],
      promo_messages: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'customer_id uuid REFERENCES customers(id)',
        'title text',
        'content text NOT NULL',
        'sent_via text',
        'sent_at timestamp with time zone DEFAULT now()',
        'status text DEFAULT \'sent\''
      ],
      device_attachments: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'device_id uuid REFERENCES devices(id)',
        'file_name text NOT NULL',
        'file_url text NOT NULL',
        'file_type text',
        'file_size integer',
        'uploaded_by uuid',
        'created_at timestamp with time zone DEFAULT now()'
      ],
      spare_parts: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'name text NOT NULL',
        'description text',
        'category text',
        'brand text',
        'model text',
        'quantity integer DEFAULT 0',
        'unit_price numeric DEFAULT 0',
        'supplier text',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ],
      sms_logs: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'phone_number text NOT NULL',
        'message text NOT NULL',
        'status text DEFAULT \'sent\'',
        'sent_at timestamp with time zone DEFAULT now()',
        'delivery_status text',
        'created_by uuid'
      ],
      sms_campaigns: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'name text NOT NULL',
        'message text NOT NULL',
        'target_customers text[]',
        'status text DEFAULT \'draft\'',
        'sent_at timestamp with time zone',
        'created_by uuid',
        'created_at timestamp with time zone DEFAULT now()'
      ],
  
      customer_checkins: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'customer_id uuid REFERENCES customers(id)',
        'checkin_date timestamp with time zone DEFAULT now()',
        'checkout_date timestamp with time zone',
        'notes text',
        'created_by uuid'
      ],
      staff_points: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'user_id uuid REFERENCES auth_users(id)',
        'points integer DEFAULT 0',
        'earned_date timestamp with time zone DEFAULT now()',
        'reason text',
        'created_by uuid'
      ],
      user_daily_goals: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'user_id uuid REFERENCES auth_users(id)',
        'goal_date date NOT NULL',
        'target_devices integer DEFAULT 0',
        'target_customers integer DEFAULT 0',
        'target_revenue numeric DEFAULT 0',
        'actual_devices integer DEFAULT 0',
        'actual_customers integer DEFAULT 0',
        'actual_revenue numeric DEFAULT 0',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ],
      audit_logs: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'user_id uuid',
        'action text NOT NULL',
        'table_name text',
        'record_id uuid',
        'old_values jsonb',
        'new_values jsonb',
        'ip_address text',
        'user_agent text',
        'created_at timestamp with time zone DEFAULT now()'
      ],
      finance_expenses: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'description text NOT NULL',
        'amount numeric NOT NULL',
        'category text',
        'expense_date date NOT NULL',
        'payment_method text',
        'receipt_url text',
        'notes text',
        'created_by uuid',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ],
      finance_transfers: [
        'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
        'from_account text NOT NULL',
        'to_account text NOT NULL',
        'amount numeric NOT NULL',
        'transfer_date date NOT NULL',
        'reference_number text',
        'notes text',
        'created_by uuid',
        'created_at timestamp with time zone DEFAULT now()',
        'updated_at timestamp with time zone DEFAULT now()'
      ]
    };

    // Generate CREATE TABLE statements
    for (const tableName of knownTables) {
      const columns = tableSchemas[tableName] || [];
      if (columns.length > 0) {
        schemaContent += `-- Table: ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
  ${columns.join(',\n  ')}
);

`;
      }
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
    let query = supabase.from('customers').select('id, name, email, phone, whatsapp, address, city, country, birth_month, birth_day, gender, notes, is_active, created_at, updated_at, total_returns, profile_image, last_purchase_date, total_purchases, birthday, whatsapp_opt_out, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, created_by, referral_source, initial_notes, referrals, customer_tag, joined_date');
    
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    const { data, error } = await query.limit(50000); // Fetch up to 50,000 customers instead of default 1000

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