// Browser Console Debug Script
// Copy and paste this into your browser's console to debug the customer_payments issue

console.log('🔍 Starting customer_payments debug...');

// Override the supabase client to log all customer_payments requests
const originalSupabase = window.supabase || window.supabaseClient;

if (originalSupabase) {
  console.log('✅ Found Supabase client');
  
  // Override the from method to intercept customer_payments requests
  const originalFrom = originalSupabase.from;
  originalSupabase.from = function(tableName) {
    const query = originalFrom.call(this, tableName);
    
    if (tableName === 'customer_payments') {
      console.log('🎯 Intercepted customer_payments query');
      
      // Override the insert method
      const originalInsert = query.insert;
      query.insert = function(data) {
        console.log('📝 customer_payments INSERT data:', data);
        console.log('🔍 Data type:', typeof data);
        console.log('🔍 Data keys:', Object.keys(data));
        
        // Check for old field names
        const oldFields = ['payment_method', 'payment_status', 'payment_account_id', 'reference', 'notes', 'source'];
        const foundOldFields = oldFields.filter(field => data.hasOwnProperty(field));
        
        if (foundOldFields.length > 0) {
          console.error('❌ Found old field names:', foundOldFields);
          console.error('❌ This will cause a 400 error!');
        } else {
          console.log('✅ No old field names found');
        }
        
        return originalInsert.call(this, data);
      };
    }
    
    return query;
  };
  
  console.log('✅ Supabase client overridden for debugging');
} else {
  console.log('❌ Supabase client not found');
}

// Also check if there are any pending requests
console.log('🔍 Checking for pending requests...');
setTimeout(() => {
  console.log('⏰ Debug script loaded. Now try to reproduce the 400 error.');
  console.log('📋 Any customer_payments requests will be logged above.');
}, 1000);
