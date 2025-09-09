#!/usr/bin/env node

/**
 * WhatsApp Poll Button Fix
 * Implements fixes for poll buttons not showing up in WhatsApp
 */

const fs = require('fs');
const path = require('path');

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
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}🔧 ${msg}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.magenta}${num}. ${msg}${colors.reset}`)
};

function fixPollImplementation() {
  log.header('Applying Poll Button Fixes');
  
  const managementPagePath = 'src/features/lats/pages/GreenApiManagementPage.tsx';
  
  if (!fs.existsSync(managementPagePath)) {
    log.error('GreenApiManagementPage.tsx not found');
    return;
  }
  
  log.step(1, 'Reading current implementation...');
  let content = fs.readFileSync(managementPagePath, 'utf8');
  
  log.step(2, 'Adding enhanced poll validation...');
  
  // Add enhanced poll validation function
  const enhancedValidation = `
  // Enhanced poll validation with detailed error messages
  const validatePollForGreenApi = (pollMessage: string, pollOptions: string[]) => {
    const errors: string[] = [];
    
    // Check message length (Green API limit)
    if (!pollMessage.trim()) {
      errors.push('Poll question cannot be empty');
    }
    if (pollMessage.length > 255) {
      errors.push('Poll question must be 255 characters or less');
    }
    
    // Check options
    const validOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      errors.push('At least 2 poll options are required');
    }
    if (validOptions.length > 12) {
      errors.push('Maximum 12 poll options allowed');
    }
    
    // Check option lengths
    const longOptions = validOptions.filter(opt => opt.length > 100);
    if (longOptions.length > 0) {
      errors.push('Poll options must be 100 characters or less');
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      errors.push('All poll options must be unique');
    }
    
    return { isValid: errors.length === 0, errors, validOptions };
  };
  `;
  
  // Find the sendTestMessage function and add validation
  const sendTestMessageRegex = /const sendTestMessage = async \(\) => \{/;
  if (sendTestMessageRegex.test(content)) {
    content = content.replace(sendTestMessageRegex, enhancedValidation + '\n  const sendTestMessage = async () => {');
    log.success('Added enhanced poll validation');
  }
  
  log.step(3, 'Adding improved error handling...');
  
  // Find the poll sending section and enhance it
  const pollSectionRegex = /else if \(messageType === 'poll'\) \{[\s\S]*?console\.log\('📦 Poll payload:', JSON\.stringify\(pollPayload, null, 2\)\);/;
  
  const improvedPollSection = `else if (messageType === 'poll') {
        // Enhanced poll validation
        const validation = validatePollForGreenApi(pollMessage, pollOptions);
        if (!validation.isValid) {
          toast.error('Poll validation failed: ' + validation.errors.join(', '));
          return;
        }
        
        // Handle poll sending using SendPoll endpoint
        const sendPollUrl = \`\${directApiUrl}/waInstance\${instance.instance_id}/sendPoll/\${directApiToken}\`;

        console.log('🔗 SendPoll URL:', sendPollUrl);
        console.log('📊 Poll validation passed:', {
          optionsCount: validation.validOptions.length,
          messageLength: pollMessage.length,
          hasValidOptions: validation.validOptions.every(opt => opt.length <= 100)
        });
        
        // Prepare payload according to Green API SendPoll documentation
        const pollPayload: any = {
          chatId: \`\${recipientNumber}@c.us\`,
          message: pollMessage,
          options: validation.validOptions.map(option => ({ optionName: option.trim() })),
          multipleAnswers: multipleAnswers
        };
        
        if (typingTime && typingTime >= 1000 && typingTime <= 20000) {
          pollPayload.typingTime = typingTime;
        }
        
        console.log('📦 Poll payload:', JSON.stringify(pollPayload, null, 2));`;
  
  if (pollSectionRegex.test(content)) {
    content = content.replace(pollSectionRegex, improvedPollSection);
    log.success('Enhanced poll sending section');
  }
  
  log.step(4, 'Adding alternative poll methods...');
  
  // Add fallback method after poll sending
  const pollFallbackMethod = `
  
  // Alternative poll method using interactive buttons
  const sendPollAsButtons = async (instance: any, recipient: string, question: string, options: string[]) => {
    const sendButtonsUrl = \`\${instance.green_api_host || 'https://api.green-api.com'}/waInstance\${instance.instance_id}/sendButtons/\${instance.green_api_token || instance.api_token}\`;
    
    const buttonsPayload = {
      chatId: \`\${recipient}@c.us\`,
      message: \`📊 \${question}\n\nSelect an option:\`,
      footer: "Tap a button to vote",
      buttons: options.slice(0, 3).map((option, index) => ({
        buttonId: \`option_\${index}\`,
        buttonText: { displayText: option },
        type: 1
      }))
    };
    
    console.log('🔄 Trying alternative: Interactive buttons for poll');
    return await fetch(sendButtonsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buttonsPayload)
    });
  };
  
  // Text-based poll as final fallback
  const sendPollAsText = async (instance: any, recipient: string, question: string, options: string[]) => {
    const sendMessageUrl = \`\${instance.green_api_host || 'https://api.green-api.com'}/waInstance\${instance.instance_id}/sendMessage/\${instance.green_api_token || instance.api_token}\`;
    
    let pollText = \`📊 *\${question}*\n\n\`;
    options.forEach((option, index) => {
      pollText += \`\${index + 1}️⃣ \${option}\n\`;
    });
    pollText += \`\n_Reply with the number of your choice_\`;
    
    const textPayload = {
      chatId: \`\${recipient}@c.us\`,
      message: pollText
    };
    
    console.log('🔄 Trying final fallback: Text-based poll');
    return await fetch(sendMessageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload)
    });
  };`;
  
  // Find where the response handling starts and add fallback logic
  const responseHandlingRegex = /(response = await fetch\(sendPollUrl,[\s\S]*?\}\);)/;
  if (responseHandlingRegex.test(content)) {
    content = content.replace(responseHandlingRegex, `$1
        
        // Check if poll was sent successfully
        if (!response.ok) {
          console.warn('❌ Poll sending failed, trying alternative methods...');
          
          // Try interactive buttons as fallback
          if (validation.validOptions.length <= 3) {
            console.log('🔄 Attempting interactive buttons fallback...');
            try {
              response = await sendPollAsButtons(instance, recipientNumber, pollMessage, validation.validOptions);
              if (response.ok) {
                console.log('✅ Poll sent as interactive buttons');
              }
            } catch (buttonError) {
              console.error('❌ Interactive buttons fallback failed:', buttonError);
            }
          }
          
          // Try text-based poll as final fallback
          if (!response.ok) {
            console.log('🔄 Attempting text-based poll fallback...');
            try {
              response = await sendPollAsText(instance, recipientNumber, pollMessage, validation.validOptions);
              if (response.ok) {
                console.log('✅ Poll sent as text message');
                toast('Poll sent as text message with numbered options');
              }
            } catch (textError) {
              console.error('❌ Text-based poll fallback failed:', textError);
            }
          }
        } else {
          console.log('✅ Poll sent successfully via Green API');
        }`);
    log.success('Added fallback methods for poll sending');
  }
  
  // Add the fallback functions to the component
  content = content.replace(/const sendTestMessage = async \(\) => \{/, pollFallbackMethod + '\n\n  const sendTestMessage = async () => {');
  
  log.step(5, 'Writing improved implementation...');
  
  // Backup original file
  fs.writeFileSync(managementPagePath + '.backup', fs.readFileSync(managementPagePath));
  fs.writeFileSync(managementPagePath, content);
  
  log.success('Poll button fixes applied successfully!');
  
  log.step(6, 'Creating usage guide...');
  
  const usageGuide = `# WhatsApp Poll Button Fix - Usage Guide

## What Was Fixed

1. **Enhanced Validation**: Added comprehensive poll validation with detailed error messages
2. **Improved Error Handling**: Better error reporting when polls fail to send
3. **Fallback Methods**: Added alternative methods when polls don't work:
   - Interactive buttons (for 3 or fewer options)
   - Text-based polls with numbered options

## How to Test

1. **Go to Green API Management page**
2. **Select "Test Messages" tab**
3. **Choose "Poll" as message type**
4. **Fill in poll details:**
   - Question (max 255 chars)
   - 2-12 options (max 100 chars each)
   - Multiple answers option
5. **Send the test**

## Troubleshooting Steps

If poll buttons still don't appear:

### Step 1: Check Green API Account
- Visit https://console.green-api.com/
- Verify your account plan supports polls
- Check if your instance is properly authorized (green status)

### Step 2: Test with Minimal Poll
- Create a simple 2-option poll
- Use short text for question and options
- Test on your own WhatsApp number first

### Step 3: Check WhatsApp Version
- Update WhatsApp on your phone
- Clear WhatsApp cache
- Try with WhatsApp Web

### Step 4: Try Alternatives
- The system now automatically tries interactive buttons
- If that fails, it sends as a numbered text message
- Both are more compatible than native polls

## Common Issues & Solutions

**Issue**: "Poll validation failed"
**Solution**: Check question length (max 255) and option count (2-12)

**Issue**: Empty response from API
**Solution**: Instance may not be authorized - check Green API console

**Issue**: Polls appear as text messages
**Solution**: This is the fallback behavior - polls aren't supported

## Support

If issues persist:
1. Check browser console for error messages
2. Run the diagnostic tool: \`node scripts/diagnose-poll-issues.js\`
3. Contact Green API support with your instance ID
`;

  fs.writeFileSync('./POLL_FIX_USAGE_GUIDE.md', usageGuide);
  log.success('Usage guide created: POLL_FIX_USAGE_GUIDE.md');
  
  console.log('');
  log.header('🎯 NEXT STEPS');
  
  log.step(1, 'TEST THE FIX:');
  console.log('   • Rebuild your app: npm run build');
  console.log('   • Clear browser cache');
  console.log('   • Go to Green API Management > Test Messages');
  console.log('   • Try sending a simple poll');
  console.log('');
  
  log.step(2, 'CHECK YOUR GREEN API ACCOUNT:');
  console.log('   • Visit https://console.green-api.com/');
  console.log('   • Verify account plan supports polls');
  console.log('   • Ensure instance is authorized (green status)');
  console.log('');
  
  log.step(3, 'IF POLLS STILL DON\'T WORK:');
  console.log('   • The system will automatically use fallback methods');
  console.log('   • Interactive buttons for 3 or fewer options');
  console.log('   • Text-based numbered polls otherwise');
  console.log('');
  
  log.success('🔧 Poll button fixes complete!');
}

// Run the fix
fixPollImplementation();
