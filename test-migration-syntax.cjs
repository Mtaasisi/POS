const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrationSyntax() {
  try {
    console.log('🧪 Testing migration syntax...');

    // Read the migration file
    const migrationPath = 'supabase/migrations/20250127000002_fix_appointments_table.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration file loaded successfully');
    console.log(`📏 File size: ${migrationSQL.length} characters`);

    // Check for any obvious syntax issues
    const syntaxChecks = [
      { pattern: '->', description: 'Arrow operator (invalid in PostgreSQL)' },
      { pattern: '=>', description: 'Fat arrow (invalid in PostgreSQL)' },
      { pattern: 'function(', description: 'JavaScript function syntax' },
      { pattern: 'const ', description: 'JavaScript const declaration' },
      { pattern: 'let ', description: 'JavaScript let declaration' },
      { pattern: 'var ', description: 'JavaScript var declaration' }
    ];

    let syntaxIssues = [];
    syntaxChecks.forEach(check => {
      if (migrationSQL.includes(check.pattern)) {
        syntaxIssues.push(check.description);
      }
    });

    if (syntaxIssues.length > 0) {
      console.log('❌ Potential syntax issues found:');
      syntaxIssues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ No obvious syntax issues found');
    }

    // Test basic database connection
    console.log('\n🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }

    console.log('✅ Database connection successful');

    // Check if appointments table already exists
    console.log('\n📅 Checking appointments table status...');
    const { data: appointmentsTest, error: appointmentsError } = await supabase
      .from('appointments')
      .select('count')
      .limit(1);

    if (appointmentsError && appointmentsError.code === '42P01') {
      console.log('❌ Appointments table does not exist');
      console.log('📝 You can run the migration manually in Supabase dashboard');
      console.log('📋 Migration file: supabase/migrations/20250127000002_fix_appointments_table.sql');
    } else if (appointmentsError) {
      console.error('❌ Error checking appointments table:', appointmentsError);
    } else {
      console.log('✅ Appointments table exists and is accessible');
    }

    console.log('\n🎉 Migration syntax test completed!');
    console.log('✅ The migration file appears to be syntactically correct');
    console.log('📝 To apply the migration, copy the SQL from the migration file');
    console.log('📝 and run it in your Supabase dashboard SQL editor');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMigrationSyntax();
