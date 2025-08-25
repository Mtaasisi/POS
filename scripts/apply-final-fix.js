import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseFix() {
    console.log('🧪 Testing database fixes...\n');
    
    try {
        // Test the exact query that was causing the 400 error
        console.log('1. Testing the problematic query...');
        
        const { data, error } = await supabase
            .from('whatsapp_auto_reply_rules')
            .select('id, trigger, response, enabled, case_sensitive, exact_match, priority, category, delay_seconds, max_uses_per_day, current_uses_today, last_used_at, conditions, variables, created_at, updated_at')
            .limit(1);
        
        if (error) {
            console.log('❌ Query still failing:', error.message);
            return false;
        } else {
            console.log('✅ Query working!');
            console.log('   Found records:', data.length);
            if (data.length > 0) {
                console.log('   Sample record keys:', Object.keys(data[0]));
            }
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error testing database:', error.message);
        return false;
    }
}

async function testWhatsAppProxy() {
    console.log('\n🧪 Testing WhatsApp proxy...');
    
    try {
        // Test the health endpoint
        const response = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'health' })
        });
        
        const data = await response.json();
        
        console.log(`   HTTP Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('✅ WhatsApp proxy is working');
            console.log('   Status:', data.status);
            console.log('   Credentials configured:', data.credentials_configured);
            return true;
        } else {
            console.log('❌ WhatsApp proxy has issues');
            console.log('   Response:', JSON.stringify(data, null, 2));
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error testing WhatsApp proxy:', error.message);
        return false;
    }
}

async function testWhatsAppProxyWithFixedVersion() {
    console.log('\n🧪 Testing fixed WhatsApp proxy...');
    
    try {
        // Test the fixed version
        const response = await fetch('https://inauzwa.store/api/whatsapp-proxy-fixed-v3.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'health' })
        });
        
        const data = await response.json();
        
        console.log(`   HTTP Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('✅ Fixed WhatsApp proxy is working');
            console.log('   Status:', data.status);
            console.log('   Function:', data.function);
            return true;
        } else {
            console.log('❌ Fixed WhatsApp proxy has issues');
            console.log('   Response:', JSON.stringify(data, null, 2));
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error testing fixed WhatsApp proxy:', error.message);
        return false;
    }
}

async function generateSQLCommands() {
    console.log('\n📋 SQL Commands to Run in Supabase Dashboard:');
    console.log('==============================================');
    
    const sqlCommands = `
-- Run this in Supabase SQL Editor to fix the database

-- Add missing columns
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records with default values
UPDATE whatsapp_auto_reply_rules 
SET 
    name = COALESCE(name, 'Auto Reply Rule ' || id::text),
    description = COALESCE(description, 'Automated response rule')
WHERE name IS NULL OR description IS NULL;

-- Update existing rules with meaningful names
UPDATE whatsapp_auto_reply_rules 
SET 
    name = CASE 
        WHEN trigger_text ILIKE '%hello%' THEN 'Welcome Message'
        WHEN trigger_text ILIKE '%help%' THEN 'Help Request'
        WHEN trigger_text ILIKE '%thank%' THEN 'Thank You Response'
        WHEN trigger_text ILIKE '%hours%' THEN 'Business Hours'
        WHEN trigger_text ILIKE '%contact%' THEN 'Contact Information'
        ELSE 'Auto Reply Rule ' || id::text
    END,
    description = CASE 
        WHEN trigger_text ILIKE '%hello%' THEN 'Auto-reply to welcome messages'
        WHEN trigger_text ILIKE '%help%' THEN 'Auto-reply to help requests'
        WHEN trigger_text ILIKE '%thank%' THEN 'Auto-reply to thank you messages'
        WHEN trigger_text ILIKE '%hours%' THEN 'Auto-reply about business hours'
        WHEN trigger_text ILIKE '%contact%' THEN 'Auto-reply with contact information'
        ELSE 'Automated response rule'
    END
WHERE name = 'Auto Reply Rule ' || id::text;

-- Set proper defaults
ALTER TABLE whatsapp_auto_reply_rules 
ALTER COLUMN name SET DEFAULT 'Auto Reply Rule',
ALTER COLUMN description SET DEFAULT 'Automated response rule';

-- Create compatibility view
CREATE OR REPLACE VIEW whatsapp_auto_reply_rules_compat AS
SELECT 
    id,
    COALESCE(name, 'Auto Reply Rule ' || id::text) as name,
    COALESCE(description, 'Automated response rule') as description,
    trigger_text as trigger,
    response_text as response,
    is_active as enabled,
    trigger_type,
    case_sensitive,
    exact_match,
    priority,
    COALESCE(category, 'general') as category,
    delay_seconds,
    max_uses_per_day,
    current_uses_today,
    last_used_at,
    conditions,
    variables,
    created_at,
    updated_at
FROM whatsapp_auto_reply_rules;
`;
    
    console.log(sqlCommands);
}

async function runFinalTest() {
    console.log('🚀 Running Final 400 Error Fix Test\n');
    
    // Test database fixes
    const dbFixed = await testDatabaseFix();
    
    // Test WhatsApp proxy
    const proxyWorking = await testWhatsAppProxy();
    
    // Test fixed WhatsApp proxy
    const fixedProxyWorking = await testWhatsAppProxyWithFixedVersion();
    
    // Generate SQL commands
    await generateSQLCommands();
    
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`Database Query: ${dbFixed ? '✅ Fixed' : '❌ Still Broken'}`);
    console.log(`WhatsApp Proxy: ${proxyWorking ? '✅ Working' : '❌ Issues'}`);
    console.log(`Fixed WhatsApp Proxy: ${fixedProxyWorking ? '✅ Working' : '❌ Issues'}`);
    
    if (dbFixed && (proxyWorking || fixedProxyWorking)) {
        console.log('\n🎉 Success! The 400 errors should be resolved.');
        console.log('\n💡 Recommendations:');
        console.log('1. Run the SQL commands in your Supabase dashboard');
        console.log('2. Use the fixed WhatsApp proxy (whatsapp-proxy-fixed-v3.php)');
        console.log('3. Update your frontend to use the correct column names');
    } else {
        console.log('\n⚠️  Some issues remain. Please check the details above.');
    }
}

runFinalTest().catch(console.error);
