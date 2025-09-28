import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read the SQL script
const sqlScript = fs.readFileSync('./COMPREHENSIVE_REPAIR_CLEANUP.sql', 'utf8');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeRepairCleanup() {
    console.log('🚀 Starting Comprehensive Repair Payments Cleanup...');
    console.log('========================================');
    
    try {
        // Split the SQL script into individual statements
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip empty statements and comments
            if (!statement || statement.startsWith('--')) {
                continue;
            }

            console.log(`\n📋 Executing statement ${i + 1}/${statements.length}...`);
            console.log(`SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);

            try {
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_query: statement 
                });

                if (error) {
                    console.error(`❌ Error in statement ${i + 1}:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                    if (data) {
                        console.log('📊 Result:', data);
                    }
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Exception in statement ${i + 1}:`, err.message);
                errorCount++;
            }
        }

        console.log('\n========================================');
        console.log('🎯 REPAIR CLEANUP EXECUTION COMPLETE');
        console.log('========================================');
        console.log(`✅ Successful statements: ${successCount}`);
        console.log(`❌ Failed statements: ${errorCount}`);
        console.log(`📊 Total statements: ${statements.length}`);

        if (errorCount === 0) {
            console.log('\n🎉 ALL REPAIR PAYMENTS SUCCESSFULLY CLEANED UP!');
            console.log('🎉 Database is now completely clean of repair-related payments!');
        } else {
            console.log('\n⚠️  Some statements failed. Please review the errors above.');
        }

    } catch (error) {
        console.error('💥 Fatal error during cleanup:', error.message);
        process.exit(1);
    }
}

// Alternative approach using direct SQL execution
async function executeRepairCleanupDirect() {
    console.log('🚀 Starting Direct Repair Payments Cleanup...');
    console.log('========================================');
    
    try {
        // First, let's check what repair payments exist
        console.log('\n🔍 Checking for existing repair payments...');
        
        // Check for repair payments using multiple queries
        console.log('🔍 Searching for repair payments by notes...');
        const { data: repairPayments1, error: error1 } = await supabase
            .from('customer_payments')
            .select('*')
            .or('notes.ilike.%repair%,notes.ilike.%device repair%,notes.ilike.%repair payment%,notes.ilike.%fix%,notes.ilike.%maintenance%,notes.ilike.%xiaomi%,notes.ilike.%redmi%,notes.ilike.%broken%,notes.ilike.%damaged%,notes.ilike.%screen%,notes.ilike.%battery%,notes.ilike.%charging%,notes.ilike.%water damage%,notes.ilike.%software%,notes.ilike.%update%,notes.ilike.%flash%,notes.ilike.%unlock%,notes.ilike.%root%,notes.ilike.%jailbreak%');

        console.log('🔍 Searching for repair payments by method...');
        const { data: repairPayments2, error: error2 } = await supabase
            .from('customer_payments')
            .select('*')
            .or('method.eq.repair,method.eq.maintenance,method.eq.fix,method.eq.service,method.eq.technician,method.eq.workshop');

        console.log('🔍 Searching for repair payments by payment_type...');
        const { data: repairPayments3, error: error3 } = await supabase
            .from('customer_payments')
            .select('*')
            .or('payment_type.eq.repair,payment_type.eq.maintenance,payment_type.eq.fix,payment_type.eq.service,payment_type.eq.technician,payment_type.eq.workshop');

        console.log('🔍 Searching for repair payments by reference...');
        const { data: repairPayments4, error: error4 } = await supabase
            .from('customer_payments')
            .select('*')
            .or('reference.ilike.%repair%,reference.ilike.%fix%,reference.ilike.%maintenance%,reference.ilike.%service%,reference.ilike.%technician%,reference.ilike.%workshop%,reference.ilike.%xiaomi%,reference.ilike.%redmi%');

        const checkError = error1 || error2 || error3 || error4;
        
        // Combine all repair payments and remove duplicates
        const allRepairPayments = [
            ...(repairPayments1 || []),
            ...(repairPayments2 || []),
            ...(repairPayments3 || []),
            ...(repairPayments4 || [])
        ];
        
        // Remove duplicates based on ID
        const uniqueRepairPayments = allRepairPayments.filter((payment, index, self) => 
            index === self.findIndex(p => p.id === payment.id)
        );

        if (checkError) {
            console.error('❌ Error checking repair payments:', checkError.message);
            return;
        }

        console.log(`📊 Found ${uniqueRepairPayments?.length || 0} repair payments to remove`);

        if (uniqueRepairPayments && uniqueRepairPayments.length > 0) {
            console.log('\n📋 Repair payments found:');
            uniqueRepairPayments.forEach((payment, index) => {
                console.log(`${index + 1}. ID: ${payment.id}, Amount: ${payment.amount}, Notes: ${payment.notes?.substring(0, 50)}...`);
            });

            // Get IDs of repair payments to delete
            const repairPaymentIds = uniqueRepairPayments.map(p => p.id);

            console.log('\n🗑️  Deleting repair payments...');
            
            const { data: deleteData, error: deleteError } = await supabase
                .from('customer_payments')
                .delete()
                .in('id', repairPaymentIds);

            if (deleteError) {
                console.error('❌ Error deleting repair payments:', deleteError.message);
                return;
            }

            console.log(`✅ Successfully deleted ${repairPaymentIds.length} repair payments`);
        } else {
            console.log('✅ No repair payments found - database is already clean!');
        }

        // Final verification
        console.log('\n🔍 Final verification...');
        const { data: finalCheck, error: finalError } = await supabase
            .from('customer_payments')
            .select('id')
            .or(`
                notes.ilike.%repair%,
                notes.ilike.%device repair%,
                notes.ilike.%repair payment%,
                notes.ilike.%fix%,
                notes.ilike.%maintenance%,
                notes.ilike.%xiaomi%,
                notes.ilike.%redmi%,
                method.eq.repair,
                method.eq.maintenance,
                method.eq.fix,
                payment_type.eq.repair,
                payment_type.eq.maintenance,
                payment_type.eq.fix
            `)
            .limit(1);

        if (finalError) {
            console.error('❌ Error in final verification:', finalError.message);
            return;
        }

        if (finalCheck && finalCheck.length > 0) {
            console.log('⚠️  Warning: Some repair payments may still exist');
        } else {
            console.log('🎉 SUCCESS: All repair payments have been completely removed!');
            console.log('🎉 Database is now clean of all repair-related payments!');
        }

        console.log('\n========================================');
        console.log('✅ REPAIR CLEANUP COMPLETED SUCCESSFULLY');
        console.log('========================================');

    } catch (error) {
        console.error('💥 Fatal error during cleanup:', error.message);
        process.exit(1);
    }
}

// Execute the cleanup
executeRepairCleanupDirect();
