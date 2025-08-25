#!/usr/bin/env node

/**
 * Gemini API Diagnostic Script
 * Helps diagnose and fix 429 rate limiting errors
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log('🔍 Gemini API Diagnostic Tool');
console.log('=============================\n');

// Check if API key exists
if (!GEMINI_API_KEY) {
  console.log('❌ No Gemini API key found!');
  console.log('\nTo fix this:');
  console.log('1. Get a free API key from: https://makersuite.google.com/app/apikey');
  console.log('2. Create a .env file in your project root');
  console.log('3. Add: VITE_GEMINI_API_KEY=your_api_key_here');
  console.log('\nExample .env file:');
  console.log('VITE_GEMINI_API_KEY=AIzaSyByw2FgfW-cx0pk_wKelHQz0TJVEws0Uos');
  console.log('VITE_SUPABASE_URL=your_supabase_url');
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_key');
  process.exit(1);
}

console.log('✅ API key found');
console.log(`Key: ${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}`);

// Test API connection
async function testGeminiAPI() {
  console.log('\n🧪 Testing Gemini API connection...');
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello! Please respond with 'Connection successful' if you can read this message."
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50
        }
      }),
      params: {
        key: GEMINI_API_KEY
      }
    });

    const data = await response.json();
    
    if (response.status === 429) {
      console.log('❌ Rate limit exceeded (429 error)');
      console.log('\nPossible causes:');
      console.log('1. Too many requests in a short time');
      console.log('2. API quota exceeded');
      console.log('3. Invalid API key');
      console.log('\nSolutions:');
      console.log('1. Wait a few minutes before trying again');
      console.log('2. Check your API quota at: https://makersuite.google.com/app/apikey');
      console.log('3. Verify your API key is correct');
      console.log('4. Consider upgrading to a paid plan if you need more requests');
      
      return false;
    }
    
    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('✅ API connection successful!');
      console.log(`Response: ${data.candidates[0].content.parts[0].text}`);
      return true;
    } else {
      console.log('❌ API connection failed');
      console.log('Error:', data.error?.message || 'Unknown error');
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Test with proper URL construction
async function testGeminiAPIWithKey() {
  console.log('\n🧪 Testing with proper URL construction...');
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello! Please respond with 'Connection successful' if you can read this message."
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50
        }
      })
    });

    const data = await response.json();
    
    if (response.status === 429) {
      console.log('❌ Rate limit exceeded (429 error)');
      console.log('\nThis means your API key is valid but you\'ve exceeded the rate limit.');
      console.log('\nImmediate solutions:');
      console.log('1. Wait 1-2 minutes before trying again');
      console.log('2. The app will now use fallback responses automatically');
      console.log('3. Check your quota usage at: https://makersuite.google.com/app/apikey');
      
      return false;
    }
    
    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('✅ API connection successful!');
      console.log(`Response: ${data.candidates[0].content.parts[0].text}`);
      return true;
    } else {
      console.log('❌ API connection failed');
      console.log('Error:', data.error?.message || 'Unknown error');
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Testing API connection...\n');
  
  const success = await testGeminiAPIWithKey();
  
  if (success) {
    console.log('\n🎉 Everything is working! Your Gemini API is ready to use.');
  } else {
    console.log('\n⚠️  API has issues, but the app will continue to work with fallback responses.');
    console.log('\nThe app has been updated to handle rate limiting gracefully.');
    console.log('You can continue using the app while the API recovers.');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. If you got a 429 error, wait a few minutes and try again');
  console.log('2. The app will automatically use fallback responses when AI is unavailable');
  console.log('3. Check your API quota and usage at: https://makersuite.google.com/app/apikey');
  console.log('4. Consider upgrading to a paid plan if you need more requests');
}

main().catch(console.error);
