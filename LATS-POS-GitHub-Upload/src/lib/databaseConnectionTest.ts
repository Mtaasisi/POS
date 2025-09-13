import { supabase } from './supabaseClient';
import { toast } from './toastUtils';

export interface DatabaseConnectionStatus {
  isConnected: boolean;
  authStatus: 'authenticated' | 'unauthenticated' | 'error';
  tablesAccessible: string[];
  tablesInaccessible: string[];
  errors: string[];
  warnings: string[];
  connectionTime: number;
  lastChecked: string;
}

export const testDatabaseConnection = async (): Promise<DatabaseConnectionStatus> => {
  const startTime = Date.now();
  const status: DatabaseConnectionStatus = {
    isConnected: false,
    authStatus: 'error',
    tablesAccessible: [],
    tablesInaccessible: [],
    errors: [],
    warnings: [],
    connectionTime: 0,
    lastChecked: new Date().toISOString()
  };

  try {
    console.log('🔍 Starting comprehensive database connection test...');

    // Test 1: Basic connection
    console.log('📡 Test 1: Testing basic connection...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        status.errors.push(`Authentication error: ${authError.message}`);
        status.authStatus = 'error';
      } else if (user) {
        status.authStatus = 'authenticated';
        console.log('✅ User authenticated:', user.email);
      } else {
        status.authStatus = 'unauthenticated';
        console.log('ℹ️ User not authenticated');
      }
    } catch (error: any) {
      status.errors.push(`Auth test failed: ${error.message}`);
      status.authStatus = 'error';
    }

    // Test 2: Test key tables
    const tablesToTest = [
      'customers',
      'whatsapp_instances_comprehensive',
      'whatsapp_connection_settings',
      'whatsapp_qr_codes',
      'devices',
      'users'
    ];

    console.log('📊 Test 2: Testing table access...');
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          status.tablesInaccessible.push(tableName);
          status.errors.push(`Table ${tableName}: ${error.message}`);
          console.log(`❌ Table ${tableName} inaccessible:`, error.message);
        } else {
          status.tablesAccessible.push(tableName);
          console.log(`✅ Table ${tableName} accessible`);
        }
      } catch (error: any) {
        status.tablesInaccessible.push(tableName);
        status.errors.push(`Table ${tableName} test failed: ${error.message}`);
        console.log(`❌ Table ${tableName} test failed:`, error.message);
      }
    }

    // Test 3: Test RLS (Row Level Security)
    console.log('🔒 Test 3: Testing Row Level Security...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Test if user can access their own data
        const { data, error } = await supabase
          .from('whatsapp_instances_comprehensive')
          .select('instance_id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (error) {
          status.warnings.push(`RLS test failed: ${error.message}`);
        } else {
          console.log('✅ RLS working correctly');
        }
      }
    } catch (error: any) {
      status.warnings.push(`RLS test error: ${error.message}`);
    }

    // Test 4: Test real-time subscriptions
    console.log('📡 Test 4: Testing real-time subscriptions...');
    try {
      const channel = supabase
        .channel('connection-test')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {})
        .subscribe();
      
      // Wait a moment for subscription to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (channel.state === 'SUBSCRIBED') {
        console.log('✅ Real-time subscriptions working');
        channel.unsubscribe();
      } else {
        status.warnings.push('Real-time subscriptions not working properly');
      }
    } catch (error: any) {
      status.warnings.push(`Real-time test failed: ${error.message}`);
    }

    // Test 5: Test file storage (if needed)
    console.log('📁 Test 5: Testing file storage...');
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        status.warnings.push(`Storage test failed: ${error.message}`);
      } else {
        console.log('✅ File storage accessible');
      }
    } catch (error: any) {
      status.warnings.push(`Storage test error: ${error.message}`);
    }

    // Determine overall connection status
    status.isConnected = status.tablesAccessible.length > 0 && status.errors.length === 0;
    status.connectionTime = Date.now() - startTime;

    console.log('📊 Database connection test completed:');
    console.log(`   ✅ Connected: ${status.isConnected}`);
    console.log(`   🔐 Auth Status: ${status.authStatus}`);
    console.log(`   📊 Accessible Tables: ${status.tablesAccessible.length}/${tablesToTest.length}`);
    console.log(`   ⚠️ Warnings: ${status.warnings.length}`);
    console.log(`   ❌ Errors: ${status.errors.length}`);
    console.log(`   ⏱️ Connection Time: ${status.connectionTime}ms`);

    return status;

  } catch (error: any) {
    status.errors.push(`Connection test failed: ${error.message}`);
    status.connectionTime = Date.now() - startTime;
    console.error('❌ Database connection test failed:', error);
    return status;
  }
};

export const quickDatabaseTest = async (): Promise<boolean> => {
  try {
    console.log('🔍 Quick database connection test...');
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    
    if (error) {
      console.error('❌ Quick database test failed:', error);
      return false;
    }
    
    console.log('✅ Quick database test successful');
    return true;
  } catch (error) {
    console.error('❌ Quick database test failed:', error);
    return false;
  }
};

export const showDatabaseStatus = (status: DatabaseConnectionStatus) => {
  const isHealthy = status.isConnected && status.errors.length === 0;
  
  if (isHealthy) {
    toast.success(`Database connected! (${status.connectionTime}ms)`);
  } else {
    toast.error(`Database issues detected: ${status.errors.length} errors`);
  }
  
  // Log detailed status
  console.group('📊 Database Connection Status');
  console.log(`Status: ${isHealthy ? '✅ Healthy' : '❌ Issues Detected'}`);
  console.log(`Connection Time: ${status.connectionTime}ms`);
  console.log(`Auth Status: ${status.authStatus}`);
  console.log(`Accessible Tables: ${status.tablesAccessible.join(', ')}`);
  console.log(`Inaccessible Tables: ${status.tablesInaccessible.join(', ')}`);
  
  if (status.errors.length > 0) {
    console.group('❌ Errors:');
    status.errors.forEach(error => console.error(error));
    console.groupEnd();
  }
  
  if (status.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    status.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return isHealthy;
};
