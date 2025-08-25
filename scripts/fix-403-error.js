import fetch from 'node-fetch';

async function testSimplifiedProxy() {
    console.log('🧪 Testing Simplified WhatsApp Proxy\n');
    
    const baseUrl = 'https://inauzwa.store';
    
    // Test the simplified proxy
    console.log('1. Testing simplified WhatsApp proxy...');
    try {
        const response = await fetch(`${baseUrl}/api/whatsapp-proxy-simple.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'health' })
        });
        
        console.log(`   HTTP Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Simplified proxy working');
            console.log('   Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('   ❌ Simplified proxy failed');
            const errorText = await response.text();
            console.log('   Error:', errorText.substring(0, 200));
        }
    } catch (error) {
        console.log('   ❌ Simplified proxy error:', error.message);
    }
}

async function provide403FixInstructions() {
    console.log('\n🔧 403 Error Fix Instructions');
    console.log('=============================');
    
    console.log('\n📋 The 403 Forbidden error suggests one of these issues:');
    console.log('1. Server configuration blocking requests');
    console.log('2. File permissions issues');
    console.log('3. .htaccess configuration problems');
    console.log('4. ModSecurity or similar security modules');
    
    console.log('\n🚀 Quick Fix Steps:');
    console.log('===================');
    
    console.log('\nStep 1: Replace the main WhatsApp proxy');
    console.log('   Copy the simplified version:');
    console.log('   cp public/api/whatsapp-proxy-simple.php public/api/whatsapp-proxy.php');
    
    console.log('\nStep 2: Check file permissions');
    console.log('   Make sure the file has proper permissions:');
    console.log('   chmod 644 public/api/whatsapp-proxy.php');
    
    console.log('\nStep 3: Test the simplified version');
    console.log('   Try accessing: https://inauzwa.store/api/whatsapp-proxy-simple.php');
    console.log('   This should return a health check response');
    
    console.log('\nStep 4: Update your frontend code');
    console.log('   If the simplified version works, update your frontend to use it');
    
    console.log('\n🔍 Alternative Solutions:');
    console.log('========================');
    
    console.log('\nOption 1: Use a different endpoint');
    console.log('   - Create a new endpoint like /api/whatsapp-v2.php');
    console.log('   - Update your frontend to use the new endpoint');
    
    console.log('\nOption 2: Check server logs');
    console.log('   - Check your hosting provider\'s error logs');
    console.log('   - Look for mod_security or similar security module logs');
    
    console.log('\nOption 3: Contact hosting provider');
    console.log('   - Ask them to check if mod_security is blocking the requests');
    console.log('   - Request them to whitelist your API endpoints');
    
    console.log('\n📞 Debugging Commands:');
    console.log('======================');
    console.log('1. Test the simplified proxy:');
    console.log('   curl -X POST https://inauzwa.store/api/whatsapp-proxy-simple.php \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"action":"health"}\'');
    
    console.log('\n2. Test with different headers:');
    console.log('   curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -H "User-Agent: Mozilla/5.0" \\');
    console.log('     -d \'{"action":"health"}\'');
}

async function run403Fix() {
    console.log('🚀 403 Error Fix Process\n');
    
    await testSimplifiedProxy();
    await provide403FixInstructions();
    
    console.log('\n✅ 403 Error Fix Process Complete');
    console.log('\n💡 Next Steps:');
    console.log('1. Upload the simplified proxy file');
    console.log('2. Test it directly in your browser');
    console.log('3. If it works, replace the main proxy file');
    console.log('4. Update your frontend if needed');
}

run403Fix().catch(console.error);
