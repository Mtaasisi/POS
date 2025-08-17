import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupWhatsApp() {
  try {
    console.log('🚀 Setting up WhatsApp database tables...');
    console.log('📋 This script will create the necessary tables for WhatsApp functionality.');
    console.log('⚠️  Please run the SQL script in your Supabase dashboard if this fails.\n');
    
    // Check if tables already exist
    console.log('🔍 Checking existing tables...');
    
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'whatsapp_%');
    
    if (checkError) {
      console.log('⚠️  Could not check existing tables, proceeding with setup...');
    } else if (existingTables && existingTables.length > 0) {
      console.log('✅ WhatsApp tables already exist:');
      existingTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('\n🎉 Setup complete! You can now use WhatsApp features.');
      return;
    }
    
    console.log('📄 Please run the following SQL in your Supabase SQL Editor:');
    console.log('   (Copy and paste the contents of whatsapp-tables-simple.sql)\n');
    
    // Read and display the SQL file
    const sqlPath = path.join(__dirname, '..', 'whatsapp-tables-simple.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      console.log('📋 SQL Script Content:');
      console.log('='.repeat(50));
      console.log(sqlContent);
      console.log('='.repeat(50));
      console.log('\n📝 Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL above');
      console.log('4. Click "Run" to execute');
      console.log('5. Return to the app and refresh the WhatsApp page');
    } else {
      console.log('❌ SQL file not found. Please create the tables manually.');
    }
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create the following tables:');
    console.log('   - whatsapp_chats');
    console.log('   - whatsapp_messages');
    console.log('   - scheduled_whatsapp_messages');
    console.log('   - whatsapp_templates');
    console.log('   - whatsapp_autoresponders');
    console.log('   - whatsapp_campaigns');
    console.log('4. Enable RLS and create appropriate policies');
  }
}

setupWhatsApp();
