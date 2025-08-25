/**
 * Setup Script for AI WhatsApp Chat Analysis
 * 
 * This script helps you configure and run AI analysis on your WhatsApp chats
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 AI WhatsApp Chat Analysis Setup\n');
console.log('=' .repeat(50));

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

console.log('📋 Current Configuration:');
console.log(`   .env file: ${envExists ? '✅ Found' : '❌ Not found'}`);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasOpenAI = envContent.includes('OPENAI_API_KEY');
  const hasGemini = envContent.includes('GEMINI_API_KEY');
  
  console.log(`   OpenAI API Key: ${hasOpenAI ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Gemini API Key: ${hasGemini ? '✅ Configured' : '❌ Not configured'}`);
} else {
  console.log('   No .env file found - will create one');
}

console.log('\n🔧 Available Analysis Options:');
console.log('1. Basic Analysis (Built-in AI) - No API keys needed');
console.log('2. OpenAI GPT Analysis - Requires OpenAI API key');
console.log('3. Google Gemini Analysis - Requires Gemini API key');
console.log('4. Enhanced Analysis - Uses best available AI service');

console.log('\n📝 Setup Instructions:');
console.log('1. For OpenAI GPT:');
console.log('   - Get API key from: https://platform.openai.com/api-keys');
console.log('   - Add to .env: OPENAI_API_KEY=your_key_here');
console.log('');
console.log('2. For Google Gemini:');
console.log('   - Get API key from: https://makersuite.google.com/app/apikey');
console.log('   - Add to .env: GEMINI_API_KEY=your_key_here');
console.log('');
console.log('3. Run analysis:');
console.log('   - Basic: node scripts/ai-whatsapp-chat-summary.js');
console.log('   - Enhanced: node scripts/ai-whatsapp-chat-summary-enhanced.js');

// Create .env template if it doesn't exist
if (!envExists) {
  const envTemplate = `# AI WhatsApp Chat Analysis Configuration

# OpenAI Configuration (optional)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini Configuration (optional)
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# WhatsApp Green API Configuration (already configured)
VITE_GREEN_API_TOKEN=b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('\n✅ Created .env template file');
  console.log('   Please edit .env and add your API keys if desired');
}

console.log('\n🚀 Quick Start Commands:');
console.log('   npm run ai-analysis-basic    # Run basic analysis');
console.log('   npm run ai-analysis-enhanced # Run enhanced analysis');
console.log('   node scripts/ai-whatsapp-chat-summary.js');
console.log('   node scripts/ai-whatsapp-chat-summary-enhanced.js');

console.log('\n📊 Analysis Features:');
console.log('   • Sentiment analysis');
console.log('   • Topic extraction');
console.log('   • Communication patterns');
console.log('   • Key insights and recommendations');
console.log('   • Activity level assessment');
console.log('   • Export to JSON for further analysis');

console.log('\n💡 Tips:');
console.log('   • Start with basic analysis to see your chat overview');
console.log('   • Use enhanced analysis for deeper insights with AI');
console.log('   • Results are saved as JSON files for easy review');
console.log('   • Check Green API console for quota limits');

console.log('\n✅ Setup complete! You can now run the analysis scripts.');
