import fs from 'fs';
import path from 'path';

console.log('🔧 Quick Replies Table Migration (Simple Version)');
console.log('================================================\n');

// Read the simple migration file
const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250130000000_create_quick_replies_table_simple.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Simple Migration SQL to run in Supabase Dashboard:');
console.log('=====================================================\n');
console.log(migrationContent);
console.log('\n=====================================================');
console.log('\n📝 Instructions:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the migration');
console.log('\n✅ After running this migration:');
console.log('   - The quick_replies table will be created');
console.log('   - 404 errors in your WhatsApp chat will be resolved');
console.log('   - You can add sample quick replies with: npm run whatsapp:add-sample-replies');
console.log('\n🚀 Your WhatsApp messaging is already working via direct API calls!');
