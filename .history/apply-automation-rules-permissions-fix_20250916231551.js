import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAutomationRulesPermissionsFix() {
  try {
    console.log('🔧 Applying automation_rules permissions fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-automation-rules-permissions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 SQL to execute:');
    console.log(sqlContent);
    console.log('');
    console.log('⚠️  Since we cannot execute DDL statements directly through the Supabase client,');
    console.log('   please copy the SQL above and run it in the Supabase SQL Editor.');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/sql');
    console.log('');
    console.log('✅ After running the SQL, the 404 errors should be resolved.');
    
    // Test current state
    console.log('\n🧪 Testing current state...');
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data, error } = await anonClient
      .from('automation_rules')
      .select('id, name, type, status')
      .limit(5);
    
    if (error) {
      console.log('❌ Current anon access error:', error.message);
    } else {
      console.log('✅ Current anon access result:', data?.length || 0, 'rules found');
      if (data && data.length > 0) {
        console.log('📋 Rules found:');
        data.forEach(rule => {
          console.log(`   - ${rule.name} (${rule.type}, ${rule.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
applyAutomationRulesPermissionsFix();
