import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (optional)
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Supabase client with fallback configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔧 Using Supabase configuration:', {
  url: supabaseUrl,
  key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING'
});

const supabase = createClient(supabaseUrl, supabaseKey);

// Utility functions for data formatting (same as import script)
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with country code, keep it
  if (cleaned.startsWith('255') || cleaned.startsWith('+255')) {
    // Tanzania number
    if (cleaned.startsWith('255') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
  }
  
  // If it starts with 0, replace with +255
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+255${cleaned.substring(1)}`;
  }
  
  // If it's already formatted with +, keep it
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If it's 9 digits (Tanzania mobile without country code)
  if (cleaned.length === 9) {
    return `+255${cleaned}`;
  }
  
  // For international numbers, add + if missing
  if (cleaned.length > 10 && !phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return phone;
}

function formatCustomerName(name) {
  if (!name) return 'Unknown Customer';
  
  // Clean up the name
  let cleaned = name.trim();
  
  // Remove emojis and special characters but keep basic punctuation
  cleaned = cleaned.replace(/[^\w\s\-\.\']/g, '');
  
  // Capitalize first letter of each word
  cleaned = cleaned.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return cleaned || 'Unknown Customer';
}

function validateCustomerData(customer, rowNumber) {
  const errors = [];
  
  if (!customer.name || customer.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!customer.phone || customer.phone.trim() === '') {
    errors.push('Phone is required');
  }
  
  // Basic phone validation
  const phoneDigits = customer.phone.replace(/\D/g, '');
  if (phoneDigits.length < 9) {
    errors.push('Phone number too short');
  }
  
  return errors;
}

// Function to check if customer already exists (by phone number only)
async function customerExists(phone) {
  try {
    // Check by phone number only - names can be duplicate
    const { data: phoneMatch, error: phoneError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('phone', phone)
      .limit(1);
    
    if (phoneError) {
      throw new Error(`Database error: ${phoneError.message}`);
    }
    
    if (phoneMatch && phoneMatch.length > 0) {
      return phoneMatch[0];
    }
    
    return null;
  } catch (error) {
    throw new Error(`Error checking customer existence: ${error.message}`);
  }
}

// Function to add customer to database
async function addCustomerToDb(customerData) {
  try {
    const customer = {
      id: crypto.randomUUID(),
      name: customerData.name,
      email: null, // No email usage
      phone: customerData.phone,
      whatsapp: customerData.phone, // Use same phone for WhatsApp
      city: 'Dar es Salaam', // Default to Dar es Salaam as per user preference
      gender: null,
      birth_month: null,
      birth_day: null,
      notes: customerData.source ? `Imported from: ${customerData.source}` : null,
      is_active: true,
      loyalty_level: 'bronze',
      color_tag: 'new',
      total_spent: 0,
      points: 0,
      last_visit: new Date().toISOString(),
      referral_source: customerData.source || 'Contact Import',
      joined_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error adding customer to database:', error);
    throw error;
  }
}

// Main function to find and add 10 new contacts
async function add10NewContacts() {
  console.log('🚀 Starting process to find and add 10 new contacts...\n');
  
  const csvPath = '/Users/mtaasisi/Combined_Contacts_Merged_Names.csv';
  
  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found at:', csvPath);
    process.exit(1);
  }
  
  try {
    // Read and parse CSV file
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('📋 Headers found:', headers);
    
    const results = {
      total: 0,
      checked: 0,
      added: 0,
      skipped: 0,
      errors: 0
    };
    
    const newContacts = [];
    const errors = [];
    
    console.log('\n🔄 Checking contacts to find new ones...\n');
    
    // Process all contacts to find new ones
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      results.total++;
      
      try {
        // Parse CSV row
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const customerData = {};
        
        headers.forEach((header, index) => {
          customerData[header.toLowerCase()] = values[index] || '';
        });
        
        // Format customer data
        const formattedCustomer = {
          name: formatCustomerName(customerData.name),
          phone: formatPhoneNumber(customerData.phone),
          address: customerData.address || '',
          source: customerData.source || 'Contact Import'
        };
        
        // Validate customer data
        const validationErrors = validateCustomerData(formattedCustomer, i + 1);
        if (validationErrors.length > 0) {
          results.errors++;
          errors.push(`Row ${i + 1}: ${validationErrors.join(', ')}`);
          continue;
        }
        
        // Check if customer already exists (by phone number only)
        const existingCustomer = await customerExists(formattedCustomer.phone);
        if (existingCustomer) {
          results.skipped++;
          continue;
        }
        
        // This is a new contact - add to our list
        newContacts.push({
          ...formattedCustomer,
          rowNumber: i + 1
        });
        
        results.checked++;
        
        // Show progress every 1000 checks
        if (results.checked % 1000 === 0) {
          console.log(`🔍 Checked ${results.checked} contacts, found ${newContacts.length} new ones so far...`);
        }
        
        // Add small delay to avoid overwhelming the database
        if (i % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        results.errors++;
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Checking Summary:`);
    console.log('==================');
    console.log(`Total contacts in file: ${results.total}`);
    console.log(`Contacts checked: ${results.checked}`);
    console.log(`New contacts found: ${newContacts.length}`);
    console.log(`Already in system: ${results.skipped}`);
    console.log(`Errors: ${results.errors}`);
    
    if (newContacts.length === 0) {
      console.log('\n❌ No new contacts found! All contacts are already in the system.');
      return;
    }
    
    // Add exactly 10 new contacts (or all if less than 10)
    const contactsToAdd = newContacts.slice(0, 10);
    
    console.log(`\n🔄 Adding ${contactsToAdd.length} new contacts to database...\n`);
    
    for (const contact of contactsToAdd) {
      try {
        const newCustomer = await addCustomerToDb(contact);
        results.added++;
        
        console.log(`✅ Added: ${contact.name} (${contact.phone}) - Row ${contact.rowNumber}`);
        
        // Add small delay between additions
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`❌ Failed to add ${contact.name}: ${error.message}`);
        results.errors++;
      }
    }
    
    // Final summary
    console.log('\n📊 Final Summary:');
    console.log('==================');
    console.log(`✅ Successfully added: ${results.added}`);
    console.log(`⚠️  Already in system: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log(`📈 Total new contacts found: ${newContacts.length}`);
    
    if (results.added < 10 && newContacts.length > results.added) {
      console.log(`\n💡 Note: Found ${newContacts.length} new contacts but only added ${results.added} due to errors.`);
    }
    
    console.log('\n🎉 Process completed!');
    return results;
    
  } catch (error) {
    console.error('❌ Fatal error during process:', error);
    throw error;
  }
}

// Run the process
if (import.meta.url === `file://${process.argv[1]}`) {
  add10NewContacts().catch(console.error);
}

export { add10NewContacts };
