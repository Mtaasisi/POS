#!/usr/bin/env node

/**
 * LATS Database Setup Script
 * This script sets up the LATS inventory management system database schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration
  console.log('🔧 Using fallback Supabase configuration');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function setupLatsDatabase() {
  try {
    console.log('🚀 Starting LATS database setup...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'lats_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Reading schema file...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Exception in statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Setup Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 LATS database setup completed successfully!');
      
      // Test the setup by checking if tables exist
      console.log('\n🔍 Testing database setup...');
      
      const testQueries = [
        'SELECT COUNT(*) FROM lats_categories',
        'SELECT COUNT(*) FROM lats_brands',
        'SELECT COUNT(*) FROM lats_suppliers',
        'SELECT COUNT(*) FROM lats_products',
        'SELECT COUNT(*) FROM lats_product_variants',
        'SELECT COUNT(*) FROM lats_pos_settings'
      ];
      
      for (const query of testQueries) {
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: query });
          if (error) {
            console.error(`❌ Test failed for: ${query}`, error.message);
          } else {
            console.log(`✅ Test passed for: ${query}`);
          }
        } catch (error) {
          console.error(`❌ Test exception for: ${query}`, error.message);
        }
      }
      
    } else {
      console.log('\n⚠️  LATS database setup completed with errors. Please check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupLatsDatabase();
