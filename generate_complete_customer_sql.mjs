import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Generating SQL for all customers...');
console.log(`📈 Total customers: ${backupData.data.customers.length}`);

// Function to escape SQL strings
function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Function to convert customer data to SQL VALUES
function customerToSqlValues(customer) {
  return `(
    ${escapeSqlString(customer.id)},
    ${escapeSqlString(customer.name)},
    ${escapeSqlString(customer.email)},
    ${escapeSqlString(customer.phone)},
    ${escapeSqlString(customer.gender)},
    ${escapeSqlString(customer.city)},
    ${escapeSqlString(customer.joined_date)},
    ${escapeSqlString(customer.loyalty_level)},
    ${escapeSqlString(customer.color_tag)},
    ${customer.referred_by ? `'${customer.referred_by}'` : 'NULL'},
    ${customer.total_spent || 0},
    ${customer.points || 10},
    ${escapeSqlString(customer.last_visit)},
    ${customer.is_active !== undefined ? customer.is_active : true},
    ${escapeSqlString(customer.whatsapp)},
    ${escapeSqlString(customer.referral_source)},
    ${escapeSqlString(customer.birth_month)},
    ${escapeSqlString(customer.birth_day)},
    ${escapeSqlString(customer.customer_tag)},
    ${escapeSqlString(customer.notes)},
    ${customer.total_returns || 0},
    ${escapeSqlString(customer.profile_image)},
    ${escapeSqlString(customer.initial_notes)},
    ${escapeSqlString(customer.location_description)},
    ${escapeSqlString(customer.national_id)},
    ${escapeSqlString(customer.created_at)},
    ${escapeSqlString(customer.updated_at)}
  )`;
}

// Generate the complete SQL script
let sqlScript = `-- Complete Customer Data Update Script
-- Generated from backup file: database-backup-2025-07-30T12-11-11-519Z.json
-- Total customers: ${backupData.data.customers.length}

-- Create temporary table
CREATE TEMP TABLE temp_customers_backup (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    gender TEXT,
    city TEXT,
    joined_date TIMESTAMP WITH TIME ZONE,
    loyalty_level TEXT,
    color_tag TEXT,
    referred_by UUID,
    total_spent DECIMAL(10,2),
    points INTEGER,
    last_visit TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    whatsapp TEXT,
    referral_source TEXT,
    birth_month TEXT,
    birth_day TEXT,
    customer_tag TEXT,
    notes TEXT,
    total_returns INTEGER,
    profile_image TEXT,
    initial_notes TEXT,
    location_description TEXT,
    national_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Insert all customer data
INSERT INTO temp_customers_backup VALUES
`;

// Add all customers to the SQL
const customerValues = backupData.data.customers.map(customerToSqlValues);
sqlScript += customerValues.join(',\n') + ';\n\n';

// Add the update and insert logic
sqlScript += `-- Update existing customers with comprehensive data
UPDATE customers 
SET 
    name = temp.name,
    email = temp.email,
    phone = temp.phone,
    gender = temp.gender,
    city = temp.city,
    joined_date = temp.joined_date,
    loyalty_level = temp.loyalty_level,
    color_tag = temp.color_tag,
    referred_by = temp.referred_by,
    total_spent = temp.total_spent,
    points = temp.points,
    last_visit = temp.last_visit,
    is_active = temp.is_active,
    whatsapp = temp.whatsapp,
    referral_source = temp.referral_source,
    birth_month = temp.birth_month,
    birth_day = temp.birth_day,
    customer_tag = temp.customer_tag,
    notes = temp.notes,
    total_returns = temp.total_returns,
    profile_image = temp.profile_image,
    initial_notes = temp.initial_notes,
    location_description = temp.location_description,
    national_id = temp.national_id,
    updated_at = NOW()
FROM temp_customers_backup temp
WHERE customers.id = temp.id;

-- Insert new customers that don't exist
INSERT INTO customers (
    id, name, email, phone, gender, city, joined_date, loyalty_level,
    color_tag, referred_by, total_spent, points, last_visit, is_active,
    whatsapp, referral_source, birth_month, birth_day, customer_tag,
    notes, total_returns, profile_image, initial_notes, location_description,
    national_id, created_at, updated_at
)
SELECT 
    temp.id, temp.name, temp.email, temp.phone, temp.gender, temp.city,
    temp.joined_date, temp.loyalty_level, temp.color_tag, temp.referred_by,
    temp.total_spent, temp.points, temp.last_visit, temp.is_active,
    temp.whatsapp, temp.referral_source, temp.birth_month, temp.birth_day,
    temp.customer_tag, temp.notes, temp.total_returns, temp.profile_image,
    temp.initial_notes, temp.location_description, temp.national_id,
    temp.created_at, temp.updated_at
FROM temp_customers_backup temp
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE customers.id = temp.id
);

-- Clean up
DROP TABLE temp_customers_backup;

-- Verification queries
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN birth_month IS NOT NULL THEN 1 END) as customers_with_birth_month,
    COUNT(CASE WHEN birth_day IS NOT NULL THEN 1 END) as customers_with_birth_day,
    COUNT(CASE WHEN referral_source IS NOT NULL AND referral_source != '' THEN 1 END) as customers_with_referral_source,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as customers_with_whatsapp,
    COUNT(CASE WHEN points > 0 THEN 1 END) as customers_with_points
FROM customers;

-- Show customers with birthdays
SELECT 
    name, 
    email, 
    phone, 
    birth_month, 
    birth_day, 
    referral_source, 
    whatsapp, 
    points,
    city
FROM customers 
WHERE birth_month IS NOT NULL OR birth_day IS NOT NULL
ORDER BY name
LIMIT 20;

-- Show customers by referral source
SELECT 
    referral_source,
    COUNT(*) as count
FROM customers 
WHERE referral_source IS NOT NULL AND referral_source != ''
GROUP BY referral_source
ORDER BY count DESC;
`;

// Write the SQL script to file
fs.writeFileSync('complete_customer_update.sql', sqlScript);

console.log('✅ Complete SQL script generated: complete_customer_update.sql');
console.log(`📊 Script includes ${backupData.data.customers.length} customers`);

// Show some statistics
const customersWithBirthdays = backupData.data.customers.filter(c => c.birth_month || c.birth_day).length;
const customersWithReferralSource = backupData.data.customers.filter(c => c.referral_source && c.referral_source !== '').length;
const customersWithWhatsApp = backupData.data.customers.filter(c => c.whatsapp && c.whatsapp !== '').length;

console.log('\n📈 Customer Data Statistics:');
console.log(`🎂 Customers with birthdays: ${customersWithBirthdays}`);
console.log(`📱 Customers with referral source: ${customersWithReferralSource}`);
console.log(`💬 Customers with WhatsApp: ${customersWithWhatsApp}`);
console.log(`💰 Total customers: ${backupData.data.customers.length}`); 