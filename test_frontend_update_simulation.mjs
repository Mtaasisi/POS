import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

// Simulate the normalizeColorTag function
function normalizeColorTag(colorTag) {
  if (!colorTag) return 'normal';
  
  const normalized = colorTag.trim().toLowerCase();
  
  const colorMap = {
    'normal': 'normal',
    'vip': 'vip',
    'complainer': 'complainer',
    'purchased': 'purchased',
    'not normal': 'normal',
    'new': 'normal',
    'regular': 'normal',
    'standard': 'normal',
    'basic': 'normal',
    'premium': 'vip',
    'important': 'vip',
    'priority': 'vip',
    'problem': 'complainer',
    'issue': 'complainer',
    'buyer': 'purchased',
    'customer': 'purchased',
    'buying': 'purchased'
  };
  
  return colorMap[normalized] || 'normal';
}

// Simulate the updateCustomerInDb function
async function updateCustomerInDb(customerId, updates) {
  const dbUpdates = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.joinedDate !== undefined) dbUpdates.joined_date = updates.joinedDate;
  if (updates.loyaltyLevel !== undefined) dbUpdates.loyalty_level = updates.loyaltyLevel;
  if (updates.colorTag !== undefined) dbUpdates.color_tag = normalizeColorTag(updates.colorTag);
  if (updates.referredBy !== undefined) dbUpdates.referred_by = updates.referredBy;
  if (updates.totalSpent !== undefined) dbUpdates.total_spent = updates.totalSpent;
  if (updates.points !== undefined) dbUpdates.points = updates.points;
  if (updates.lastVisit !== undefined) dbUpdates.last_visit = updates.lastVisit;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
  if (updates.referralSource !== undefined) dbUpdates.referral_source = updates.referralSource;
  if (updates.birthMonth !== undefined) dbUpdates.birth_month = updates.birthMonth;
  if (updates.birthDay !== undefined) dbUpdates.birth_day = updates.birthDay;
  if (updates.initialNotes !== undefined) dbUpdates.initial_notes = updates.initialNotes;
  
  dbUpdates.updated_at = new Date().toISOString();
  
  console.log('🔍 Simulating frontend update with data:', JSON.stringify(dbUpdates, null, 2));
  
  const { data, error } = await supabase
    .from('customers')
    .update(dbUpdates)
    .eq('id', customerId)
    .select();
    
  if (error) {
    console.error('❌ Update failed:', error);
    throw error;
  }
  
  return data && data[0] ? data[0] : null;
}

async function testFrontendUpdateSimulation() {
  try {
    const customerId = 'c4aa2553-c004-464e-8b14-dea85379a89d';
    console.log(`🔍 Testing frontend update simulation: ${customerId}`);
    
    // Get current customer data
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching customer:', fetchError);
      return;
    }
    
    console.log('📋 Current customer data:');
    console.log(JSON.stringify(customer, null, 2));
    
    // Test different update scenarios that might be happening in the frontend
    
    // Test 1: Simple name update
    console.log('\n🧪 Test 1: Simple name update');
    try {
      await updateCustomerInDb(customerId, { name: customer.name });
      console.log('✅ Test 1 successful');
    } catch (error) {
      console.error('❌ Test 1 failed:', error);
    }
    
    // Test 2: Update with colorTag normalization
    console.log('\n🧪 Test 2: Update with colorTag normalization');
    try {
      await updateCustomerInDb(customerId, { 
        colorTag: 'new',
        isActive: true 
      });
      console.log('✅ Test 2 successful');
    } catch (error) {
      console.error('❌ Test 2 failed:', error);
    }
    
    // Test 3: Update with multiple fields (like in CustomersContext)
    console.log('\n🧪 Test 3: Update with multiple fields');
    try {
      await updateCustomerInDb(customerId, { 
        name: customer.name,
        colorTag: 'normal',
        isActive: true,
        lastVisit: new Date().toISOString()
      });
      console.log('✅ Test 3 successful');
    } catch (error) {
      console.error('❌ Test 3 failed:', error);
    }
    
    // Test 4: Update with all possible fields
    console.log('\n🧪 Test 4: Update with all possible fields');
    try {
      await updateCustomerInDb(customerId, { 
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        gender: customer.gender,
        city: customer.city,
        joinedDate: customer.joined_date,
        loyaltyLevel: customer.loyalty_level,
        colorTag: customer.color_tag,
        referredBy: customer.referred_by,
        totalSpent: customer.total_spent,
        points: customer.points,
        lastVisit: customer.last_visit,
        isActive: customer.is_active,
        whatsapp: customer.whatsapp,
        referralSource: customer.referral_source,
        birthMonth: customer.birth_month,
        birthDay: customer.birth_day,
        initialNotes: customer.initial_notes
      });
      console.log('✅ Test 4 successful');
    } catch (error) {
      console.error('❌ Test 4 failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testFrontendUpdateSimulation(); 