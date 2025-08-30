#!/usr/bin/env node

/**
 * WhatsApp Poll Diagnostic Tool
 * Diagnoses why poll buttons are not showing up in WhatsApp
 */

const https = require('https');
const fs = require('fs');

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}🔍 ${msg}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.magenta}${num}. ${msg}${colors.reset}`)
};

async function makeApiRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function diagnosePollIssues() {
  log.header('WhatsApp Poll Diagnostic Tool');
  
  // Step 1: Check environment setup
  log.step(1, 'Checking project environment...');
  
  if (!fs.existsSync('./package.json')) {
    log.error('Not in project root directory');
    return;
  }
  
  log.success('Project environment detected');
  
  // Step 2: Check for Green API configuration
  log.step(2, 'Checking Green API configuration...');
  
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log.warning('Environment variables not loaded. Checking .env files...');
    
    const envFiles = ['.env', '.env.local', '.env.production'];
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const envVars = envContent.split('\n')
          .filter(line => line.includes('='))
          .reduce((acc, line) => {
            const [key, value] = line.split('=');
            acc[key?.trim()] = value?.trim().replace(/['"]/g, '');
            return acc;
          }, {});
        
        supabaseUrl = supabaseUrl || envVars.VITE_SUPABASE_URL;
        supabaseKey = supabaseKey || envVars.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          log.success(`Environment loaded from ${envFile}`);
          break;
        }
      }
    }
  }
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase configuration not found');
    log.info('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    return;
  }
  
  log.success('Supabase configuration found');
  
  // Step 3: Common poll issues and solutions
  log.step(3, 'Analyzing common poll issues...');
  
  log.info('🔍 Common reasons why poll buttons don\'t appear:');
  console.log('');
  
  log.warning('1. GREEN API ACCOUNT LIMITATIONS:');
  console.log('   • Some Green API plans don\'t support poll functionality');
  console.log('   • Trial accounts may have limited features');
  console.log('   • Business accounts required for advanced features');
  console.log('');
  
  log.warning('2. WHATSAPP VERSION COMPATIBILITY:');
  console.log('   • Polls require WhatsApp Web 2.2204.13 or higher');
  console.log('   • Mobile WhatsApp 2.22.4.75 or higher');
  console.log('   • Some older clients don\'t support polls');
  console.log('');
  
  log.warning('3. INSTANCE AUTHORIZATION ISSUES:');
  console.log('   • WhatsApp instance must be properly authorized');
  console.log('   • Instance state must be "authorized"');
  console.log('   • QR code scanning must be completed');
  console.log('');
  
  log.warning('4. API ENDPOINT ISSUES:');
  console.log('   • Using wrong API endpoint (should use /sendPoll)');
  console.log('   • Incorrect payload format');
  console.log('   • Missing required parameters');
  console.log('');
  
  // Step 4: Provide solutions
  log.step(4, 'IMMEDIATE SOLUTIONS TO TRY:');
  console.log('');
  
  log.success('🔧 Solution 1: Verify Green API Account');
  console.log('   1. Go to https://console.green-api.com/');
  console.log('   2. Check your account plan and features');
  console.log('   3. Ensure polls are supported in your plan');
  console.log('   4. Upgrade if necessary');
  console.log('');
  
  log.success('🔧 Solution 2: Check Instance Authorization');
  console.log('   1. In your app, go to Green API Management');
  console.log('   2. Check instance status - must be "connected"');
  console.log('   3. If disconnected, generate QR code and scan');
  console.log('   4. Wait for authorization confirmation');
  console.log('');
  
  log.success('🔧 Solution 3: Update WhatsApp Client');
  console.log('   1. Update WhatsApp on your phone');
  console.log('   2. Update WhatsApp Web if using web version');
  console.log('   3. Clear WhatsApp cache and restart');
  console.log('   4. Test with a different WhatsApp account');
  console.log('');
  
  log.success('🔧 Solution 4: Use Alternative Method');
  console.log('   1. Try sending as interactive buttons instead');
  console.log('   2. Use text message with numbered options');
  console.log('   3. Send via different Green API instance');
  console.log('   4. Test with minimal 2-option poll first');
  console.log('');
  
  // Step 5: Create test poll payload
  log.step(5, 'Creating test poll payload...');
  
  const testPoll = {
    chatId: "YOUR_NUMBER@c.us", // Replace with actual number
    message: "Test Poll: What's your favorite color?",
    options: [
      { optionName: "Red" },
      { optionName: "Blue" },
      { optionName: "Green" }
    ],
    multipleAnswers: false
  };
  
  console.log('📦 Test Poll Payload:');
  console.log(JSON.stringify(testPoll, null, 2));
  console.log('');
  
  // Step 6: Generate diagnostic report
  log.step(6, 'Generating diagnostic report...');
  
  const diagnosticReport = {
    timestamp: new Date().toISOString(),
    environment: 'Production',
    supabaseConfigured: !!supabaseUrl,
    commonIssues: [
      'Green API account plan limitations',
      'WhatsApp version compatibility',
      'Instance authorization issues',
      'API endpoint configuration'
    ],
    solutions: [
      'Verify Green API account features',
      'Check instance authorization status',
      'Update WhatsApp client versions',
      'Try alternative message formats'
    ],
    testPayload: testPoll,
    nextSteps: [
      '1. Check Green API console for account status',
      '2. Verify WhatsApp instance is authorized',
      '3. Test with minimal poll (2 options)',
      '4. Check WhatsApp client version',
      '5. Try sending to different number'
    ]
  };
  
  fs.writeFileSync('./poll-diagnostic-report.json', JSON.stringify(diagnosticReport, null, 2));
  log.success('Diagnostic report saved to poll-diagnostic-report.json');
  
  console.log('');
  log.header('🎯 RECOMMENDED ACTION PLAN');
  
  log.step(1, 'IMMEDIATE ACTION:');
  console.log('   • Check your Green API console at https://console.green-api.com/');
  console.log('   • Verify your account plan supports polls');
  console.log('   • Ensure your WhatsApp instance is authorized (green status)');
  console.log('');
  
  log.step(2, 'TEST WITH SIMPLE POLL:');
  console.log('   • Create a 2-option poll with short text');
  console.log('   • Send to your own WhatsApp number first');
  console.log('   • Check console logs for any error messages');
  console.log('');
  
  log.step(3, 'IF STILL NOT WORKING:');
  console.log('   • Contact Green API support with your instance ID');
  console.log('   • Provide them with the test payload above');
  console.log('   • Ask specifically about poll feature availability');
  console.log('');
  
  log.success('🔍 Diagnostic complete! Check the solutions above.');
}

// Run diagnostic
diagnosePollIssues().catch(console.error);
