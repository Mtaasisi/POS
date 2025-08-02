import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Checking available tables...\n');

async function checkTables() {
    // Common table names to test
    const possibleTables = [
        'customers', 'devices', 'settings', 'brands', 'categories', 'inventory_categories',
        'spare_parts', 'repairs', 'payments', 'sms_logs', 'whatsapp_messages',
        'audit_logs', 'user_goals', 'staff_points', 'customer_checkins',
        'finance_expenses', 'finance_transfers', 'purchase_orders', 'inventory_items'
    ];

    const existingTables = [];

    for (const table of possibleTables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (!error) {
                existingTables.push(table);
                console.log(`✅ Table ${table}: EXISTS`);
            } else {
                console.log(`❌ Table ${table}: ${error.message}`);
            }
        } catch (error) {
            console.log(`❌ Table ${table}: ${error.message}`);
        }
    }

    console.log(`\n📊 Summary: ${existingTables.length} tables found`);
    console.log('Available tables:', existingTables.join(', '));
}

checkTables().catch(console.error); 