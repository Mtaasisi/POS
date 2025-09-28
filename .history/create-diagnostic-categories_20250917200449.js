import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Creating diagnostic categories table...');

async function createCategories() {
  try {
    // First, try to insert some default categories
    const defaultCategories = [
      {
        name: 'General',
        description: 'General diagnostic issues and common problems',
        color: '#3B82F6',
        icon: 'Settings',
        sort_order: 1,
        is_active: true,
        created_by: null
      },
      {
        name: 'Power',
        description: 'Power-related issues including charging and battery problems',
        color: '#EF4444',
        icon: 'Battery',
        sort_order: 2,
        is_active: true,
        created_by: null
      },
      {
        name: 'Display',
        description: 'Screen, display, and visual issues',
        color: '#10B981',
        icon: 'Monitor',
        sort_order: 3,
        is_active: true,
        created_by: null
      },
      {
        name: 'Audio',
        description: 'Speaker, microphone, and audio-related problems',
        color: '#F59E0B',
        icon: 'Speaker',
        sort_order: 4,
        is_active: true,
        created_by: null
      },
      {
        name: 'Camera',
        description: 'Camera and photography-related issues',
        color: '#8B5CF6',
        icon: 'Camera',
        sort_order: 5,
        is_active: true,
        created_by: null
      },
      {
        name: 'Network',
        description: 'WiFi, cellular, and connectivity problems',
        color: '#06B6D4',
        icon: 'Wifi',
        sort_order: 6,
        is_active: true,
        created_by: null
      },
      {
        name: 'Hardware',
        description: 'Physical hardware and component issues',
        color: '#6B7280',
        icon: 'Cpu',
        sort_order: 7,
        is_active: true,
        created_by: null
      },
      {
        name: 'Software',
        description: 'Software, OS, and application-related problems',
        color: '#EC4899',
        icon: 'FileText',
        sort_order: 8,
        is_active: true,
        created_by: null
      }
    ];

    console.log('📋 Inserting default categories...');
    const { data, error } = await supabase
      .from('diagnostic_categories')
      .upsert(defaultCategories, { onConflict: 'name' });

    if (error) {
      console.error('❌ Error inserting categories:', error);
      
      // If table doesn't exist, let's try to create it first
      if (error.code === 'PGRST116') {
        console.log('📋 Table does not exist, creating it first...');
        console.log('⚠️  Please create the table manually using the SQL file, then run this script again.');
        console.log('📄 SQL file: create-diagnostic-categories-table.sql');
      }
    } else {
      console.log('✅ Categories created successfully!');
      console.log('📊 Created categories:');
      data?.forEach(category => {
        console.log(`   - ${category.name} (${category.color})`);
      });
    }
    
    // Verify the categories exist
    const { data: categories, error: selectError } = await supabase
      .from('diagnostic_categories')
      .select('id, name, color, icon, sort_order')
      .order('sort_order');
    
    if (selectError) {
      console.error('❌ Error verifying categories:', selectError);
    } else {
      console.log('✅ Verification successful!');
      console.log('📊 Available categories:');
      categories?.forEach(category => {
        console.log(`   - ${category.name} (${category.color}) - ${category.icon}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

createCategories();
