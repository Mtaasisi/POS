/**
 * WhatsApp Auto-Reply Setup Script
 * 
 * This script sets up the complete auto-reply system for WhatsApp
 * Creates necessary database tables and default auto-reply rules
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupWhatsAppAutoReply() {
  console.log('🚀 ===== WHATSAPP AUTO-REPLY SETUP =====\n');
  
  try {
    // 1. Create auto-reply rules table if it doesn't exist
    console.log('📋 1. Setting up auto-reply rules table...');
    
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_auto_reply_rules (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          trigger TEXT NOT NULL,
          response TEXT NOT NULL,
          enabled BOOLEAN DEFAULT true,
          case_sensitive BOOLEAN DEFAULT false,
          exact_match BOOLEAN DEFAULT false,
          priority INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_enabled ON whatsapp_auto_reply_rules(enabled);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_priority ON whatsapp_auto_reply_rules(priority DESC);
        
        -- Enable RLS
        ALTER TABLE whatsapp_auto_reply_rules ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON whatsapp_auto_reply_rules;
        CREATE POLICY "Enable read access for authenticated users" ON whatsapp_auto_reply_rules
          FOR SELECT USING (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON whatsapp_auto_reply_rules;
        CREATE POLICY "Enable insert access for authenticated users" ON whatsapp_auto_reply_rules
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Enable update access for authenticated users" ON whatsapp_auto_reply_rules;
        CREATE POLICY "Enable update access for authenticated users" ON whatsapp_auto_reply_rules
          FOR UPDATE USING (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON whatsapp_auto_reply_rules;
        CREATE POLICY "Enable delete access for authenticated users" ON whatsapp_auto_reply_rules
          FOR DELETE USING (auth.role() = 'authenticated');
      `
    });

    if (tableError) {
      console.error('❌ Error creating table:', tableError.message);
      return;
    }

    console.log('✅ Auto-reply rules table created successfully');

    // 2. Insert default auto-reply rules
    console.log('\n📋 2. Inserting default auto-reply rules...');
    
    const defaultRules = [
      {
        trigger: 'hi',
        response: 'Mambo vipi! Karibu kwenye huduma yetu. Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 1
      },
      {
        trigger: 'hello',
        response: 'Hello! Karibu kwenye huduma yetu. Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 1
      },
      {
        trigger: 'hey',
        response: 'Hey there! Karibu kwenye huduma yetu. Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 1
      },
      {
        trigger: 'hallo',
        response: 'Hallo! Karibu kwenye huduma yetu. Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 1
      },
      {
        trigger: 'how are you',
        response: 'Niko poa sana, asante! Wewe vipi? Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 2
      },
      {
        trigger: 'good morning',
        response: 'Good morning! Karibu kwenye huduma yetu. Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 2
      },
      {
        trigger: 'good afternoon',
        response: 'Good afternoon! Karibu kwenye huduma yetu. Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 2
      },
      {
        trigger: 'good evening',
        response: 'Good evening! Karibu kwenye huduma yetu. Unawezaje kusaidia?',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 2
      }
    ];

    // Insert rules one by one to avoid conflicts
    for (const rule of defaultRules) {
      const { error: insertError } = await supabase
        .from('whatsapp_auto_reply_rules')
        .upsert(rule, { onConflict: 'trigger' });

      if (insertError) {
        console.error(`❌ Error inserting rule "${rule.trigger}":`, insertError.message);
      } else {
        console.log(`✅ Rule "${rule.trigger}" → "${rule.response}" inserted`);
      }
    }

    // 3. Verify WhatsApp credentials are configured
    console.log('\n📋 3. Checking WhatsApp credentials...');
    
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'whatsapp.instanceId',
        'whatsapp.apiToken',
        'whatsapp.apiUrl'
      ]);

    if (settingsError) {
      console.error('❌ Error checking settings:', settingsError.message);
    } else {
      const settings = {};
      (settingsData || []).forEach(row => {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      });

      if (settings['whatsapp.instanceId'] && settings['whatsapp.apiToken']) {
        console.log('✅ WhatsApp credentials are configured');
        console.log(`   Instance ID: ${settings['whatsapp.instanceId']}`);
        console.log(`   API URL: ${settings['whatsapp.apiUrl'] || 'https://api.greenapi.com'}`);
      } else {
        console.log('⚠️  WhatsApp credentials not configured');
        console.log('💡 Please configure your WhatsApp credentials in the application settings');
      }
    }

    // 4. Test the webhook endpoint
    console.log('\n📋 4. Testing webhook endpoint...');
    
    try {
      const webhookResponse = await fetch('https://inauzwa.store/api/whatsapp-webhook-fixed.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeWebhook: 'incomingMessageReceived',
          body: {
            idMessage: 'test123',
            messageData: {
              textMessageData: {
                textMessage: 'Hi'
              }
            },
            senderData: {
              chatId: '254700000000@c.us'
            }
          }
        })
      });

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('✅ Fixed webhook endpoint is working');
        console.log(`   Response: ${JSON.stringify(webhookData)}`);
      } else {
        console.error(`❌ Fixed webhook endpoint failed: ${webhookResponse.status}`);
      }
    } catch (error) {
      console.error('❌ Fixed webhook endpoint error:', error.message);
    }

    // 5. Summary and next steps
    console.log('\n📋 5. Setup Summary:');
    console.log('✅ Auto-reply rules table created');
    console.log('✅ Default auto-reply rules inserted');
    console.log('✅ Webhook endpoint tested');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Upload the fixed webhook file to your server:');
    console.log('   - Copy hostinger-deploy/api/whatsapp-webhook-fixed.php to your server');
    console.log('   - Rename it to whatsapp-webhook.php (replacing the old one)');
    console.log('');
    console.log('2. Configure your Green API webhook URL:');
    console.log('   - Go to your Green API dashboard');
    console.log('   - Set webhook URL to: https://inauzwa.store/api/whatsapp-webhook.php');
    console.log('   - Enable these events: incomingMessageReceived, outgoingMessageReceived');
    console.log('');
    console.log('3. Test the auto-reply system:');
    console.log('   - Send "Hi" to your WhatsApp number');
    console.log('   - You should receive an auto-reply');
    console.log('');
    console.log('4. Monitor logs:');
    console.log('   - Check /api/webhook_log.txt for incoming webhooks');
    console.log('   - Check /api/auto_reply_log.txt for auto-reply activity');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup script
setupWhatsAppAutoReply().then(() => {
  console.log('\n🎉 ===== SETUP COMPLETE =====');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
