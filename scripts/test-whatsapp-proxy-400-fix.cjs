#!/usr/bin/env node

/**
 * WhatsApp Proxy 400 Error Diagnostic Tool
 * Tests the WhatsApp proxy to identify the cause of 400 errors
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PROXY_URL = 'https://inauzwa.store/api/whatsapp-proxy.php';

async function testProxy() {
    console.log('🔍 Testing WhatsApp Proxy for 400 errors...\n');

    const tests = [
        {
            name: 'Health Check',
            body: { action: 'health' },
            description: 'Basic health check to verify proxy is working'
        },
        {
            name: 'Empty Request Body',
            body: null,
            description: 'Test what happens with no request body'
        },
        {
            name: 'Invalid JSON',
            body: 'invalid json',
            description: 'Test with invalid JSON format'
        },
        {
            name: 'Missing Action',
            body: { data: { test: 'data' } },
            description: 'Test with missing action field'
        },
        {
            name: 'Invalid Action',
            body: { action: 'invalidAction' },
            description: 'Test with invalid action'
        },
        {
            name: 'Get State Instance',
            body: { action: 'getStateInstance' },
            description: 'Test getStateInstance action'
        },
        {
            name: 'Get Webhook Settings',
            body: { action: 'getWebhookSettings' },
            description: 'Test getWebhookSettings action'
        }
    ];

    for (const test of tests) {
        console.log(`📋 Test: ${test.name}`);
        console.log(`   Description: ${test.description}`);
        
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: test.body ? JSON.stringify(test.body) : null
            });

            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            const responseText = await response.text();
            let responseData;
            
            try {
                responseData = JSON.parse(responseText);
                console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
            } catch (e) {
                console.log(`   Response (raw): ${responseText}`);
            }

            if (response.status === 400) {
                console.log(`   ❌ 400 Error detected!`);
                if (responseData && responseData.error) {
                    console.log(`   Error: ${responseData.error}`);
                    console.log(`   Message: ${responseData.message || 'No message'}`);
                    if (responseData.help) {
                        console.log(`   Help: ${responseData.help}`);
                    }
                }
            } else if (response.status === 200) {
                console.log(`   ✅ Success`);
            }
            
        } catch (error) {
            console.log(`   ❌ Network Error: ${error.message}`);
        }
        
        console.log('');
    }

    console.log('🔧 Recommended fixes based on test results:');
    console.log('');
    console.log('1. If health check fails:');
    console.log('   - Check if PHP is enabled on your server');
    console.log('   - Verify the proxy file is accessible');
    console.log('');
    console.log('2. If credentials are missing:');
    console.log('   - Configure WhatsApp credentials in environment variables:');
    console.log('     GREENAPI_INSTANCE_ID=your_instance_id');
    console.log('     GREENAPI_API_TOKEN=your_api_token');
    console.log('   - Or configure in database settings table');
    console.log('');
    console.log('3. If database connection fails:');
    console.log('   - Check database credentials in environment variables');
    console.log('   - Verify database connection settings');
    console.log('');
    console.log('4. If request format is wrong:');
    console.log('   - Ensure all requests include valid JSON with "action" field');
    console.log('   - Check that Content-Type header is set to application/json');
}

// Run the test
testProxy().catch(console.error);
