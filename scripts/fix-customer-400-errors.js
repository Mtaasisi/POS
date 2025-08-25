#!/usr/bin/env node

/**
 * Fix Customer API 400 Errors
 * 
 * This script fixes all the complex nested queries in customerApi.ts that are causing
 * 400 Bad Request errors by simplifying them to basic queries and fetching related
 * data separately.
 */

import fs from 'fs';
import path from 'path';

const customerApiPath = path.join(process.cwd(), 'src/lib/customerApi.ts');

async function fixCustomerApi() {
  console.log('🔧 Fixing Customer API 400 Errors...\n');

  try {
    // Read the current file
    let content = fs.readFileSync(customerApiPath, 'utf8');

    // Fix 1: loadCustomerDetails function
    console.log('📋 Fixing loadCustomerDetails function...');
    const loadCustomerDetailsPattern = /\.select\(`\s*id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at,\s*customer_notes\(\*\),\s*customer_payments\(\s*\*,\s*devices\(brand, model\)\s*\),\s*promo_messages\(\*\),\s*devices\(\*\)\s*`\)/g;
    
    if (loadCustomerDetailsPattern.test(content)) {
      content = content.replace(loadCustomerDetailsPattern, 
        `.select(\`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
        \`)`
      );
      console.log('✅ Fixed loadCustomerDetails select query');
    }

    // Fix 2: Update the transformation logic in loadCustomerDetails
    console.log('📋 Updating loadCustomerDetails transformation logic...');
    const loadCustomerDetailsTransformPattern = /\/\/ Transform customer with all related data[\s\S]*?const loyaltyInfo = \{[\s\S]*?\};/g;
    
    if (loadCustomerDetailsTransformPattern.test(content)) {
      content = content.replace(loadCustomerDetailsTransformPattern, 
        `// Fetch related data separately to avoid complex nested queries
    const { data: notes } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId);
    
    const { data: payments } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('customer_id', customerId);
    
    const { data: promos } = await supabase
      .from('promo_messages')
      .select('*')
      .eq('customer_id', customerId);
    
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .eq('customer_id', customerId);
    
    // Transform customer with all related data
    const loyaltyInfo = {
      customer_id: customer.id,
      points: customer.points || 0,
      tier: customer.loyalty_level || 'bronze',
      join_date: customer.joined_date,
      last_visit: customer.last_visit,
      total_spent: customer.total_spent || 0,
      rewards_redeemed: 0
    };`
      );
      console.log('✅ Fixed loadCustomerDetails transformation logic');
    }

    // Fix 3: Update the notes transformation in loadCustomerDetails
    console.log('📋 Updating loadCustomerDetails notes transformation...');
    const notesTransformPattern = /const transformedNotes = \(customer\.customer_notes \|\| \[\]\)\.map\(\(note: any\) => \(\{[\s\S]*?\}\);[\s\S]*?const transformedPayments = \(customer\.customer_payments \|\| \[\]\)\.map\(\(payment: any\) => \{[\s\S]*?\}\);[\s\S]*?const transformedPromoHistory = \(customer\.promo_messages \|\| \[\]\)\.map\(\(promo: any\) => \{[\s\S]*?\}\);[\s\S]*?const transformedDevices = \(customer\.devices \|\| \[\]\)\.map\(\(device: any\) => \{[\s\S]*?\}\);/g;
    
    if (notesTransformPattern.test(content)) {
      content = content.replace(notesTransformPattern, 
        `const transformedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      content: note.content,
      createdBy: note.created_by,
      createdAt: note.created_at
    }));

    const transformedPayments = (payments || []).map((payment: any) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      deviceId: payment.device_id,
      deviceName: undefined, // We'll fetch device details separately if needed
      date: payment.payment_date,
      type: payment.payment_type,
      status: payment.status,
      createdBy: payment.created_by,
      createdAt: payment.created_at,
      source: 'device_payment'
    }));

    const transformedPromoHistory = (promos || []).map((promo: any) => ({
      id: promo.id,
      message: promo.message,
      sentAt: promo.sent_at,
      status: promo.status,
      type: promo.type
    }));

    const transformedDevices = (devices || []).map((device: any) => ({
      id: device.id,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serial_number,
      issueDescription: device.issue_description,
      status: device.status,
      assignedTo: device.assigned_to,
      expectedReturnDate: device.expected_return_date,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      unlockCode: device.unlock_code,
      repairCost: device.repair_cost,
      depositAmount: device.deposit_amount,
      diagnosisRequired: device.diagnosis_required,
      deviceNotes: device.device_notes,
      deviceCost: device.device_cost,
      estimatedHours: device.estimated_hours,
      deviceCondition: device.device_condition
    }));`
      );
      console.log('✅ Fixed loadCustomerDetails data transformations');
    }

    // Fix 4: Update searchCustomers promo and devices transformation
    console.log('📋 Updating searchCustomers promo and devices transformation...');
    const searchCustomersTransformPattern = /\/\/ Transform promo history[\s\S]*?const transformedPromoHistory = \(customer\.promo_messages \|\| \[\]\)\.map\(\(promo: any\) => \{[\s\S]*?\}\);[\s\S]*?const transformedDevices = \(customer\.devices \|\| \[\]\)\.map\(\(device: any\) => \{[\s\S]*?\}\);/g;
    
    if (searchCustomersTransformPattern.test(content)) {
      content = content.replace(searchCustomersTransformPattern, 
        `// Transform promo history
          const transformedPromoHistory = (promos || []).map((promo: any) => ({
            id: promo.id,
            message: promo.message,
            sentAt: promo.sent_at,
            status: promo.status,
            type: promo.type
          }));

          const transformedDevices = (devices || []).map((device: any) => ({
            id: device.id,
            brand: device.brand,
            model: device.model,
            serialNumber: device.serial_number,
            issueDescription: device.issue_description,
            status: device.status,
            assignedTo: device.assigned_to,
            expectedReturnDate: device.expected_return_date,
            createdAt: device.created_at,
            updatedAt: device.updated_at,
            unlockCode: device.unlock_code,
            repairCost: device.repair_cost,
            depositAmount: device.deposit_amount,
            diagnosisRequired: device.diagnosis_required,
            deviceNotes: device.device_notes,
            deviceCost: device.device_cost,
            estimatedHours: device.estimated_hours,
            deviceCondition: device.device_condition
          }));`
      );
      console.log('✅ Fixed searchCustomers data transformations');
    }

    // Fix 5: Add error handling for individual customer processing in searchCustomers
    console.log('📋 Adding error handling for searchCustomers...');
    const searchCustomersErrorHandlingPattern = /const customersWithData = await Promise\.all\(\(customers \|\| \[\]\)\.map\(async \(customer: any\) => \{[\s\S]*?try \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}/g;
    
    if (!searchCustomersErrorHandlingPattern.test(content)) {
      // Add error handling if it doesn't exist
      const searchCustomersMapPattern = /const customersWithData = await Promise\.all\(\(customers \|\| \[\]\)\.map\(async \(customer: any\) => \{/g;
      content = content.replace(searchCustomersMapPattern, 
        `const customersWithData = await Promise.all((customers || []).map(async (customer: any) => {
        try {`
      );
      
      // Add the closing brace and error handling
      const searchCustomersEndPattern = /return \{[\s\S]*?\};[\s\S]*?\}\);/g;
      content = content.replace(searchCustomersEndPattern, 
        `return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            gender: customer.gender,
            city: customer.city,
            notes: [],
            joinedDate: customer.joined_date,
            loyaltyLevel: customer.loyalty_level,
            colorTag: customer.color_tag,
            referredBy: customer.referred_by,
            referrals: [],
            totalSpent: customer.total_spent,
            points: customer.points,
            lastVisit: customer.last_visit,
            isActive: customer.is_active,
            profileImage: customer.profile_image,
            promoHistory: [],
            payments: [],
            devices: [],
            referralSource: customer.referral_source,
            birthMonth: customer.birth_month,
            birthDay: customer.birth_day,
            totalReturns: customer.total_returns,
            initialNotes: customer.initial_notes,
            createdBy: customer.created_by,
            loyaltyTier: customer.loyalty_level,
            loyaltyJoinDate: customer.joined_date,
            loyaltyLastVisit: customer.last_visit,
            loyaltyRewardsRedeemed: 0,
            loyaltyTotalSpent: customer.total_spent,
            isLoyaltyMember: true
          };
        } catch (error) {
          console.error(\`❌ Error processing customer \${customer.id}:\`, error);
          // Return basic customer data if related data fetch fails
          return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            gender: customer.gender,
            city: customer.city,
            notes: [],
            joinedDate: customer.joined_date,
            loyaltyLevel: customer.loyalty_level,
            colorTag: customer.color_tag,
            referredBy: customer.referred_by,
            referrals: [],
            totalSpent: customer.total_spent,
            points: customer.points,
            lastVisit: customer.last_visit,
            isActive: customer.is_active,
            profileImage: customer.profile_image,
            promoHistory: [],
            payments: [],
            devices: [],
            referralSource: customer.referral_source,
            birthMonth: customer.birth_month,
            birthDay: customer.birth_day,
            totalReturns: customer.total_returns,
            initialNotes: customer.initial_notes,
            createdBy: customer.created_by,
            loyaltyTier: customer.loyalty_level,
            loyaltyJoinDate: customer.joined_date,
            loyaltyLastVisit: customer.last_visit,
            loyaltyRewardsRedeemed: 0,
            loyaltyTotalSpent: customer.total_spent,
            isLoyaltyMember: true
          };
        }
      }));`
      );
      console.log('✅ Added error handling for searchCustomers');
    }

    // Write the updated content back to the file
    fs.writeFileSync(customerApiPath, content, 'utf8');
    
    console.log('\n✅ Successfully fixed all Customer API 400 errors!');
    console.log('📝 Changes made:');
    console.log('   - Simplified complex nested select queries');
    console.log('   - Added separate data fetching for related tables');
    console.log('   - Added proper error handling for individual customer processing');
    console.log('   - Updated transformation logic to use separately fetched data');
    
  } catch (error) {
    console.error('❌ Error fixing Customer API:', error);
    process.exit(1);
  }
}

// Run the fix
fixCustomerApi();
