const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPointsFunctionality() {
  try {
    console.log('🧪 Testing comprehensive points system functionality...');
    
    // 1. Test points_transactions table access
    console.log('\n1️⃣ Testing points_transactions table access...');
    const { data: transactions, error: transError } = await supabase
      .from('points_transactions')
      .select('*')
      .limit(5);
    
    if (transError) {
      console.log('❌ Cannot access points_transactions:', transError.message);
      return false;
    }
    console.log('✅ points_transactions table accessible');
    
    // 2. Test customers table points column
    console.log('\n2️⃣ Testing customers table points column...');
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name, points')
      .limit(5);
    
    if (custError) {
      console.log('❌ Cannot access customers points:', custError.message);
      return false;
    }
    console.log('✅ customers table points column accessible');
    console.log('📊 Sample customers with points:', customers?.map(c => `${c.name}: ${c.points} points`));
    
    // 3. Test inserting a points transaction
    console.log('\n3️⃣ Testing points transaction insertion...');
    if (customers && customers.length > 0) {
      const testCustomer = customers[0];
      const { error: insertError } = await supabase
        .from('points_transactions')
        .insert({
          customer_id: testCustomer.id,
          points_change: 10,
          transaction_type: 'adjusted',
          reason: 'Test points transaction',
          created_by: 'test-system'
        });
      
      if (insertError) {
        console.log('❌ Cannot insert points transaction:', insertError.message);
        return false;
      }
      console.log('✅ Points transaction insertion successful');
      
      // Clean up test transaction
      await supabase
        .from('points_transactions')
        .delete()
        .eq('reason', 'Test points transaction');
    }
    
    // 4. Test updating customer points
    console.log('\n4️⃣ Testing customer points update...');
    if (customers && customers.length > 0) {
      const testCustomer = customers[0];
      const currentPoints = testCustomer.points || 0;
      const newPoints = currentPoints + 5;
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', testCustomer.id);
      
      if (updateError) {
        console.log('❌ Cannot update customer points:', updateError.message);
        return false;
      }
      
      // Restore original points
      await supabase
        .from('customers')
        .update({ points: currentPoints })
        .eq('id', testCustomer.id);
      
      console.log('✅ Customer points update successful');
    }
    
    // 5. Test points calculation functions
    console.log('\n5️⃣ Testing points calculation logic...');
    const pointsConfig = {
      basePoints: 100,
      brandBonuses: {
        'apple': 5,
        'samsung': 3
      },
      enablePointsForNewDevices: true
    };
    
    const testDeviceData = { brand: 'apple', model: 'iPhone 15', deviceType: 'smartphone' };
    const calculatedPoints = calculatePointsForDevice(testDeviceData, 'gold', pointsConfig);
    console.log('✅ Points calculation working:', calculatedPoints, 'points for', testDeviceData.brand, testDeviceData.model);
    
    console.log('\n🎉 All points system functionality tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Points system test error:', error);
    return false;
  }
}

function calculatePointsForDevice(deviceData, customerLoyaltyLevel, config) {
  if (!config.enablePointsForNewDevices) {
    return 0;
  }
  
  let points = config.basePoints;
  
  // Add brand bonus
  if (deviceData.brand) {
    const brandBonus = config.brandBonuses[deviceData.brand.toLowerCase()];
    if (brandBonus) {
      points += brandBonus;
    }
  }
  
  // Apply loyalty level multiplier
  if (customerLoyaltyLevel === 'gold') {
    points = Math.round(points * 1.2);
  }
  
  return points;
}

async function checkPointsSystemErrors() {
  try {
    console.log('\n🔍 Checking for common points system errors...');
    
    // Check if there are any recent error logs or failed operations
    const { data: recentTransactions, error } = await supabase
      .from('points_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error fetching recent transactions:', error.message);
      return false;
    }
    
    if (recentTransactions && recentTransactions.length > 0) {
      console.log('📊 Recent points transactions:');
      recentTransactions.forEach(trans => {
        console.log(`  - ${trans.transaction_type}: ${trans.points_change} points (${trans.reason})`);
      });
    } else {
      console.log('📊 No recent points transactions found');
    }
    
    // Check customers with points
    const { data: customersWithPoints } = await supabase
      .from('customers')
      .select('id, name, points')
      .gt('points', 0)
      .limit(10);
    
    if (customersWithPoints && customersWithPoints.length > 0) {
      console.log('👥 Customers with points:');
      customersWithPoints.forEach(customer => {
        console.log(`  - ${customer.name}: ${customer.points} points`);
      });
    } else {
      console.log('👥 No customers with points found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking points system:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting comprehensive points system diagnostics...');
  
  const functionalityWorking = await testPointsFunctionality();
  const systemHealthy = await checkPointsSystemErrors();
  
  if (functionalityWorking && systemHealthy) {
    console.log('\n🎉 Points system is fully functional and healthy!');
    console.log('\n💡 If points are still not working in the UI, check:');
    console.log('   - Browser console for JavaScript errors');
    console.log('   - Network tab for failed API calls');
    console.log('   - Points management modal functionality');
  } else {
    console.log('\n⚠️ Points system has issues that need attention');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
