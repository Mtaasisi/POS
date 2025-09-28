// Test customer visibility in the POS system
const { fetchAllCustomersSimple, searchCustomersFast } = require('./src/lib/customerApi/core.ts');

async function testCustomerVisibility() {
  console.log('🔍 Testing Customer Visibility in POS System...\n');

  try {
    // Test 1: Fetch all customers using the app's function
    console.log('📋 Test 1: Fetching all customers using fetchAllCustomersSimple...');
    const allCustomers = await fetchAllCustomersSimple();
    
    if (Array.isArray(allCustomers)) {
      console.log(`✅ fetchAllCustomersSimple returned array: ${allCustomers.length} customers`);
      
      if (allCustomers.length > 0) {
        console.log('Sample customers:');
        allCustomers.slice(0, 5).forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name} - ${customer.phone || 'No phone'} - ${customer.email || 'No email'}`);
        });
      } else {
        console.log('⚠️ No customers returned from fetchAllCustomersSimple');
      }
    } else if (allCustomers && allCustomers.customers) {
      console.log(`✅ fetchAllCustomersSimple returned object: ${allCustomers.customers.length} customers`);
      
      if (allCustomers.customers.length > 0) {
        console.log('Sample customers:');
        allCustomers.customers.slice(0, 5).forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name} - ${customer.phone || 'No phone'} - ${customer.email || 'No email'}`);
        });
      }
    } else {
      console.log('❌ fetchAllCustomersSimple returned unexpected format:', typeof allCustomers);
    }

    console.log('\n');

    // Test 2: Test search functionality
    console.log('🔍 Test 2: Testing search functionality...');
    
    // Test empty search
    const emptySearch = await searchCustomersFast('', 1, 50);
    console.log(`Empty search results: ${emptySearch?.customers?.length || 0} customers`);
    
    // Test name search
    const nameSearch = await searchCustomersFast('a', 1, 10);
    console.log(`Name search (letter 'a'): ${nameSearch?.customers?.length || 0} customers`);
    
    // Test phone search
    const phoneSearch = await searchCustomersFast('07', 1, 10);
    console.log(`Phone search ('07'): ${phoneSearch?.customers?.length || 0} customers`);

    console.log('\n');

    // Test 3: Check for specific issues
    console.log('🔍 Test 3: Checking for specific issues...');
    
    if (Array.isArray(allCustomers)) {
      const customersWithNames = allCustomers.filter(c => c.name && c.name.trim());
      const customersWithPhones = allCustomers.filter(c => c.phone && c.phone.trim());
      const customersWithEmails = allCustomers.filter(c => c.email && c.email.trim());
      
      console.log(`Customers with names: ${customersWithNames.length}/${allCustomers.length}`);
      console.log(`Customers with phones: ${customersWithPhones.length}/${allCustomers.length}`);
      console.log(`Customers with emails: ${customersWithEmails.length}/${allCustomers.length}`);
      
      // Check for customers with missing critical data
      const incompleteCustomers = allCustomers.filter(c => !c.name || !c.name.trim());
      if (incompleteCustomers.length > 0) {
        console.log(`⚠️ Found ${incompleteCustomers.length} customers with missing names:`);
        incompleteCustomers.slice(0, 3).forEach(c => {
          console.log(`  - ID: ${c.id}, Name: "${c.name}", Phone: ${c.phone || 'None'}`);
        });
      }
    }

    console.log('\n🎯 Customer Visibility Summary:');
    console.log(`- Total customers accessible: ${Array.isArray(allCustomers) ? allCustomers.length : (allCustomers?.customers?.length || 0)}`);
    console.log(`- Search functionality: ${emptySearch?.customers ? 'Working' : 'Issues detected'}`);
    console.log(`- Data completeness: Checked for missing names, phones, emails`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCustomerVisibility();
