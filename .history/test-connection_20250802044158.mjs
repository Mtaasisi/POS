import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Testing app connections...\n');

async function testConnection() {
    try {
        console.log('📡 Testing network connectivity...');
        const startTime = Date.now();
        const response = await fetch('https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/', {
            method: 'HEAD'
        });
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            console.log(`✅ Network OK (${responseTime}ms)`);
        } else {
            console.log(`⚠️ Network response: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
    }

    try {
        console.log('\n🗄️ Testing Supabase connection...');
        const startTime = Date.now();
        const { data, error } = await supabase
            .from('settings')
            .select('key')
            .limit(1);
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
            console.log(`❌ Supabase error: ${error.message}`);
        } else {
            console.log(`✅ Supabase OK (${responseTime}ms)`);
        }
    } catch (error) {
        console.log(`❌ Supabase error: ${error.message}`);
    }

    try {
        console.log('\n📊 Testing database tables...');
        const tables = ['customers', 'devices', 'settings', 'categories', 'brands'];
        let successCount = 0;
        let totalTime = 0;
        
        for (const table of tables) {
            try {
                const startTime = Date.now();
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                const responseTime = Date.now() - startTime;
                totalTime += responseTime;
                
                if (!error) {
                    successCount++;
                    console.log(`✅ Table ${table}: OK (${responseTime}ms)`);
                } else {
                    console.log(`❌ Table ${table}: ${error.message}`);
                }
            } catch (error) {
                console.log(`❌ Table ${table}: ${error.message}`);
            }
        }
        
        if (successCount === tables.length) {
            console.log(`✅ All tables OK (avg: ${Math.round(totalTime/tables.length)}ms)`);
        } else {
            console.log(`⚠️ ${successCount}/${tables.length} tables OK`);
        }
    } catch (error) {
        console.log(`❌ Table test error: ${error.message}`);
    }

    try {
        console.log('\n🔐 Testing authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.log(`❌ Auth error: ${error.message}`);
        } else if (session) {
            console.log(`✅ Authenticated as: ${session.user.email}`);
        } else {
            console.log('ℹ️ No active session (normal for public access)');
        }
    } catch (error) {
        console.log(`❌ Auth error: ${error.message}`);
    }

    try {
        console.log('\n📱 Testing app server...');
        const response = await fetch('http://localhost:5173');
        if (response.ok) {
            console.log('✅ App server running on port 5173');
        } else {
            console.log(`⚠️ App server: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ App server error: ${error.message}`);
    }

    console.log('\n✅ Connection test completed!');
}

testConnection().catch(console.error); 