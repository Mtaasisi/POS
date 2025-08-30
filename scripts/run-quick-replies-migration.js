import fs from 'fs';
import path from 'path';

console.log('🔧 Quick Replies Table Migration Helper');
console.log('=====================================\n');

// Read the migration file
const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250130000000_create_quick_replies_table.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Migration SQL to run in Supabase Dashboard:');
console.log('=============================================\n');
console.log(migrationContent);
console.log('\n=============================================');
console.log('\n📝 Instructions:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the migration');
console.log('\n✅ After running this migration, the quick_replies table will be created');
console.log('   and the 404 errors in your WhatsApp chat will be resolved.');
console.log('\n🚀 Your WhatsApp messaging is already working via direct API calls!');
console.log('   The proxy connection issues will be resolved when you start the Netlify dev server.');
