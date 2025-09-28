#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runChunk(chunkNumber) {
    const filename = `update-customers-chunk-${chunkNumber}.sql`;
    
    if (!fs.existsSync(filename)) {
        console.log(`❌ File ${filename} not found`);
        return false;
    }
    
    console.log(`🚀 Running chunk ${chunkNumber}...`);
    
    try {
        const sqlContent = fs.readFileSync(filename, 'utf8');
        
        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`   Executing: ${statement.substring(0, 50)}...`);
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: statement
                });
                
                if (error) {
                    console.error(`   ❌ Error: ${error.message}`);
                    return false;
                }
                
                console.log(`   ✅ Success`);
            }
        }
        
        console.log(`✅ Chunk ${chunkNumber} completed successfully`);
        return true;
        
    } catch (error) {
        console.error(`❌ Error running chunk ${chunkNumber}:`, error.message);
        return false;
    }
}

async function runAllChunks() {
    console.log('🚀 Starting automatic customer update...');
    console.log('=====================================');
    
    const totalChunks = 12;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 1; i <= totalChunks; i++) {
        console.log(`\n📦 Processing chunk ${i}/${totalChunks}`);
        
        const success = await runChunk(i);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
            console.log(`⚠️  Chunk ${i} failed, but continuing with next chunk...`);
        }
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 All chunks processed!');
    console.log('========================');
    console.log(`✅ Successful: ${successCount} chunks`);
    console.log(`❌ Failed: ${failCount} chunks`);
    
    if (failCount === 0) {
        console.log('\n🎯 All customers updated successfully!');
        console.log('📊 Run run-complete-update.sql to check results');
    } else {
        console.log('\n⚠️  Some chunks failed. Check the errors above.');
    }
}

// Check if Supabase credentials are available
if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-anon-key') {
    console.log('❌ Supabase credentials not configured');
    console.log('📋 Please set environment variables:');
    console.log('   export SUPABASE_URL="your-supabase-url"');
    console.log('   export SUPABASE_ANON_KEY="your-supabase-anon-key"');
    console.log('\n🔧 Or update the script with your credentials');
    process.exit(1);
}

// Run the update
runAllChunks().catch(console.error);
