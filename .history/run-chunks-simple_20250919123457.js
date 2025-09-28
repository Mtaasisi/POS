#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runChunk(chunkNumber) {
    const filename = `update-customers-chunk-${chunkNumber}.sql`;
    
    if (!fs.existsSync(filename)) {
        console.log(`❌ File ${filename} not found`);
        return false;
    }
    
    console.log(`🚀 Running chunk ${chunkNumber}...`);
    
    try {
        // Try different methods to run the SQL
        const methods = [
            // Method 1: Direct psql if available
            `psql "${process.env.DATABASE_URL}" < "${filename}"`,
            // Method 2: Supabase CLI
            `supabase db push --db-url "${process.env.DATABASE_URL}" < "${filename}"`,
            // Method 3: Just show the file content for manual copy-paste
            `echo "Please run ${filename} manually in your SQL editor"`
        ];
        
        for (const method of methods) {
            try {
                console.log(`   Trying: ${method.split(' ')[0]}...`);
                const { stdout, stderr } = await execAsync(method);
                
                if (stderr && !stderr.includes('warning')) {
                    throw new Error(stderr);
                }
                
                console.log(`   ✅ Chunk ${chunkNumber} completed successfully`);
                return true;
                
            } catch (error) {
                console.log(`   ⚠️  Method failed: ${error.message.split('\n')[0]}`);
                continue;
            }
        }
        
        // If all methods fail, show manual instructions
        console.log(`   📋 Manual execution required for chunk ${chunkNumber}`);
        console.log(`   📁 File: ${filename}`);
        return false;
        
    } catch (error) {
        console.error(`❌ Error running chunk ${chunkNumber}:`, error.message);
        return false;
    }
}

async function runAllChunks() {
    console.log('🚀 Starting automatic customer update...');
    console.log('=====================================');
    console.log('');
    
    // Check for database URL
    if (!process.env.DATABASE_URL) {
        console.log('⚠️  DATABASE_URL environment variable not set');
        console.log('📋 Set it with: export DATABASE_URL="your-database-url"');
        console.log('🔗 Or run chunks manually in your SQL editor');
        console.log('');
    }
    
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
        }
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 All chunks processed!');
    console.log('========================');
    console.log(`✅ Successful: ${successCount} chunks`);
    console.log(`❌ Failed: ${failCount} chunks`);
    
    if (failCount > 0) {
        console.log('\n📋 Manual execution required for failed chunks');
        console.log('🔧 Run each chunk file in your SQL editor:');
        for (let i = 1; i <= totalChunks; i++) {
            console.log(`   ${i}. update-customers-chunk-${i}.sql`);
        }
    }
    
    if (successCount > 0) {
        console.log('\n🎯 Some customers updated successfully!');
        console.log('📊 Run run-complete-update.sql to check results');
    }
}

// Run the update
runAllChunks().catch(console.error);
