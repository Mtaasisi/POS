#!/usr/bin/env node

/**
 * Webhook Test Solution
 * 
 * This script provides alternative solutions for webhook verification
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function webhookTestSolution() {
  console.log('\n🔧 Webhook Verification Solutions\n');

  console.log('❌ Problem: Meta Developer Console cannot access localhost');
  console.log('✅ Solutions:\n');

  console.log('1. 🚀 FREE SOLUTION - Use webhook.site:');
  console.log('   a) Go to https://webhook.site/');
  console.log('   b) Copy the unique URL provided');
  console.log('   c) Use that URL in Meta Developer Console');
  console.log('   d) Test the webhook verification');
  console.log('   e) Once verified, you can see incoming webhooks on the website\n');

  console.log('2. 🌐 PAID SOLUTION - Deploy to a public server:');
  console.log('   a) Deploy your webhook server to Vercel, Netlify, or Heroku');
  console.log('   b) Use the public URL in Meta Developer Console');
  console.log('   c) Update your database with the public webhook URL\n');

  console.log('3. 🔑 NGROK SOLUTION - Get free ngrok account:');
  console.log('   a) Sign up at https://dashboard.ngrok.com/signup');
  console.log('   b) Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken');
  console.log('   c) Run: ngrok config add-authtoken YOUR_TOKEN');
  console.log('   d) Run: ngrok http 3001');
  console.log('   e) Use the public URL in Meta Developer Console\n');

  console.log('4. 🧪 TEST SOLUTION - Use the test endpoint:');
  console.log('   a) Temporarily use: https://webhook.site/your-unique-url');
  console.log('   b) Verify in Meta Developer Console');
  console.log('   c) Once verified, switch back to your local webhook\n');

  // Get current webhook settings
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'whatsapp_business_webhook_verify_token',
      'whatsapp_business_webhook_url'
    ]);

  if (!error && settings) {
    const webhookToken = settings.find(s => s.key === 'whatsapp_business_webhook_verify_token')?.value;
    const webhookUrl = settings.find(s => s.key === 'whatsapp_business_webhook_url')?.value;

    console.log('\n📋 Current Settings:');
    console.log(`   Webhook URL: ${webhookUrl}`);
    console.log(`   Verify Token: ${webhookToken ? '***' + webhookToken.slice(-4) : 'Not set'}`);
  }

  console.log('\n🎯 RECOMMENDED NEXT STEPS:');
  console.log('1. Go to https://webhook.site/');
  console.log('2. Copy the unique URL (e.g., https://webhook.site/abc123)');
  console.log('3. Go to Meta Developer Console');
  console.log('4. Set webhook URL to the webhook.site URL');
  console.log('5. Use your verify token: ng99c6yzbmuqru72q9bp');
  console.log('6. Test verification - it should work!');
  console.log('7. Once verified, you can see incoming webhooks on webhook.site');
}

// Run the solution
webhookTestSolution().catch(console.error);
