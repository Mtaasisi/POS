const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzE5NzQsImV4cCI6MjA1MTU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyLatsSchema() {
  console.log('🚀 Applying LATS schema directly...');
  
  try {
    // Read the manual schema file
    const schemaPath = path.join(__dirname, '../apply-lats-schema-manual.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('='));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the statement using the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.log(`❌ Error in statement ${i + 1}: ${errorData}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Error in statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Schema Application Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎉 LATS schema applied successfully!');
    } else {
      console.log('⚠️  Some statements failed. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply LATS schema:', error.message);
  }
}

// Run the function
applyLatsSchema();
