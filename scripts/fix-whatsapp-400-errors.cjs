#!/usr/bin/env node

/**
 * WhatsApp Proxy 400 Error Fix Script
 * Deploys the enhanced WhatsApp proxy with better error handling
 */

const fs = require('fs');
const path = require('path');

const HOSTINGER_DOMAIN = 'https://inauzwa.store';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fixWhatsApp400Errors() {
    console.log('🔧 Fixing WhatsApp Proxy 400 Errors...\n');

    // Step 1: Test current proxy
    console.log('📋 Step 1: Testing current proxy...');
    try {
        const response = await fetch(`${HOSTINGER_DOMAIN}/api/whatsapp-proxy.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'health' })
        });

        console.log(`   Current proxy status: ${response.status}`);
        if (response.status === 400) {
            console.log('   ❌ 400 error confirmed - proceeding with fix');
        } else if (response.status === 200) {
            console.log('   ✅ Proxy is working - checking response');
            const data = await response.json();
            console.log('   Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log(`   ❌ Error testing proxy: ${error.message}`);
    }

    // Step 2: Deploy enhanced proxy
    console.log('\n📋 Step 2: Deploying enhanced WhatsApp proxy...');
    
    const sourceFile = path.join(__dirname, '../public/api/whatsapp-proxy-fixed.php');
    const targetFile = path.join(__dirname, '../public/api/whatsapp-proxy.php');
    
    if (fs.existsSync(sourceFile)) {
        try {
            fs.copyFileSync(sourceFile, targetFile);
            console.log('   ✅ Enhanced proxy deployed to public/api/whatsapp-proxy.php');
        } catch (error) {
            console.log(`   ❌ Error deploying proxy: ${error.message}`);
        }
    } else {
        console.log('   ❌ Enhanced proxy file not found');
    }

    // Step 3: Create environment template
    console.log('\n📋 Step 3: Creating environment configuration template...');
    
    const envTemplate = `# WhatsApp API Configuration
# Add these to your .env file or server environment variables

# GreenAPI WhatsApp Configuration
GREENAPI_INSTANCE_ID=your_instance_id_here
GREENAPI_API_TOKEN=your_api_token_here
GREENAPI_API_URL=https://api.greenapi.com

# Database Configuration (if using database for credentials)
SUPABASE_DB_HOST=db.jxhzveborezjhsmzsgbc.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_database_password_here

# Application Environment
APP_ENV=production
`;

    const envTemplatePath = path.join(__dirname, '../env-whatsapp-template.txt');
    fs.writeFileSync(envTemplatePath, envTemplate);
    console.log('   ✅ Environment template created: env-whatsapp-template.txt');

    // Step 4: Create deployment instructions
    console.log('\n📋 Step 4: Creating deployment instructions...');
    
    const instructions = `# WhatsApp Proxy 400 Error Fix - Deployment Instructions

## Files to Upload

1. **Enhanced WhatsApp Proxy**
   - Source: \`public/api/whatsapp-proxy.php\`
   - Upload to: \`public_html/api/whatsapp-proxy.php\`
   - Permissions: 644

## Environment Configuration

### Option 1: Environment Variables (Recommended)
Add these to your server's environment variables or .env file:

\`\`\`
GREENAPI_INSTANCE_ID=your_actual_instance_id
GREENAPI_API_TOKEN=your_actual_api_token
GREENAPI_API_URL=https://api.greenapi.com
\`\`\`

### Option 2: Database Configuration
If using database, ensure these settings exist in your \`settings\` table:

\`\`\`sql
INSERT INTO settings (key, value) VALUES 
('whatsapp.instanceId', 'your_actual_instance_id'),
('whatsapp.apiToken', 'your_actual_api_token'),
('whatsapp.apiUrl', 'https://api.greenapi.com');
\`\`\`

## Testing the Fix

After deployment, test with:

\`\`\`bash
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \\
  -H "Content-Type: application/json" \\
  -d '{"action":"health"}'
\`\`\`

Expected response:
\`\`\`json
{
  "status": "healthy",
  "function": "whatsapp-proxy-php-enhanced",
  "credentials_configured": true
}
\`\`\`

## Common Issues and Solutions

1. **400 Error - Missing Request Body**
   - Ensure all requests include a JSON body
   - Check Content-Type header is set to application/json

2. **400 Error - Missing Action**
   - Include "action" field in request body
   - Use valid actions: health, getStateInstance, sendMessage, etc.

3. **400 Error - Credentials Not Configured**
   - Configure WhatsApp credentials in environment variables
   - Or configure in database settings table

4. **500 Error - Database Connection**
   - Check database credentials in environment variables
   - Verify database connection settings

## Enhanced Error Messages

The new proxy provides detailed error messages including:
- Specific error codes
- Helpful messages
- Suggested solutions
- Debugging information

## Support

If issues persist, check the server error logs for detailed debugging information.
`;

    const instructionsPath = path.join(__dirname, '../WHATSAPP_400_FIX_INSTRUCTIONS.md');
    fs.writeFileSync(instructionsPath, instructions);
    console.log('   ✅ Deployment instructions created: WHATSAPP_400_FIX_INSTRUCTIONS.md');

    // Step 5: Create test script
    console.log('\n📋 Step 5: Creating test script...');
    
    const testScript = `#!/bin/bash

# WhatsApp Proxy Test Script
echo "🧪 Testing WhatsApp Proxy..."

# Test 1: Health Check
echo "📋 Test 1: Health Check"
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \\
  -H "Content-Type: application/json" \\
  -d '{"action":"health"}' \\
  -w "\\nStatus: %{http_code}\\n"

echo ""

# Test 2: Get State Instance
echo "📋 Test 2: Get State Instance"
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \\
  -H "Content-Type: application/json" \\
  -d '{"action":"getStateInstance"}' \\
  -w "\\nStatus: %{http_code}\\n"

echo ""

# Test 3: Invalid Request (should return 400)
echo "📋 Test 3: Invalid Request (should return 400)"
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \\
  -H "Content-Type: application/json" \\
  -d '{"invalid":"request"}' \\
  -w "\\nStatus: %{http_code}\\n"

echo ""
echo "✅ Tests completed"
`;

    const testScriptPath = path.join(__dirname, '../test-whatsapp-proxy.sh');
    fs.writeFileSync(testScriptPath, testScript);
    fs.chmodSync(testScriptPath, '755');
    console.log('   ✅ Test script created: test-whatsapp-proxy.sh');

    console.log('\n🎉 WhatsApp Proxy 400 Error Fix Complete!');
    console.log('');
    console.log('📁 Files created:');
    console.log('   - Enhanced proxy: public/api/whatsapp-proxy.php');
    console.log('   - Environment template: env-whatsapp-template.txt');
    console.log('   - Instructions: WHATSAPP_400_FIX_INSTRUCTIONS.md');
    console.log('   - Test script: test-whatsapp-proxy.sh');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Upload the enhanced proxy to your server');
    console.log('   2. Configure WhatsApp credentials');
    console.log('   3. Run the test script to verify the fix');
    console.log('');
    console.log('📖 See WHATSAPP_400_FIX_INSTRUCTIONS.md for detailed instructions');
}

// Run the fix
fixWhatsApp400Errors().catch(console.error);
