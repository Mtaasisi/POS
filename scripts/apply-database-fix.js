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

async function applyDatabaseFix() {
    console.log('🔧 Applying database column fixes...\n');
    
    try {
        // Test current table structure
        console.log('1. Testing current table structure...');
        const { data: currentData, error: currentError } = await supabase
            .from('whatsapp_auto_reply_rules')
            .select('*')
            .limit(1);
        
        if (currentError) {
            console.log('❌ Error accessing table:', currentError.message);
            return;
        }
        
        console.log('✅ Table accessible');
        if (currentData.length > 0) {
            console.log('   Current columns:', Object.keys(currentData[0]));
        }
        
        // Try to add missing columns using RPC (if available)
        console.log('\n2. Adding missing columns...');
        
        const columnsToAdd = [
            'trigger TEXT',
            'response TEXT', 
            'enabled BOOLEAN DEFAULT true',
            'case_sensitive BOOLEAN DEFAULT false',
            'exact_match BOOLEAN DEFAULT false'
        ];
        
        for (const columnDef of columnsToAdd) {
            const columnName = columnDef.split(' ')[0];
            console.log(`   Adding column: ${columnName}`);
            
            try {
                // Try to select the column to see if it exists
                const { error: testError } = await supabase
                    .from('whatsapp_auto_reply_rules')
                    .select(columnName)
                    .limit(1);
                
                if (testError && testError.message.includes('column') && testError.message.includes('does not exist')) {
                    console.log(`   ⚠️  Column ${columnName} doesn't exist - needs manual migration`);
                } else {
                    console.log(`   ✅ Column ${columnName} exists`);
                }
            } catch (error) {
                console.log(`   ⚠️  Could not test column ${columnName}:`, error.message);
            }
        }
        
        // Test the query that's causing the 400 error
        console.log('\n3. Testing the problematic query...');
        
        const { data: testData, error: testError } = await supabase
            .from('whatsapp_auto_reply_rules')
            .select('id, name, description, trigger_text, response_text, is_active, priority')
            .limit(1);
        
        if (testError) {
            console.log('❌ Query still failing:', testError.message);
        } else {
            console.log('✅ Query working with correct column names');
            console.log('   Found records:', testData.length);
        }
        
        // Test the exact query from the error
        console.log('\n4. Testing the exact query from the error...');
        
        const { data: exactData, error: exactError } = await supabase
            .from('whatsapp_auto_reply_rules')
            .select('id, trigger, response, enabled, case_sensitive, exact_match, priority, category, delay_seconds, max_uses_per_day, current_uses_today, last_used_at, conditions, variables, created_at, updated_at')
            .limit(1);
        
        if (exactError) {
            console.log('❌ Exact query failing:', exactError.message);
            console.log('\n💡 Solution: The frontend is using wrong column names.');
            console.log('   Expected: trigger, response, enabled, case_sensitive, exact_match');
            console.log('   Actual:   trigger_text, response_text, is_active');
        } else {
            console.log('✅ Exact query working!');
        }
        
    } catch (error) {
        console.error('❌ Error applying database fix:', error.message);
    }
}

async function createCompatibilityView() {
    console.log('\n🔧 Creating compatibility view...');
    
    try {
        // Create a view that maps the expected column names to actual ones
        const createViewSQL = `
            CREATE OR REPLACE VIEW whatsapp_auto_reply_rules_compat AS
            SELECT 
                id,
                name,
                description,
                trigger_text as trigger,
                response_text as response,
                is_active as enabled,
                trigger_type,
                CASE WHEN trigger_type = 'exact_match' THEN true ELSE false END as case_sensitive,
                CASE WHEN trigger_type = 'exact_match' THEN true ELSE false END as exact_match,
                priority,
                COALESCE(category, 'general') as category,
                COALESCE(delay_seconds, 0) as delay_seconds,
                COALESCE(max_uses_per_day, 0) as max_uses_per_day,
                COALESCE(current_uses_today, 0) as current_uses_today,
                last_used_at,
                COALESCE(conditions, '{}') as conditions,
                COALESCE(variables, '{}') as variables,
                created_at,
                updated_at
            FROM whatsapp_auto_reply_rules;
        `;
        
        // Note: This would need to be run in Supabase SQL editor
        console.log('📋 SQL to run in Supabase SQL Editor:');
        console.log(createViewSQL);
        
    } catch (error) {
        console.error('❌ Error creating compatibility view:', error.message);
    }
}

async function runFix() {
    console.log('🚀 Starting Database Fix Process\n');
    
    await applyDatabaseFix();
    await createCompatibilityView();
    
    console.log('\n✅ Database fix process complete');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL commands shown above');
    console.log('4. Or update your frontend code to use correct column names');
}

runFix().catch(console.error);
