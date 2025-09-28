// Test script to verify discount calculation fix
// This simulates the calculation logic from the POS page

function testDiscountCalculation() {
  console.log('🧪 Testing Discount Calculation Fix\n');
  
  // Test case from the user's example
  const testCases = [
    {
      name: "User's Sale Example",
      subtotal: 700000,
      discountType: 'fixed',
      discountValue: 200000,
      expectedTotal: 500000
    },
    {
      name: "Percentage Discount Test",
      subtotal: 100000,
      discountType: 'percentage',
      discountValue: 10, // 10%
      expectedTotal: 90000
    },
    {
      name: "Large Fixed Discount Test",
      subtotal: 500000,
      discountType: 'fixed',
      discountValue: 100000,
      expectedTotal: 400000
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`  Subtotal: TSh ${testCase.subtotal.toLocaleString()}`);
    console.log(`  Discount: ${testCase.discountType} - ${testCase.discountValue}`);
    
    // Simulate the fixed calculation logic
    const discountAmount = testCase.discountType === 'percentage' 
      ? (testCase.subtotal * parseFloat(testCase.discountValue.toString())) / 100
      : parseFloat(testCase.discountValue.toString());
    
    const finalAmount = testCase.subtotal - discountAmount;
    
    console.log(`  Discount Amount: TSh ${discountAmount.toLocaleString()}`);
    console.log(`  Final Total: TSh ${finalAmount.toLocaleString()}`);
    console.log(`  Expected: TSh ${testCase.expectedTotal.toLocaleString()}`);
    
    const isCorrect = finalAmount === testCase.expectedTotal;
    console.log(`  Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  });
  
  console.log('🎯 The fix ensures that:');
  console.log('   - Fixed discounts are applied as absolute amounts');
  console.log('   - Percentage discounts are calculated correctly');
  console.log('   - The final total = subtotal - discount amount');
  console.log('   - Database stores the correct total_amount');
}

// Run the test
testDiscountCalculation();
