import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentTables() {
    try {
        console.log('🔍 Checking current database tables...\n');

        // Check if lats_spare_parts table exists
        const { data: sparePartsData, error: sparePartsError } = await supabase
            .from('lats_spare_parts')
            .select('*')
            .limit(1);

        if (sparePartsError) {
            console.log('❌ lats_spare_parts table does not exist or has issues:');
            console.log('   Error:', sparePartsError.message);
        } else {
            console.log('✅ lats_spare_parts table exists');
            
            // Try to get column information
            try {
                const { data: columns, error: columnsError } = await supabase
                    .rpc('get_table_columns', { table_name: 'lats_spare_parts' });
                
                if (columnsError) {
                    console.log('   Could not get column details:', columnsError.message);
                } else if (columns) {
                    console.log('   Columns:', columns.map(col => col.column_name).join(', '));
                }
            } catch (err) {
                console.log('   Could not get column details (function not available)');
            }
        }

        // Check if lats_spare_part_usage table exists
        const { data: usageData, error: usageError } = await supabase
            .from('lats_spare_part_usage')
            .select('*')
            .limit(1);

        if (usageError) {
            console.log('❌ lats_spare_part_usage table does not exist or has issues:');
            console.log('   Error:', usageError.message);
        } else {
            console.log('✅ lats_spare_part_usage table exists');
        }

        // Check other related tables
        const tablesToCheck = [
            'lats_categories',
            'lats_suppliers'
        ];

        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ ${table} table has issues:`, error.message);
                } else {
                    console.log(`✅ ${table} table exists`);
                }
            } catch (err) {
                console.log(`❌ ${table} table does not exist or is not accessible`);
            }
        }

        console.log('\n📋 Summary:');
        console.log('   - If lats_spare_parts table exists, we can add missing columns');
        console.log('   - If it doesn\'t exist, we need to create it');
        console.log('   - The migration will handle both cases safely');

    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
    }
}

checkCurrentTables();
