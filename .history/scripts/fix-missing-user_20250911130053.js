import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixMissingUser() {
  console.log('🔧 Fixing missing user ID: a15a9139-3be9-4028-b944-240caae9eeb2');
  
  try {
    // Insert the missing user
    const { data: userData, error: userError } = await supabase
      .from('auth_users')
      .upsert({
        id: 'a15a9139-3be9-4028-b944-240caae9eeb2',
        email: 'user@latschance.com',
        username: 'main_user',
        name: 'Main User',
        role: 'technician',
        is_active: true,
        points: 0
      }, {
        onConflict: 'id'
      });

    if (userError) {
      console.error('❌ Error inserting user:', userError);
      return;
    }
    console.log('✅ User inserted successfully');

    // Insert default goals
    const goals = [
      { goal_type: 'new_customers', goal_value: 5 },
      { goal_type: 'devices_processed', goal_value: 8 },
      { goal_type: 'checkins', goal_value: 10 },
      { goal_type: 'repairs_completed', goal_value: 3 }
    ];

    for (const goal of goals) {
      // First check if the goal already exists
      const { data: existingGoal } = await supabase
        .from('user_daily_goals')
        .select('id')
        .eq('user_id', 'a15a9139-3be9-4028-b944-240caae9eeb2')
        .eq('goal_type', goal.goal_type)
        .single();

      if (!existingGoal) {
        const { error: goalError } = await supabase
          .from('user_daily_goals')
          .insert({
            user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2',
            goal_type: goal.goal_type,
            goal_value: goal.goal_value,
            is_active: true
          });

        if (goalError) {
          console.error(`❌ Error inserting goal ${goal.goal_type}:`, goalError);
        } else {
          console.log(`✅ Goal ${goal.goal_type} inserted successfully`);
        }
      } else {
        console.log(`✅ Goal ${goal.goal_type} already exists`);
      }
    }

    // Insert POS general settings
    const { error: generalError } = await supabase
      .from('lats_pos_general_settings')
      .upsert({
        user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2',
        business_id: null,
        theme: 'light',
        language: 'en',
        currency: 'TZS',
        timezone: 'Africa/Dar_es_Salaam',
        date_format: 'DD/MM/YYYY',
        time_format: '24',
        show_product_images: true,
        show_stock_levels: true,
        show_prices: true,
        show_barcodes: true,
        products_per_page: 20,
        auto_complete_search: true,
        confirm_delete: true,
        show_confirmations: true,
        enable_sound_effects: true,
        enable_animations: true,
        enable_caching: true,
        cache_duration: 300,
        enable_lazy_loading: true,
        max_search_results: 50
      }, {
        onConflict: 'user_id,business_id'
      });

    if (generalError) {
      console.error('❌ Error inserting POS general settings:', generalError);
    } else {
      console.log('✅ POS general settings inserted successfully');
    }

    // Insert POS receipt settings (using the correct schema)
    const { error: receiptError } = await supabase
      .from('lats_pos_receipt_settings')
      .upsert({
        user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2',
        business_id: null,
        receipt_template: 'standard',
        receipt_width: 80,
        receipt_font_size: 12,
        show_business_logo: true,
        show_business_name: true,
        show_business_address: true,
        show_business_phone: true,
        show_business_email: false,
        show_business_website: false,
        show_transaction_id: true,
        show_date_time: true,
        show_cashier_name: true,
        show_receipt_number: true,
        show_payment_method: true,
        show_change_amount: true,
        show_tax_breakdown: true,
        show_item_details: true,
        show_customer_info: true,
        footer_message: 'Thank you for your business!'
      }, {
        onConflict: 'user_id,business_id'
      });

    if (receiptError) {
      console.error('❌ Error inserting POS receipt settings:', receiptError);
    } else {
      console.log('✅ POS receipt settings inserted successfully');
    }

    console.log('🎉 All fixes completed successfully!');

  } catch (error) {
    console.error('💥 Error fixing missing user:', error);
  }
}

// Run the fix
fixMissingUser();
