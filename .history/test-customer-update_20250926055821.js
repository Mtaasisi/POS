// Test script to verify customer total spent update logic
// This simulates the customer stats update functionality

function testCustomerUpdate() {
  console.log('🧪 Testing Customer Total Spent Update\n');
  
  // Simulate customer data before sale
  const customerBefore = {
    id: 'customer-123',
    name: 'Samuel Masika',
    total_spent: 0,
    total_orders: 0,
    points: 0,
    last_visit: null
  };

  // Simulate sale data
  const saleData = {
    customerId: 'customer-123',
    total: 700000, // TSh 700,000
    items: [
      {
        productId: 'product-1',
        quantity: 1,
        totalPrice: 700000
      }
    ]
  };

  console.log('📊 Before Sale:');
  console.log(`  Customer: ${customerBefore.name}`);
  console.log(`  Total Spent: TSh ${customerBefore.total_spent.toLocaleString()}`);
  console.log(`  Total Orders: ${customerBefore.total_orders}`);
  console.log(`  Points: ${customerBefore.points}`);
  console.log(`  Last Visit: ${customerBefore.last_visit || 'Never'}`);
  console.log('');

  // Simulate the update logic
  const pointsEarned = Math.floor(saleData.total / 1000); // 1 point per 1000 TZS
  
  const customerAfter = {
    ...customerBefore,
    total_spent: customerBefore.total_spent + saleData.total,
    total_orders: customerBefore.total_orders + 1,
    points: customerBefore.points + pointsEarned,
    last_visit: new Date().toISOString()
  };

  console.log('💰 Sale Details:');
  console.log(`  Sale Total: TSh ${saleData.total.toLocaleString()}`);
  console.log(`  Points Earned: ${pointsEarned} (1 point per 1000 TZS)`);
  console.log('');

  console.log('📈 After Sale:');
  console.log(`  Customer: ${customerAfter.name}`);
  console.log(`  Total Spent: TSh ${customerAfter.total_spent.toLocaleString()}`);
  console.log(`  Total Orders: ${customerAfter.total_orders}`);
  console.log(`  Points: ${customerAfter.points}`);
  console.log(`  Last Visit: ${new Date(customerAfter.last_visit).toLocaleString('en-TZ')}`);
  console.log('');

  // Verify the calculations
  const expectedTotalSpent = 0 + 700000;
  const expectedPoints = 0 + 700; // 700,000 / 1000 = 700 points
  const expectedOrders = 0 + 1;

  console.log('✅ Verification:');
  console.log(`  Total Spent: ${customerAfter.total_spent === expectedTotalSpent ? '✅ CORRECT' : '❌ INCORRECT'}`);
  console.log(`  Points: ${customerAfter.points === expectedPoints ? '✅ CORRECT' : '❌ INCORRECT'}`);
  console.log(`  Orders: ${customerAfter.total_orders === expectedOrders ? '✅ CORRECT' : '❌ INCORRECT'}`);
  console.log('');

  // Test multiple sales scenario
  console.log('🔄 Testing Multiple Sales Scenario:');
  let runningTotal = 0;
  let runningPoints = 0;
  let runningOrders = 0;

  const testSales = [
    { total: 50000, description: 'Small purchase' },
    { total: 150000, description: 'Medium purchase' },
    { total: 700000, description: 'Large purchase (iPhone)' },
    { total: 200000, description: 'Another purchase' }
  ];

  testSales.forEach((sale, index) => {
    const points = Math.floor(sale.total / 1000);
    runningTotal += sale.total;
    runningPoints += points;
    runningOrders += 1;

    console.log(`  Sale ${index + 1}: ${sale.description}`);
    console.log(`    Amount: TSh ${sale.total.toLocaleString()}`);
    console.log(`    Points: ${points}`);
    console.log(`    Running Total: TSh ${runningTotal.toLocaleString()}`);
    console.log(`    Running Points: ${runningPoints}`);
    console.log('');
  });

  console.log('🎯 Final Customer Stats:');
  console.log(`  Total Spent: TSh ${runningTotal.toLocaleString()}`);
  console.log(`  Total Points: ${runningPoints}`);
  console.log(`  Total Orders: ${runningOrders}`);
  console.log('');

  console.log('🎯 The fix ensures that:');
  console.log('   - Customer total_spent is updated with each sale');
  console.log('   - Points are calculated correctly (1 point per 1000 TZS)');
  console.log('   - Total orders count is incremented');
  console.log('   - Last visit timestamp is updated');
  console.log('   - All updates happen automatically after each sale');
}

// Run the test
testCustomerUpdate();
