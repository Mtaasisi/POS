/**
 * Debug 500 Error Script
 * 
 * This script helps identify what's causing the 500 errors in the browser
 */

async function debug500Error() {
  console.log('🔍 ===== DEBUGGING 500 ERROR =====\n');
  
  try {
    // Test 1: Simple GET request (browser might be making GET instead of POST)
    console.log('📋 Test 1: Testing GET request...');
    try {
      const getResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`   GET Status: ${getResponse.status}`);
      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        console.log(`   GET Error: ${errorText.substring(0, 200)}...`);
      } else {
        const data = await getResponse.json();
        console.log(`   GET Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`   GET Error: ${error.message}`);
    }

    // Test 2: POST without body (browser might be sending empty request)
    console.log('\n📋 Test 2: Testing POST without body...');
    try {
      const postResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`   POST Status: ${postResponse.status}`);
      if (!postResponse.ok) {
        const errorText = await postResponse.text();
        console.log(`   POST Error: ${errorText.substring(0, 200)}...`);
      } else {
        const data = await postResponse.json();
        console.log(`   POST Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`   POST Error: ${error.message}`);
    }

    // Test 3: POST with invalid JSON
    console.log('\n📋 Test 3: Testing POST with invalid JSON...');
    try {
      const invalidResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      console.log(`   Invalid JSON Status: ${invalidResponse.status}`);
      if (!invalidResponse.ok) {
        const errorText = await invalidResponse.text();
        console.log(`   Invalid JSON Error: ${errorText.substring(0, 200)}...`);
      } else {
        const data = await invalidResponse.json();
        console.log(`   Invalid JSON Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`   Invalid JSON Error: ${error.message}`);
    }

    // Test 4: POST with missing action
    console.log('\n📋 Test 4: Testing POST with missing action...');
    try {
      const missingActionResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      console.log(`   Missing Action Status: ${missingActionResponse.status}`);
      if (!missingActionResponse.ok) {
        const errorText = await missingActionResponse.text();
        console.log(`   Missing Action Error: ${errorText.substring(0, 200)}...`);
      } else {
        const data = await missingActionResponse.json();
        console.log(`   Missing Action Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`   Missing Action Error: ${error.message}`);
    }

    // Test 5: Check if it's a CORS issue
    console.log('\n📋 Test 5: Testing CORS headers...');
    try {
      const corsResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'OPTIONS',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://inauzwa.store'
        }
      });
      
      console.log(`   CORS Status: ${corsResponse.status}`);
      console.log(`   CORS Headers: ${JSON.stringify(Object.fromEntries(corsResponse.headers.entries()))}`);
    } catch (error) {
      console.log(`   CORS Error: ${error.message}`);
    }

    // Test 6: Check server error logs (if accessible)
    console.log('\n📋 Test 6: Checking for server error logs...');
    try {
      const errorLogResponse = await fetch('https://inauzwa.store/api/error_log.txt');
      if (errorLogResponse.ok) {
        const errorLog = await errorLogResponse.text();
        console.log(`   Error Log (last 500 chars): ${errorLog.substring(-500)}`);
      } else {
        console.log('   No error log file found');
      }
    } catch (error) {
      console.log(`   Error Log Check Failed: ${error.message}`);
    }

    console.log('\n📋 Analysis:');
    console.log('The 500 errors in browser console might be caused by:');
    console.log('1. Browser making GET requests instead of POST');
    console.log('2. CORS issues with preflight requests');
    console.log('3. Invalid request format');
    console.log('4. Server configuration issues');
    
    console.log('\n💡 Recommendations:');
    console.log('1. Check browser Network tab for exact request details');
    console.log('2. Verify the request method is POST');
    console.log('3. Check if request body is properly formatted');
    console.log('4. Look for CORS errors in browser console');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debug500Error().then(() => {
  console.log('\n🔍 ===== DEBUG COMPLETE =====');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
