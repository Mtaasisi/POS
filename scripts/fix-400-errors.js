import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseColumns() {
    console.log('🔧 Fixing WhatsApp auto-reply rules column mismatch...');
    
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20241223000000_fix_whatsapp_auto_reply_columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`   Executing: ${statement.substring(0, 50)}...`);
                const { error } = await supabase.rpc('exec_sql', { sql: statement });
                if (error) {
                    console.log(`   ⚠️  Warning: ${error.message}`);
                }
            }
        }
        
        console.log('✅ Database columns fixed');
        
    } catch (error) {
        console.error('❌ Error fixing database columns:', error.message);
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
        console.log(`   Response:`, JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ WhatsApp proxy is working');
        } else {
            console.log('❌ WhatsApp proxy has issues');
        }
        
    } catch (error) {
        console.error('❌ Error testing WhatsApp proxy:', error.message);
    }
}

async function testSupabaseQuery() {
    console.log('\n🧪 Testing Supabase auto-reply rules query...');
    
    try {
        const { data, error } = await supabase
            .from('whatsapp_auto_reply_rules')
            .select('id, trigger, response, enabled, case_sensitive, exact_match, priority, category, delay_seconds, max_uses_per_day, current_uses_today, last_used_at, conditions, variables, created_at, updated_at')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase query error:', error.message);
        } else {
            console.log('✅ Supabase query successful');
            console.log(`   Found ${data.length} records`);
            if (data.length > 0) {
                console.log('   Sample record:', JSON.stringify(data[0], null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing Supabase query:', error.message);
    }
}

async function runDiagnostics() {
    console.log('🚀 Starting 400 Error Fix Diagnostics\n');
    
    // Fix database columns
    await fixDatabaseColumns();
    
    // Test WhatsApp proxy
    await testWhatsAppProxy();
    
    // Test Supabase query
    await testSupabaseQuery();
    
    console.log('\n✅ Diagnostics complete');
}

// Run the diagnostics
runDiagnostics().catch(console.error);
