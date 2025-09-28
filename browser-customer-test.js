// Browser-based test for customer loading issues
// Run this in your browser console while on the POS page

async function testCustomerLoadingInBrowser() {
  console.log('🔍 Browser Customer Loading Test...\n');

  try {
    // Test 1: Check if Supabase client is available
    console.log('📊 Test 1: Checking Supabase client...');
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Supabase client found in window');
      const supabase = window.supabase;
      
      // Test 2: Direct customer query
      console.log('\n📊 Test 2: Direct customer query...');
      const { data: customers, error, count } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          email,
          gender,
          city,
          color_tag,
          loyalty_level,
          points,
          total_spent,
          last_visit,
          is_active,
          referral_source,
          birth_month,
          birth_day,
          total_returns,
          profile_image,
          whatsapp,
          whatsapp_opt_out,
          initial_notes,
          notes,
          referrals,
          customer_tag,
          created_at,
          updated_at,
          created_by,
          last_purchase_date,
          total_purchases,
          birthday,
          referred_by
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Customer query error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log(`✅ Customer query successful: ${customers?.length || 0} customers (total: ${count})`);
        
        if (customers && customers.length > 0) {
          console.log('Sample customers:');
          customers.slice(0, 5).forEach((customer, index) => {
            console.log(`  ${index + 1}. ${customer.name} - ${customer.phone || 'No phone'} - ${customer.email || 'No email'}`);
          });
          
          // Check data quality
          const customersWithNames = customers.filter(c => c.name && c.name.trim());
          const customersWithPhones = customers.filter(c => c.phone && c.phone.trim());
          const customersWithEmails = customers.filter(c => c.email && c.email.trim());
          
          console.log(`\n📊 Data Quality:`);
          console.log(`- Customers with names: ${customersWithNames.length}/${customers.length}`);
          console.log(`- Customers with phones: ${customersWithPhones.length}/${customers.length}`);
          console.log(`- Customers with emails: ${customersWithEmails.length}/${customers.length}`);
        }
      }

      // Test 3: Test the app's fetchAllCustomersSimple function
      console.log('\n📊 Test 3: Testing app\'s fetchAllCustomersSimple function...');
      try {
        // Try to access the function from the global scope or import it
        if (typeof window.fetchAllCustomersSimple === 'function') {
          const appResult = await window.fetchAllCustomersSimple();
          console.log('✅ App function result:', appResult);
        } else {
          console.log('⚠️ App function not found in global scope');
        }
      } catch (appError) {
        console.error('❌ App function error:', appError);
      }

      // Test 4: Test search functionality
      console.log('\n📊 Test 4: Testing search functionality...');
      const { data: searchResults, error: searchError } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .or('name.ilike.%a%,phone.ilike.%a%,email.ilike.%a%')
        .limit(10);

      if (searchError) {
        console.error('❌ Search error:', searchError);
      } else {
        console.log(`✅ Search results: ${searchResults?.length || 0} customers`);
      }

      // Test 5: Check for customers with different is_active values
      console.log('\n📊 Test 5: Checking is_active values...');
      const { data: activeData, error: activeError } = await supabase
        .from('customers')
        .select('id, name, is_active')
        .limit(100);

      if (activeData) {
        const activeCount = activeData.filter(c => c.is_active === true).length;
        const inactiveCount = activeData.filter(c => c.is_active === false).length;
        const nullCount = activeData.filter(c => c.is_active === null).length;
        
        console.log(`✅ Active customers: ${activeCount}`);
        console.log(`✅ Inactive customers: ${inactiveCount}`);
        console.log(`✅ Null is_active: ${nullCount}`);
      }

    } else {
      console.log('❌ Supabase client not found in window object');
      console.log('Available window objects:', Object.keys(window).filter(key => key.includes('supabase') || key.includes('Supabase')));
    }

    // Test 6: Check if there are any console errors
    console.log('\n📊 Test 6: Checking for console errors...');
    const originalError = console.error;
    const errors = [];
    console.error = function(...args) {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Restore original console.error
    setTimeout(() => {
      console.error = originalError;
      if (errors.length > 0) {
        console.log(`⚠️ Found ${errors.length} console errors:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      } else {
        console.log('✅ No console errors detected');
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Browser test failed:', error);
  }
}

// Run the test
testCustomerLoadingInBrowser();

// Also provide a simple function to test customer loading
window.testCustomerLoading = testCustomerLoadingInBrowser;
console.log('✅ Test function available as window.testCustomerLoading()');

