import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('👨‍🔧 Checking technicians in database...');

async function checkTechnicians() {
  try {
    // Get all users with technician role
    const { data: technicians, error } = await supabase
      .from('auth_users')
      .select('id, name, email, role')
      .eq('role', 'technician');

    if (error) {
      console.error('❌ Error fetching technicians:', error);
      return;
    }

    if (!technicians || technicians.length === 0) {
      console.log('⚠️  No technicians found in database');
      console.log('💡 This is why device creation is failing - no technicians available for assignment');
      console.log('🔧 To fix this, you need to:');
      console.log('   1. Create user accounts with role "technician"');
      console.log('   2. Or modify the form to not require technician assignment');
      return;
    }

    console.log('✅ Found technicians:');
    technicians.forEach((tech, index) => {
      console.log(`   ${index + 1}. ${tech.name || tech.email} (${tech.role}) - ID: ${tech.id}`);
    });

    // Also check for other roles
    const { data: allUsers, error: allUsersError } = await supabase
      .from('auth_users')
      .select('id, name, email, role')
      .limit(10);

    if (!allUsersError && allUsers) {
      console.log('\n👥 All users in system:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || user.email} (${user.role}) - ID: ${user.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkTechnicians();
