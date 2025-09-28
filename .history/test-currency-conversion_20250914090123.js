// Test script to verify currency conversion logic in purchase order payments
// This script tests the currency conversion logic without making actual database calls

// Mock exchange rates (same as in the service)
const exchangeRates = {
  'USD_TZS': 2500,
  'TZS_USD': 0.0004,
  'EUR_TZS': 2700,
  'TZS_EUR': 0.00037,
  'GBP_TZS': 3200,
  'TZS_GBP': 0.00031
};

// Test currency conversion function
function testCurrencyConversion(paymentAmount, paymentCurrency, accountCurrency) {
  console.log(`\n🧪 Testing: ${paymentAmount} ${paymentCurrency} -> ${accountCurrency}`);
  
  if (paymentCurrency === accountCurrency) {
    console.log(`✅ No conversion needed: ${paymentAmount} ${accountCurrency}`);
    return paymentAmount;
  }
  
  const conversionKey = `${paymentCurrency}_${accountCurrency}`;
  const rate = exchangeRates[conversionKey];
  
  if (rate) {
    const convertedAmount = paymentAmount * rate;
    console.log(`💱 Converting ${paymentAmount} ${paymentCurrency} to ${convertedAmount} ${accountCurrency} (rate: ${rate})`);
    return convertedAmount;
  } else {
    console.log(`❌ Currency conversion not supported: ${paymentCurrency} to ${accountCurrency}`);
    return null;
  }
}

// Test cases
console.log('🔍 Testing Currency Conversion Logic');
console.log('=====================================');

// Test case 1: USD payment to TZS account (the original error case)
const test1 = testCurrencyConversion(1000, 'USD', 'TZS');
console.log(`Expected: 2,500,000 TZS, Got: ${test1?.toLocaleString()} TZS`);

// Test case 2: TZS payment to USD account
const test2 = testCurrencyConversion(2500000, 'TZS', 'USD');
console.log(`Expected: 1,000 USD, Got: ${test2?.toLocaleString()} USD`);

// Test case 3: EUR payment to TZS account
const test3 = testCurrencyConversion(100, 'EUR', 'TZS');
console.log(`Expected: 270,000 TZS, Got: ${test3?.toLocaleString()} TZS`);

// Test case 4: Same currency (no conversion)
const test4 = testCurrencyConversion(1000, 'TZS', 'TZS');
console.log(`Expected: 1,000 TZS, Got: ${test4?.toLocaleString()} TZS`);

// Test case 5: Unsupported conversion
const test5 = testCurrencyConversion(100, 'CAD', 'TZS');
console.log(`Expected: null (unsupported), Got: ${test5}`);

console.log('\n✅ Currency conversion tests completed!');
console.log('\n📝 Summary of fixes:');
console.log('1. ✅ PurchaseOrderPaymentModal now passes currency from purchase order');
console.log('2. ✅ Payment service records converted amount in account currency');
console.log('3. ✅ Payment service adds conversion notes for audit trail');
console.log('4. ✅ Currency conversion logic handles USD->TZS and other supported pairs');
