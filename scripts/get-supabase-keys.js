import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase Configuration Check\n');

console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT SET');

// Test with anon key first
if (supabaseAnonKey) {
    console.log('\n🧪 Testing with Anon Key...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
        const { data, error } = await supabaseAnon
            .from('whatsapp_auto_reply_rules')
            .select('id, name')
            .limit(1);
        
        if (error) {
            console.log('❌ Anon key error:', error.message);
        } else {
            console.log('✅ Anon key works!');
            console.log('   Found records:', data.length);
        }
    } catch (error) {
        console.log('❌ Anon key test failed:', error.message);
    }
}

// Test with service key
if (supabaseServiceKey) {
    console.log('\n🧪 Testing with Service Key...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
        const { data, error } = await supabaseService
            .from('whatsapp_auto_reply_rules')
            .select('id, name')
            .limit(1);
        
        if (error) {
            console.log('❌ Service key error:', error.message);
        } else {
            console.log('✅ Service key works!');
            console.log('   Found records:', data.length);
        }
    } catch (error) {
        console.log('❌ Service key test failed:', error.message);
    }
}

console.log('\n📋 Instructions:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to Settings > API');
console.log('3. Copy the "service_role" key (not the anon key)');
console.log('4. Update your .env file with:');
console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
console.log('5. Or update hosting-ready/api/config.php with the correct key');
