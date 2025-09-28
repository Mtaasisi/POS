import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function analyzeMissingFields() {
  console.log('🔍 Analyzing missing customer fields in UI vs Database...\n');

  try {
    // Get the actual database schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'customers')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (schemaError) {
      console.error('❌ Error fetching schema:', schemaError.message);
      return;
    }

    console.log('📊 Database Schema - All Available Columns:');
    schemaData.forEach(col => {
      console.log(`  ✅ ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'Nullable' : 'Required'}`);
    });

    console.log('\n📱 Currently Displayed in UI:');
    const displayedFields = [
      'name', 'phone', 'email', 'whatsapp', 'city', 'country', 'address',
      'birthMonth', 'birthDay', 'gender', 'notes', 'initialNotes',
      'isActive', 'createdAt', 'joinedDate', 'lastVisit', 'updatedAt',
      'loyaltyLevel', 'colorTag', 'customerTag', 'referralSource', 'referredBy',
      'totalSpent', 'points', 'totalPurchases', 'lastPurchaseDate', 'whatsappOptOut'
    ];
    
    displayedFields.forEach(field => {
      console.log(`  ✅ ${field}`);
    });

    console.log('\n❌ Missing from UI (Available in Database):');
    const missingFields = [];
    
    schemaData.forEach(col => {
      const fieldName = col.column_name;
      const camelCaseField = fieldName.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      
      // Check if field is displayed in UI
      const isDisplayed = displayedFields.includes(fieldName) || 
                         displayedFields.includes(camelCaseField) ||
                         fieldName === 'id' || // ID is not typically displayed
                         fieldName === 'created_at' || // Handled as createdAt
                         fieldName === 'updated_at' || // Handled as updatedAt
                         fieldName === 'birth_month' || // Handled as birthMonth
                         fieldName === 'birth_day' || // Handled as birthDay
                         fieldName === 'is_active' || // Handled as isActive
                         fieldName === 'loyalty_level' || // Handled as loyaltyLevel
                         fieldName === 'color_tag' || // Handled as colorTag
                         fieldName === 'referral_source' || // Handled as referralSource
                         fieldName === 'referred_by' || // Handled as referredBy
                         fieldName === 'total_spent' || // Handled as totalSpent
                         fieldName === 'last_visit' || // Handled as lastVisit
                         fieldName === 'created_by' || // Handled as createdBy
                         fieldName === 'initial_notes' || // Handled as initialNotes
                         fieldName === 'customer_tag' || // Handled as customerTag
                         fieldName === 'joined_date' || // Handled as joinedDate
                         fieldName === 'last_purchase_date' || // Handled as lastPurchaseDate
                         fieldName === 'total_purchases' || // Handled as totalPurchases
                         fieldName === 'whatsapp_opt_out'; // Handled as whatsappOptOut
      
      if (!isDisplayed) {
        missingFields.push(fieldName);
        console.log(`  ❌ ${fieldName} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'Nullable' : 'Required'}`);
      }
    });

    console.log('\n🎯 Summary:');
    console.log(`- Total database columns: ${schemaData.length}`);
    console.log(`- Currently displayed in UI: ${displayedFields.length}`);
    console.log(`- Missing from UI: ${missingFields.length}`);
    
    if (missingFields.length > 0) {
      console.log('\n💡 Recommendations:');
      missingFields.forEach(field => {
        console.log(`- Add ${field} to customer details display`);
      });
    } else {
      console.log('\n✅ All database fields are displayed in the UI!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeMissingFields();
