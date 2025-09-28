#!/usr/bin/env node

const { importContacts } = require('./import-contacts-to-database.js');

console.log('🎯 LATS Contact Import Tool');
console.log('===========================\n');

// Run the import
importContacts()
  .then(() => {
    console.log('\n✨ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error.message);
    process.exit(1);
  });
