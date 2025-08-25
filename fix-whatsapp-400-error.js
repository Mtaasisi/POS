#!/usr/bin/env node

/**
 * WhatsApp 400 Error Fix Script
 * This script helps identify and fix the 400 Bad Request errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 WhatsApp 400 Error Fix Script');
console.log('==================================\n');

// Function to search for WhatsApp proxy calls in files
function searchForWhatsAppProxyCalls(directory) {
  const results = [];
  
  function searchRecursively(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        searchRecursively(filePath);
      } else if (stat.isFile() && /\.(js|ts|tsx|jsx)$/.test(file)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Look for WhatsApp proxy calls
          if (content.includes('whatsapp-proxy.php')) {
            const lines = content.split('\n');
            const matches = [];
            
            lines.forEach((line, index) => {
              if (line.includes('whatsapp-proxy.php')) {
                matches.push({
                  line: index + 1,
                  content: line.trim()
                });
              }
            });
            
            if (matches.length > 0) {
              results.push({
                file: filePath,
                matches
              });
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not read file: ${filePath}`);
        }
      }
    }
  }
  
  searchRecursively(directory);
  return results;
}

// Function to analyze the findings
function analyzeFindings(findings) {
  console.log('📊 Analysis Results:\n');
  
  let totalFiles = 0;
  let totalCalls = 0;
  let potentialIssues = 0;
  
  findings.forEach(finding => {
    totalFiles++;
    console.log(`📁 File: ${finding.file}`);
    
    finding.matches.forEach(match => {
      totalCalls++;
      console.log(`   Line ${match.line}: ${match.content}`);
      
      // Check for potential issues
      if (!match.content.includes('action') || 
          match.content.includes('action: ""') || 
          match.content.includes('action: \'\'') ||
          match.content.includes('action: null')) {
        potentialIssues++;
        console.log(`   ⚠️  POTENTIAL ISSUE: Missing or empty action`);
      }
    });
    console.log('');
  });
  
  console.log(`📈 Summary:`);
  console.log(`   - Files with WhatsApp proxy calls: ${totalFiles}`);
  console.log(`   - Total proxy calls found: ${totalCalls}`);
  console.log(`   - Potential issues identified: ${potentialIssues}`);
  
  return { totalFiles, totalCalls, potentialIssues };
}

// Function to provide fix recommendations
function provideFixRecommendations() {
  console.log('\n🔧 Fix Recommendations:\n');
  
  console.log('1. **Update API Calls**');
  console.log('   Replace all instances of:');
  console.log('   fetch(\'/api/whatsapp-proxy.php\', {...})');
  console.log('   With:');
  console.log('   fetch(\'/api/whatsapp-proxy-forgiving.php\', {...})');
  console.log('');
  
  console.log('2. **Add Action Validation**');
  console.log('   Ensure all requests include a valid action:');
  console.log('   body: JSON.stringify({ action: \'getStateInstance\' })');
  console.log('');
  
  console.log('3. **Add Error Handling**');
  console.log('   Wrap API calls in try-catch blocks:');
  console.log('   try {');
  console.log('     const response = await fetch(url, options);');
  console.log('     if (!response.ok) throw new Error(`HTTP ${response.status}`);');
  console.log('     return await response.json();');
  console.log('   } catch (error) {');
  console.log('     console.error(\'WhatsApp API error:\', error);');
  console.log('   }');
  console.log('');
  
  console.log('4. **Valid Actions**');
  console.log('   Use only these valid actions:');
  console.log('   - health, getStateInstance, getSettings, sendMessage');
  console.log('   - getChats, getChatHistory, getQRCode');
  console.log('   - getWebhookSettings, setWebhookSettings');
  console.log('   - setSettings, rebootInstance, logoutInstance');
  console.log('');
}

// Function to create a test script
function createTestScript() {
  const testScript = `#!/usr/bin/env node

/**
 * Test script to verify WhatsApp proxy fixes
 */

const BASE_URL = 'https://inauzwa.store';

async function testWhatsAppProxy() {
  console.log('🧪 Testing WhatsApp Proxy...\\n');
  
  const tests = [
    {
      name: 'Health Check',
      endpoint: '/api/whatsapp-proxy-forgiving.php',
      body: { action: 'health' }
    },
    {
      name: 'Get State Instance',
      endpoint: '/api/whatsapp-proxy-forgiving.php',
      body: { action: 'getStateInstance' }
    },
    {
      name: 'Get Settings',
      endpoint: '/api/whatsapp-proxy-forgiving.php',
      body: { action: 'getSettings' }
    }
  ];
  
  for (const test of tests) {
    console.log(\`Testing: \${test.name}\`);
    try {
      const response = await fetch(\`\${BASE_URL}\${test.endpoint}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(\`  ✅ Success: \${response.status}\`);
        console.log(\`  Response: \${JSON.stringify(data, null, 2)}\`);
      } else {
        console.log(\`  ❌ Failed: \${response.status}\`);
        console.log(\`  Error: \${JSON.stringify(data, null, 2)}\`);
      }
    } catch (error) {
      console.log(\`  ❌ Error: \${error.message}\`);
    }
    console.log('');
  }
}

testWhatsAppProxy().catch(console.error);
`;

  fs.writeFileSync('test-whatsapp-fix.js', testScript);
  console.log('✅ Created test script: test-whatsapp-fix.js');
}

// Main execution
async function main() {
  console.log('🔍 Searching for WhatsApp proxy calls...\n');
  
  // Search for WhatsApp proxy calls
  const findings = searchForWhatsAppProxyCalls('./src');
  
  if (findings.length === 0) {
    console.log('✅ No WhatsApp proxy calls found in src directory');
    console.log('   The issue might be in the built/bundled files');
  } else {
    // Analyze findings
    const analysis = analyzeFindings(findings);
    
    if (analysis.potentialIssues > 0) {
      console.log('⚠️  Potential issues found!');
      console.log('   Please review the files above and fix the issues.');
    } else {
      console.log('✅ No obvious issues found in the source code');
      console.log('   The issue might be in the built files or runtime');
    }
  }
  
  // Provide fix recommendations
  provideFixRecommendations();
  
  // Create test script
  createTestScript();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Review the files with WhatsApp proxy calls');
  console.log('2. Update them to use the forgiving endpoint');
  console.log('3. Ensure all requests include valid actions');
  console.log('4. Test with the created test script');
  console.log('5. Rebuild and test the application');
  console.log('');
  console.log('📝 Additional Debugging:');
  console.log('- Open browser developer tools');
  console.log('- Check Network tab for failed requests');
  console.log('- Look for requests without action field');
  console.log('- Check Console tab for JavaScript errors');
}

main().catch(console.error);
