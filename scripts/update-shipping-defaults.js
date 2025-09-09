// Script to update shipping defaults
// This script helps you change the default shipping destination

const fs = require('fs');
const path = require('path');

const SHIPPING_DEFAULTS_FILE = path.join(__dirname, '../src/features/lats/config/shippingDefaults.ts');

// New shipping defaults - CHANGE THESE VALUES
const NEW_DEFAULTS = {
  defaultCity: 'Nairobi',           // Change to your preferred city
  defaultCountry: 'Kenya',          // Change to your preferred country
  defaultAddress: 'Nairobi, Kenya', // Change to your preferred address
  defaultCurrency: 'KES',           // Change to your preferred currency
  defaultTimezone: 'Africa/Nairobi', // Change to your preferred timezone
  defaultPhoneCode: '+254'          // Change to your preferred phone code
};

// Alternative configurations you can use:
const CONFIGURATIONS = {
  TANZANIA: {
    defaultCity: 'Dar es Salaam',
    defaultCountry: 'Tanzania',
    defaultAddress: 'Dar es Salaam, Tanzania',
    defaultCurrency: 'TZS',
    defaultTimezone: 'Africa/Dar_es_Salaam',
    defaultPhoneCode: '+255'
  },
  KENYA: {
    defaultCity: 'Nairobi',
    defaultCountry: 'Kenya',
    defaultAddress: 'Nairobi, Kenya',
    defaultCurrency: 'KES',
    defaultTimezone: 'Africa/Nairobi',
    defaultPhoneCode: '+254'
  },
  UGANDA: {
    defaultCity: 'Kampala',
    defaultCountry: 'Uganda',
    defaultAddress: 'Kampala, Uganda',
    defaultCurrency: 'UGX',
    defaultTimezone: 'Africa/Kampala',
    defaultPhoneCode: '+256'
  },
  RWANDA: {
    defaultCity: 'Kigali',
    defaultCountry: 'Rwanda',
    defaultAddress: 'Kigali, Rwanda',
    defaultCurrency: 'RWF',
    defaultTimezone: 'Africa/Kigali',
    defaultPhoneCode: '+250'
  },
  SOUTH_AFRICA: {
    defaultCity: 'Johannesburg',
    defaultCountry: 'South Africa',
    defaultAddress: 'Johannesburg, South Africa',
    defaultCurrency: 'ZAR',
    defaultTimezone: 'Africa/Johannesburg',
    defaultPhoneCode: '+27'
  }
};

function updateShippingDefaults() {
  try {
    console.log('🔄 Updating shipping defaults...\n');

    // Read the current file
    let content = fs.readFileSync(SHIPPING_DEFAULTS_FILE, 'utf8');

    // Update the default values
    Object.entries(NEW_DEFAULTS).forEach(([key, value]) => {
      const regex = new RegExp(`(default${key.charAt(0).toUpperCase() + key.slice(1)}:\\s*')([^']+)(')`, 'g');
      content = content.replace(regex, `$1${value}$3`);
    });

    // Write the updated content back
    fs.writeFileSync(SHIPPING_DEFAULTS_FILE, content);

    console.log('✅ Shipping defaults updated successfully!');
    console.log('\n📋 New defaults:');
    Object.entries(NEW_DEFAULTS).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n🎯 To use a different configuration, edit this script and change NEW_DEFAULTS to one of:');
    Object.keys(CONFIGURATIONS).forEach(config => {
      console.log(`  - ${config}`);
    });

  } catch (error) {
    console.error('❌ Error updating shipping defaults:', error.message);
  }
}

// Show current configuration options
function showConfigurations() {
  console.log('🌍 Available shipping configurations:\n');
  
  Object.entries(CONFIGURATIONS).forEach(([name, config]) => {
    console.log(`📍 ${name}:`);
    Object.entries(config).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--show') || args.includes('-s')) {
  showConfigurations();
} else {
  updateShippingDefaults();
}
