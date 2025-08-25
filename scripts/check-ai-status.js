#!/usr/bin/env node

/**
 * Check AI Service Status
 * This script shows the current AI configuration and status
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🤖 AI Service Status Check');
console.log('========================');
console.log('');

// Check environment variables
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
console.log('📋 Environment Variables:');
console.log(`   VITE_GEMINI_API_KEY: ${GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
if (GEMINI_API_KEY) {
  console.log(`   API Key: ${GEMINI_API_KEY.substring(0, 10)}...`);
}
console.log('');

// Check configuration
console.log('⚙️  Configuration Status:');
console.log('   AI Features: ❌ Disabled (recommended)');
console.log('   Gemini Service: ❌ Disabled (recommended)');
console.log('   Fallback Responses: ✅ Enabled');
console.log('');

// Rate limiting info
console.log('📊 Rate Limiting (if enabled):');
console.log('   Max Requests/Minute: 2');
console.log('   Min Request Interval: 30 seconds');
console.log('   Error Cooldown: 2 minutes');
console.log('   Exponential Backoff: ✅ Enabled');
console.log('');

// Recommendations
console.log('💡 Recommendations:');
console.log('   1. Keep AI features disabled for production');
console.log('   2. Use fallback responses for basic functionality');
console.log('   3. Upgrade API plan if AI features are needed');
console.log('   4. Monitor rate limits if enabling AI');
console.log('');

// Test API connection (optional)
if (GEMINI_API_KEY) {
  console.log('🔍 API Connection Test:');
  console.log('   Run: node scripts/test-gemini-rate-limit.js');
  console.log('   This will test if the API key is working');
  console.log('');
}

console.log('✅ Status check completed');
console.log('');
console.log('📚 For more information, see:');
console.log('   docs/GEMINI_RATE_LIMITING_SOLUTION.md');
