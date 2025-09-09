import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addBasicCategories() {
  console.log('📂 Adding basic categories to LATS database...\n');
  
  try {
    // Check if categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('lats_categories')
      .select('*');
    
    if (checkError) {
      console.error('❌ Error checking existing categories:', checkError);
      return;
    }
    
    if (existingCategories && existingCategories.length > 0) {
      console.log(`ℹ️  Found ${existingCategories.length} existing categories:`);
      existingCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.id})`);
      });
      return;
    }
    
    // Add basic categories
    console.log('📂 No categories found. Adding basic categories...');
    
    const basicCategories = [
      { 
        name: 'Smartphones', 
        description: 'Mobile phones and smartphones', 
        color: '#3B82F6',
        is_active: true,
        sort_order: 1
      },
      { 
        name: 'Laptops', 
        description: 'Portable computers and laptops', 
        color: '#10B981',
        is_active: true,
        sort_order: 2
      },
      { 
        name: 'Tablets', 
        description: 'Tablet computers and iPads', 
        color: '#EF4444',
        is_active: true,
        sort_order: 3
      },
      { 
        name: 'TVs & Audio', 
        description: 'Televisions, soundbars, and audio equipment', 
        color: '#8B5CF6',
        is_active: true,
        sort_order: 4
      },
      { 
        name: 'Accessories', 
        description: 'Device accessories and peripherals', 
        color: '#F59E0B',
        is_active: true,
        sort_order: 5
      },
      { 
        name: 'Wearables', 
        description: 'Smartwatches and fitness trackers', 
        color: '#EC4899',
        is_active: true,
        sort_order: 6
      },
      { 
        name: 'Parts & Components', 
        description: 'Replacement parts and components', 
        color: '#6B7280',
        is_active: true,
        sort_order: 7
      },
      { 
        name: 'Services', 
        description: 'Repair and maintenance services', 
        color: '#059669',
        is_active: true,
        sort_order: 8
      }
    ];
    
    const { data: newCategories, error: insertError } = await supabase
      .from('lats_categories')
      .insert(basicCategories)
      .select();
    
    if (insertError) {
      console.error('❌ Error adding categories:', insertError);
      return;
    }
    
    console.log(`✅ Successfully added ${newCategories.length} categories:`);
    newCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.id})`);
    });
    
    console.log('\n🎉 Basic categories setup complete!');
    console.log('📱 You can now assign these categories to your products.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
addBasicCategories()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
