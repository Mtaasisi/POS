#!/usr/bin/env node

/**
 * Gemini AI Setup Script
 * This script helps set up the Gemini AI integration with your API key
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Get Supabase configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration
  console.log('🔧 Using fallback Supabase configuration');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

const config = getConfig();
const supabase = createClient(config.url, config.key);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupGeminiAI() {
  try {
    console.log('🤖 Gemini AI Integration Setup');
    console.log('================================');
    console.log('');
    console.log('This script will help you set up the Gemini AI integration.');
    console.log('');
    console.log('📋 Prerequisites:');
    console.log('1. Get a free API key from Google AI Studio:');
    console.log('   https://makersuite.google.com/app/apikey');
    console.log('2. Make sure you have admin access to the system');
    console.log('');
    
    const apiKey = await question('🔑 Enter your Gemini API key: ');
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('❌ API key is required. Please run the script again with a valid API key.');
      rl.close();
      return;
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('AIza')) {
      console.log('⚠️  Warning: API key doesn\'t start with "AIza". Please verify your key.');
      const continueAnyway = await question('Continue anyway? (y/N): ');
      if (continueAnyway.toLowerCase() !== 'y') {
        console.log('❌ Setup cancelled.');
        rl.close();
        return;
      }
    }

    console.log('');
    console.log('🔄 Setting up Gemini AI integration...');

    // First, let's check if the integrations table exists and see its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('integrations')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Error accessing integrations table:', tableError.message);
      console.log('💡 The integrations table may not exist. Let\'s create it first.');
      
      // Try to create the integrations table
      const { error: createError } = await supabase.rpc('create_integrations_table');
      if (createError) {
        console.log('❌ Could not create integrations table automatically.');
        console.log('💡 Please run the database setup scripts first.');
        rl.close();
        return;
      }
    }

    // Check if integrations table exists and has the Gemini integration
    const { data: existingIntegrations, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('name', 'Gemini AI');

    if (fetchError) {
      console.log('❌ Error fetching integrations:', fetchError.message);
      console.log('💡 Let\'s try a different approach...');
      
      // Try to create the integration directly
      const { data: newIntegration, error: insertError } = await supabase
        .from('integrations')
        .insert({
          name: 'Gemini AI',
          type: 'ai',
          provider: 'google',
          config: {
            api_key: apiKey,
            model: 'gemini-1.5-flash'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Error creating Gemini AI integration:', insertError.message);
        console.log('💡 The integrations table may not be set up correctly.');
        rl.close();
        return;
      }

      console.log('✅ Gemini AI integration created successfully!');
    } else {
      let integrationId;
      
      if (existingIntegrations && existingIntegrations.length > 0) {
        // Update existing integration
        const integration = existingIntegrations[0];
        integrationId = integration.id;
        
        const { error: updateError } = await supabase
          .from('integrations')
          .update({
            config: {
              api_key: apiKey,
              model: 'gemini-1.5-flash'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', integrationId);

        if (updateError) {
          console.log('❌ Error updating Gemini AI integration:', updateError.message);
          rl.close();
          return;
        }

        console.log('✅ Gemini AI integration updated successfully!');
      } else {
        // Create new integration
        const { data: newIntegration, error: insertError } = await supabase
          .from('integrations')
          .insert({
            name: 'Gemini AI',
            type: 'ai',
            provider: 'google',
            config: {
              api_key: apiKey,
              model: 'gemini-1.5-flash'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.log('❌ Error creating Gemini AI integration:', insertError.message);
          rl.close();
          return;
        }

        integrationId = newIntegration.id;
        console.log('✅ Gemini AI integration created successfully!');
      }
    }

    // Test the integration
    console.log('');
    console.log('🧪 Testing Gemini AI integration...');
    
    try {
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, this is a test message from the repair shop management system.'
            }]
          }]
        })
      });

      if (testResponse.ok) {
        console.log('✅ Gemini AI integration test successful!');
        console.log('');
        console.log('🎉 Setup complete! You can now use AI-powered device analysis.');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Go to the device intake form');
        console.log('2. Fill in device details and issue description');
        console.log('3. Enable AI Analysis checkbox');
        console.log('4. AI will automatically analyze the problem and provide solutions');
        console.log('');
        console.log('🔗 Get your API key from: https://makersuite.google.com/app/apikey');
      } else {
        const errorData = await testResponse.json();
        console.log('❌ Gemini AI integration test failed:', errorData.error?.message || 'Unknown error');
        console.log('');
        console.log('💡 Please check:');
        console.log('1. Your API key is correct');
        console.log('2. You have sufficient quota');
        console.log('3. Your internet connection is working');
      }
    } catch (testError) {
      console.log('❌ Error testing Gemini AI integration:', testError.message);
    }

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the setup
setupGeminiAI();
