// Browser Debug Script for Brands 400 Error
// Copy and paste this into your browser console to debug the issue

console.log('🔍 Browser Debug: Starting brands 400 error investigation...');

// Check if there are any global objects that might be modifying requests
console.log('🔍 Checking for potential request modifiers...');

// Check for browser extensions that might interfere
if (window.chrome && window.chrome.webRequest) {
  console.log('⚠️ Chrome webRequest API detected - browser extension might be interfering');
}

// Check for any global fetch interceptors
if (window.fetch !== fetch) {
  console.log('⚠️ Global fetch has been modified');
}

// Test the Supabase client directly
async function testSupabaseClient() {
  try {
    console.log('🔍 Testing Supabase client...');
    
    // Get the Supabase client from the window object
    const supabase = window.supabase || window.__SUPABASE__;
    
    if (!supabase) {
      console.log('❌ Supabase client not found in window object');
      return;
    }
    
    console.log('✅ Supabase client found, testing brands query...');
    
    // Test 1: Basic select
    const { data: data1, error: error1 } = await supabase
      .from('lats_brands')
      .select('*')
      .limit(1);
      
    if (error1) {
      console.error('❌ Test 1 failed:', error1);
      console.error('❌ Error details:', {
        code: error1.code,
        message: error1.message,
        details: error1.details,
        hint: error1.hint
      });
    } else {
      console.log('✅ Test 1 passed:', data1?.length || 0, 'records');
    }
    
    // Test 2: Explicit columns
    const { data: data2, error: error2 } = await supabase
      .from('lats_brands')
      .select('id, name, description')
      .limit(1);
      
    if (error2) {
      console.error('❌ Test 2 failed:', error2);
    } else {
      console.log('✅ Test 2 passed:', data2?.length || 0, 'records');
    }
    
    // Test 3: Check what's in the request URL
    console.log('🔍 Checking network requests...');
    
    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('lats_brands')) {
        console.log('🔍 Brands request URL:', url);
        console.log('🔍 Request options:', args[1]);
      }
      return originalFetch.apply(this, args);
    };
    
    // Make another request to trigger the monitoring
    const { data: data3, error: error3 } = await supabase
      .from('lats_brands')
      .select('*')
      .limit(1);
      
    // Restore original fetch
    window.fetch = originalFetch;
    
    if (error3) {
      console.error('❌ Test 3 failed:', error3);
    } else {
      console.log('✅ Test 3 passed');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSupabaseClient().then(() => {
  console.log('🔍 Browser debug complete');
}).catch(error => {
  console.error('❌ Browser debug failed:', error);
});

// Additional debugging info
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 User Agent:', navigator.userAgent);
console.log('🔍 Available global objects:', Object.keys(window).filter(key => 
  key.includes('supabase') || key.includes('SUPABASE') || key.includes('fetch')
));
