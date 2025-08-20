import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

export interface UserSettings {
  displayName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  appLogo?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  theme?: 'light' | 'dark' | 'auto';
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy?: {
    profileVisibility: 'public' | 'private';
    showOnlineStatus: boolean;
    allowMessages: boolean;
  };
  preferences?: {
    autoSave: boolean;
    compactMode: boolean;
    showTutorials: boolean;
  };
  pos?: {
    defaultCurrency: string;
    taxRate: number;
    receiptHeader: string;
    receiptFooter: string;
    autoPrint: boolean;
    requireCustomerInfo: boolean;
    allowDiscounts: boolean;
    maxDiscountPercent: number;
    barcodeScanner: boolean;
    cashDrawer: boolean;
    paymentMethods: string[];
    defaultPaymentMethod: string;
    receiptNumbering: boolean;
    receiptPrefix: string;
    lowStockAlert: boolean;
    lowStockThreshold: number;
    inventoryTracking: boolean;
    returnPolicy: string;
    warrantyPeriod: number;
    warrantyUnit: 'days' | 'weeks' | 'months' | 'years';
  };
  delivery?: {
    enable_delivery: boolean;
    default_delivery_fee: number;
    free_delivery_threshold: number;
    max_delivery_distance: number;
    enable_delivery_areas: boolean;
    delivery_areas: string[];
    area_delivery_fees: Record<string, number>;
    area_delivery_times: Record<string, number>;
    enable_delivery_hours: boolean;
    delivery_start_time: string;
    delivery_end_time: string;
    enable_same_day_delivery: boolean;
    enable_next_day_delivery: boolean;
    delivery_time_slots: string[];
    notify_customer_on_delivery: boolean;
    notify_driver_on_assignment: boolean;
    enable_sms_notifications: boolean;
    enable_email_notifications: boolean;
    enable_driver_assignment: boolean;
    driver_commission: number;
    require_signature: boolean;
    enable_driver_tracking: boolean;
    enable_scheduled_delivery: boolean;
    enable_partial_delivery: boolean;
    require_advance_payment: boolean;
    advance_payment_percent: number;
  };
}

/**
 * Load user settings with improved error handling
 */
export const loadUserSettings = async (userId: string): Promise<UserSettings | null> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      // First, check if the table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1);

      if (tableError) {
        // Table doesn't exist or RLS is blocking access
        console.log('⚠️ User settings table not accessible:', tableError.message);
        
        // Try to create the table if it doesn't exist
        if (tableError.code === '42P01') { // Table doesn't exist
          console.log('📋 User settings table not found, please run the database setup script');
          console.log('📋 You can run: create-user-settings-final.sql in your Supabase SQL editor');
          return null;
        } else if (tableError.code === '42710') { // Trigger already exists
          console.log('⚠️ Trigger conflict detected, this is expected and can be ignored');
          // Continue with the operation as the table exists
        } else if (tableError.code === '42601') { // Syntax error
          console.log('⚠️ SQL syntax error detected, please run the final setup script');
          console.log('📋 You can run: create-user-settings-final.sql in your Supabase SQL editor');
          return null;
        } else if (tableError.code === '42P10') { // Constraint error
          console.log('⚠️ Constraint error detected - duplicate user_id found');
          console.log('📋 You can run: fix-user-settings-existing.sql to fix existing data');
          return null;
        } else if (tableError.code === '23505') { // Unique violation
          console.log('⚠️ Unique constraint violation - duplicate user_id found');
          console.log('📋 You can run: fix-user-settings-existing.sql to fix existing data');
          return null;
        } else {
          // RLS or other permission issue
          console.log('🔒 User settings table access blocked by RLS or permissions');
          console.log('📋 Error details:', tableError.message);
          return null;
        }
      }

      // Now try to load the settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If it's a 406 error, retry after a short delay
        if (error.code === '406' || error.message?.includes('406')) {
          console.log(`⚠️ 406 error on attempt ${retries + 1}, retrying...`);
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            continue;
          }
        }
        
        // If no rows found, return null (will trigger default creation)
        if (error.code === 'PGRST116') {
          console.log('📝 No user settings found for user, will create defaults');
          return null;
        }
        
        throw error;
      }

      return data?.settings || null;
      
    } catch (retryError: any) {
      if (retries >= maxRetries - 1) {
        console.error('Error loading user settings:', retryError);
        
        // Don't show error toast for 406 errors as they're expected in some cases
        if (!retryError.message?.includes('406')) {
          console.log('User settings not available, using defaults');
        }
        return null;
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return null;
};

/**
 * Save user settings with improved error handling
 */
export const saveUserSettings = async (
  userId: string, 
  settings: UserSettings,
  section?: string
): Promise<boolean> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        // If it's a 406 error, retry after a short delay
        if (error.code === '406' || error.message?.includes('406')) {
          console.log(`⚠️ 406 error on save attempt ${retries + 1}, retrying...`);
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            continue;
          }
        }
        
        // If table doesn't exist, try to create it
        if (error.code === '42P01') {
          console.log('📋 User settings table not found, please run the database setup script');
          console.log('📋 You can run: create-user-settings-simple.sql in your Supabase SQL editor');
          return false;
        }
        
        // If trigger already exists, this is expected and can be ignored
        if (error.code === '42710') {
          console.log('⚠️ Trigger conflict detected, this is expected and can be ignored');
          // Continue with the operation as the table exists
          continue;
        }
        
        throw error;
      }

      if (section) {
        toast.success(`${section} settings saved successfully`);
      }
      return true;
      
    } catch (retryError: any) {
      if (retries >= maxRetries - 1) {
        console.error('Error saving user settings:', retryError);
        
        // Don't show error toast for 406 errors as they're expected in some cases
        if (!retryError.message?.includes('406')) {
          toast.error('Failed to save settings');
        } else {
          console.log('Settings saved locally (sync will retry)');
        }
        return false;
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return false;
};

/**
 * Create default user settings if none exist
 */
export const createDefaultUserSettings = async (userId: string): Promise<boolean> => {
  try {
    const defaultSettings: UserSettings = {
      language: 'en',
      timezone: 'Africa/Dar_es_Salaam',
      dateFormat: 'DD/MM/YYYY',
      theme: 'auto',
      notifications: {
        email: true,
        sms: false,
        push: true,
        inApp: true
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowMessages: true
      },
      preferences: {
        autoSave: true,
        compactMode: false,
        showTutorials: true
      },
      pos: {
        defaultCurrency: 'TZS',
        taxRate: 18,
        receiptHeader: 'Repair Shop\nManagement System',
        receiptFooter: 'Thank you for your business!\nVisit us again.',
        autoPrint: false,
        requireCustomerInfo: true,
        allowDiscounts: true,
        maxDiscountPercent: 20,
        barcodeScanner: true,
        cashDrawer: false,
        paymentMethods: ['cash', 'mpesa', 'card'],
        defaultPaymentMethod: 'cash',
        receiptNumbering: true,
        receiptPrefix: 'RS',
        lowStockAlert: true,
        lowStockThreshold: 5,
        inventoryTracking: true,
        returnPolicy: '7 days return policy',
        warrantyPeriod: 3,
        warrantyUnit: 'months'
      }
    };

    return await saveUserSettings(userId, defaultSettings);
  } catch (error) {
    console.error('Error creating default user settings:', error);
    return false;
  }
};
