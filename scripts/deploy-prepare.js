#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing LATS CHANCE for Hostinger Deployment...');
console.log('==================================================\n');

// Function to create production build
async function prepareForDeployment() {
  try {
    console.log('1️⃣ Building production version...');
    
    // Run build command
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('✅ Production build completed');
    
    // Create deployment instructions
    createDeploymentInstructions();
    
    // Create webhook configuration guide
    createWebhookGuide();
    
    console.log('\n🎉 Deployment preparation completed!');
    console.log('📁 Check the generated files:');
    console.log('   - HOSTINGER_DEPLOYMENT_GUIDE.md');
    console.log('   - WEBHOOK_SETUP_GUIDE.md');
    console.log('   - dist/ (production build)');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

function createDeploymentInstructions() {
  const instructions = `# Hostinger Deployment Guide

## 🚀 Deployment Steps

### 1. Build the Application
\`\`\`bash
npm run build
\`\`\`

### 2. Upload to Hostinger
1. **Login to Hostinger Control Panel**
2. **Go to File Manager**
3. **Navigate to public_html folder**
4. **Upload all files from the \`dist\` folder**

### 3. Configure Domain
1. **Point your domain to Hostinger**
2. **Set up SSL certificate (free with Hostinger)**
3. **Configure subdomain if needed**

### 4. Environment Variables
Create a \`.env\` file in your hosting root with:
\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MOBIS_USER=your_mobis_user
VITE_MOBIS_PASSWORD=your_mobis_password
VITE_MOBIS_SENDER_ID=your_sender_id
VITE_LATS_DATA_MODE=production
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_BEEM_API_URL=your_beem_api_url
NEXT_PUBLIC_BEEM_API_KEY=your_beem_api_key
NEXT_PUBLIC_BEEM_SECRET_KEY=your_beem_secret_key
\`\`\`

### 5. Netlify Functions (Alternative)
If you need serverless functions, consider:
- **Netlify hosting** (recommended for functions)
- **Vercel hosting** (good for React apps)
- **AWS Lambda** (for advanced serverless)

## 📁 File Structure After Upload
\`\`\`
public_html/
├── index.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── .env
└── favicon.ico
\`\`\`

## 🔧 Post-Deployment Checklist
- [ ] SSL certificate is active
- [ ] Environment variables are set
- [ ] Supabase connection works
- [ ] WhatsApp integration is configured
- [ ] All features are functional

## 🆘 Troubleshooting
- **404 Errors**: Check file paths and .htaccess
- **CORS Issues**: Configure CORS in hosting panel
- **Environment Variables**: Ensure .env file is uploaded
- **Build Issues**: Check Node.js version compatibility

## 📞 Support
For hosting issues, contact Hostinger support.
For app issues, check the documentation.
`;

  fs.writeFileSync('HOSTINGER_DEPLOYMENT_GUIDE.md', instructions);
  console.log('✅ Created HOSTINGER_DEPLOYMENT_GUIDE.md');
}

function createWebhookGuide() {
  const webhookGuide = `# WhatsApp Webhook Setup Guide for GreenAPI

## 🔗 Webhook Configuration

### 1. Get Your Hostinger Domain
After deploying to Hostinger, you'll have a domain like:
- \`https://yourdomain.com\`
- \`https://yourdomain.hostinger.com\`

### 2. Webhook URL Format
Your webhook URL will be:
\`\`\`
https://yourdomain.com/.netlify/functions/ai-whatsapp-webhook
\`\`\`

### 3. Configure GreenAPI Webhook
1. **Login to GreenAPI Console**: https://console.green-api.com
2. **Go to your WhatsApp instance**
3. **Navigate to Settings → Webhook**
4. **Set Webhook URL**: \`https://yourdomain.com/.netlify/functions/ai-whatsapp-webhook\`
5. **Save configuration**

### 4. Alternative: Direct API Integration
If you can't use Netlify functions on Hostinger, use direct API calls:

#### Update WhatsApp Settings
In your app settings, configure:
\`\`\`json
{
  "instanceId": "7105284900",
  "apiToken": "b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294",
  "apiUrl": "https://7105.api.greenapi.com",
  "webhookUrl": "https://yourdomain.com/api/whatsapp-webhook"
}
\`\`\`

#### Create Webhook Endpoint
Create \`public_html/api/whatsapp-webhook.php\`:
\`\`\`php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log webhook data
file_put_contents('webhook_log.txt', date('Y-m-d H:i:s') . ' - ' . $input . "\\n", FILE_APPEND);

// Process webhook
if ($data && isset($data['typeWebhook'])) {
    switch ($data['typeWebhook']) {
        case 'incomingMessageReceived':
            // Handle incoming message
            break;
        case 'stateInstanceChanged':
            // Handle state change
            break;
        default:
            // Handle other webhook types
            break;
    }
}

echo json_encode(['status' => 'success']);
?>
\`\`\`

### 5. Test Webhook
1. **Send a test message to your WhatsApp**
2. **Check webhook logs**: \`webhook_log.txt\`
3. **Verify webhook URL in GreenAPI console**

### 6. Webhook Security (Optional)
Add webhook token verification:
\`\`\`php
// Verify webhook token
$webhookToken = $_SERVER['HTTP_X_WEBHOOK_TOKEN'] ?? '';
if ($webhookToken !== 'your_webhook_token') {
    http_response_code(403);
    exit('Unauthorized');
}
\`\`\`

## 🔧 Troubleshooting

### Webhook Not Receiving Data
1. **Check domain accessibility**
2. **Verify SSL certificate**
3. **Test webhook URL manually**
4. **Check server logs**

### CORS Issues
Add to your webhook endpoint:
\`\`\`php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
\`\`\`

### 403 Forbidden
1. **Check file permissions**
2. **Verify .htaccess configuration**
3. **Ensure PHP is enabled**

## 📊 Monitoring
- **Webhook Logs**: Check \`webhook_log.txt\`
- **GreenAPI Console**: Monitor webhook status
- **Application Logs**: Check browser console

## 🎯 Next Steps
1. Deploy to Hostinger
2. Configure webhook URL
3. Test WhatsApp integration
4. Monitor webhook performance
`;

  fs.writeFileSync('WEBHOOK_SETUP_GUIDE.md', webhookGuide);
  console.log('✅ Created WEBHOOK_SETUP_GUIDE.md');
}

// Run deployment preparation
prepareForDeployment();
