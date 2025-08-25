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

async function checkTableStructure() {
    console.log('🔍 Checking table structure...\n');
    
    try {
        // Try to get table info
        const { data, error } = await supabase
            .from('whatsapp_auto_reply_rules')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error accessing table:', error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('✅ Table accessible!');
            console.log('📋 Available columns:');
            console.log(Object.keys(data[0]));
            
            // Check specific columns that might be missing
            const sampleRecord = data[0];
            const expectedColumns = [
                'id', 'name', 'description', 'trigger_type', 'trigger_text', 
                'response_text', 'is_active', 'priority', 'trigger', 'response', 
                'enabled', 'case_sensitive', 'exact_match', 'category', 
                'delay_seconds', 'max_uses_per_day', 'current_uses_today', 
                'last_used_at', 'conditions', 'variables', 'created_at', 'updated_at'
            ];
            
            console.log('\n🔍 Checking expected columns:');
            expectedColumns.forEach(col => {
                const exists = col in sampleRecord;
                console.log(`${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
            });
        } else {
            console.log('⚠️ Table exists but is empty');
        }
        
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

async function testQuery() {
    console.log('\n🧪 Testing the problematic query...\n');
    
    try {
        // Test the exact query that's failing
        const { data, error } = await supabase
            .from('whatsapp_auto_reply_rules')
            .select('id,trigger,response,enabled,case_sensitive,exact_match,priority,category,delay_seconds,max_uses_per_day,current_uses_today,last_used_at,conditions,variables,created_at,updated_at');
            
        if (error) {
            console.error('❌ Query failed:', error);
            console.log('\n🔧 This is the exact error from your browser console!');
        } else {
            console.log('✅ Query successful!');
            console.log('📊 Records found:', data.length);
        }
        
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

async function runDiagnostic() {
    await checkTableStructure();
    await testQuery();
}

runDiagnostic().catch(console.error);
