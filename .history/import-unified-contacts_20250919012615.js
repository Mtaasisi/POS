#!/usr/bin/env node

/**
 * Unified Contact Import System
 * Integrates SMS backup data and CSV contacts into LATS CHANCE application
 * 
 * Features:
 * - Import contacts from SMS backup XML
 * - Import contacts from CSV file
 * - Phone number validation and formatting
 * - Contact deduplication
 * - Tanzanian phone number filtering
 * - Database integration with existing customer system
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');
const { XMLParser } = require('fast-xml-parser');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Phone number utilities
class PhoneNumberUtils {
  /**
   * Normalize phone number to standard format
   */
  static normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('255')) {
      // Already has country code
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // Remove leading 0 and add country code
      return '+255' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      // Assume it's a local number
      return '+255' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('255')) {
      // Full international format
      return '+' + cleaned;
    }
    
    return null;
  }

  /**
   * Check if phone number is Tanzanian
   */
  static isTanzanianPhone(phone) {
    const normalized = this.normalizePhone(phone);
    return normalized && normalized.startsWith('+255');
  }

  /**
   * Format phone for display
   */
  static formatForDisplay(phone) {
    const normalized = this.normalizePhone(phone);
    if (!normalized) return phone;
    
    // Format as +255 XXX XXX XXX
    const number = normalized.substring(4);
    return `+255 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  }
}

// Contact processing classes
class SMSContactProcessor {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
  }

  /**
   * Extract contacts from SMS backup XML
   */
  async extractContactsFromSMS(xmlFilePath) {
    console.log('📱 Processing SMS backup file...');
    
    try {
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      const jsonData = this.parser.parse(xmlData);
      
      if (!jsonData.smses || !jsonData.smses.sms) {
        throw new Error('Invalid SMS backup format');
      }

      const smsMessages = Array.isArray(jsonData.smses.sms) 
        ? jsonData.smses.sms 
        : [jsonData.smses.sms];

      const contacts = new Map();
      const communicationHistory = [];

      for (const sms of smsMessages) {
        const address = sms['@_address'];
        const body = sms['@_body'];
        const date = sms['@_date'];
        const type = sms['@_type']; // 1 = received, 2 = sent
        const contactName = sms['@_contact_name'];
        const readableDate = sms['@_readable_date'];

        // Skip system messages and short codes
        if (this.isSystemMessage(address)) continue;

        const normalizedPhone = PhoneNumberUtils.normalizePhone(address);
        if (!normalizedPhone || !PhoneNumberUtils.isTanzanianPhone(normalizedPhone)) {
          continue;
        }

        // Add to contacts map
        if (!contacts.has(normalizedPhone)) {
          contacts.set(normalizedPhone, {
            phone: normalizedPhone,
            name: contactName && contactName !== '(Unknown)' ? contactName : this.extractNameFromPhone(address),
            source: 'SMS Backup',
            messageCount: 0,
            lastMessageDate: null,
            firstMessageDate: null
          });
        }

        const contact = contacts.get(normalizedPhone);
        contact.messageCount++;
        
        if (!contact.lastMessageDate || new Date(date) > new Date(contact.lastMessageDate)) {
          contact.lastMessageDate = readableDate;
        }
        
        if (!contact.firstMessageDate || new Date(date) < new Date(contact.firstMessageDate)) {
          contact.firstMessageDate = readableDate;
        }

        // Store communication history
        communicationHistory.push({
          phone: normalizedPhone,
          message: body,
          date: readableDate,
          type: type === '1' ? 'received' : 'sent',
          contact_name: contactName
        });
      }

      console.log(`✅ Extracted ${contacts.size} contacts from SMS backup`);
      console.log(`📊 Total messages processed: ${smsMessages.length}`);
      console.log(`💬 Communication history entries: ${communicationHistory.length}`);

      return {
        contacts: Array.from(contacts.values()),
        communicationHistory
      };
    } catch (error) {
      console.error('❌ Error processing SMS backup:', error);
      throw error;
    }
  }

  /**
   * Check if address is a system message
   */
  isSystemMessage(address) {
    const systemAddresses = [
      'TIGOPESA', 'Tigopesa', 'Tigo Packs', 'CRDB BANK', 'JIHUDUMIE',
      '15670', 'SILENTOCEAN', 'B2B DATA', 'MIXX BY YAS'
    ];
    
    return systemAddresses.includes(address) || 
           address.length < 10 || 
           /^\d{3,5}$/.test(address);
  }

  /**
   * Extract name from phone number if no contact name available
   */
  extractNameFromPhone(phone) {
    const normalized = PhoneNumberUtils.normalizePhone(phone);
    if (!normalized) return 'Unknown Contact';
    
    return `Contact ${normalized.substring(4, 7)}***`;
  }
}

class CSVContactProcessor {
  /**
   * Extract contacts from CSV file
   */
  async extractContactsFromCSV(csvFilePath) {
    console.log('📋 Processing CSV contacts file...');
    
    try {
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
      });

      if (parsed.errors.length > 0) {
        console.warn('⚠️ CSV parsing warnings:', parsed.errors);
      }

      const contacts = [];
      const stats = {
        total: 0,
        tanzanian: 0,
        valid: 0,
        invalid: 0
      };

      for (const row of parsed.data) {
        stats.total++;
        
        const phone = row.Phone || row.phone;
        const name = row.Name || row.name || 'Unknown';
        const email = row.Email || row.email || '';
        const address = row.Address || row.address || '';
        const source = row.Source || row.source || 'CSV Import';

        if (!phone) {
          stats.invalid++;
          continue;
        }

        const normalizedPhone = PhoneNumberUtils.normalizePhone(phone);
        
        if (!normalizedPhone) {
          stats.invalid++;
          continue;
        }

        if (PhoneNumberUtils.isTanzanianPhone(normalizedPhone)) {
          stats.tanzanian++;
          
          contacts.push({
            phone: normalizedPhone,
            name: this.cleanName(name),
            email: email,
            address: address,
            source: source,
            messageCount: 0,
            lastMessageDate: null,
            firstMessageDate: null
          });
          
          stats.valid++;
        }
      }

      console.log(`✅ Extracted ${contacts.length} Tanzanian contacts from CSV`);
      console.log(`📊 CSV Statistics:`, stats);

      return contacts;
    } catch (error) {
      console.error('❌ Error processing CSV file:', error);
      throw error;
    }
  }

  /**
   * Clean contact name
   */
  cleanName(name) {
    if (!name || name === 'Unknown') return 'Unknown Contact';
    
    // Remove emojis and special characters
    return name.replace(/[^\w\s\-\.]/g, '').trim() || 'Unknown Contact';
  }
}

class ContactDeduplicator {
  /**
   * Merge and deduplicate contacts from multiple sources
   */
  mergeContacts(smsContacts, csvContacts) {
    console.log('🔄 Merging and deduplicating contacts...');
    
    const mergedContacts = new Map();
    const stats = {
      smsOnly: 0,
      csvOnly: 0,
      merged: 0,
      total: 0
    };

    // Process SMS contacts
    for (const contact of smsContacts) {
      mergedContacts.set(contact.phone, {
        ...contact,
        sources: ['SMS Backup']
      });
      stats.smsOnly++;
    }

    // Process CSV contacts
    for (const contact of csvContacts) {
      if (mergedContacts.has(contact.phone)) {
        // Merge with existing contact
        const existing = mergedContacts.get(contact.phone);
        mergedContacts.set(contact.phone, {
          ...existing,
          name: this.chooseBetterName(existing.name, contact.name),
          email: contact.email || existing.email,
          address: contact.address || existing.address,
          sources: [...existing.sources, contact.source],
          messageCount: existing.messageCount || 0
        });
        stats.merged++;
        stats.smsOnly--; // Adjust count
      } else {
        mergedContacts.set(contact.phone, {
          ...contact,
          sources: [contact.source]
        });
        stats.csvOnly++;
      }
    }

    stats.total = mergedContacts.size;

    console.log(`✅ Contact merge complete:`, stats);
    console.log(`📊 Final contact count: ${stats.total}`);

    return {
      contacts: Array.from(mergedContacts.values()),
      stats
    };
  }

  /**
   * Choose the better name between two options
   */
  chooseBetterName(name1, name2) {
    if (!name1 || name1 === 'Unknown Contact') return name2;
    if (!name2 || name2 === 'Unknown Contact') return name1;
    if (name1.length > name2.length) return name1;
    return name2;
  }
}

class DatabaseImporter {
  /**
   * Import contacts to database
   */
  async importContactsToDatabase(contacts, communicationHistory = []) {
    console.log('💾 Importing contacts to database...');
    
    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    // Import contacts
    for (const contact of contacts) {
      try {
        // Check if contact already exists
        const { data: existing } = await supabase
          .from('customers')
          .select('id, phone, name')
          .eq('phone', contact.phone)
          .single();

        if (existing) {
          // Update existing contact
          const { error } = await supabase
            .from('customers')
            .update({
              name: contact.name,
              email: contact.email || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Error updating contact ${contact.phone}:`, error);
            stats.errors++;
          } else {
            stats.updated++;
            console.log(`✅ Updated contact: ${contact.name} (${contact.phone})`);
          }
        } else {
          // Create new contact
          const { error } = await supabase
            .from('customers')
            .insert({
              name: contact.name,
              phone: contact.phone,
              email: contact.email || '',
              gender: 'other',
              city: contact.address || 'Dar es Salaam',
              whatsapp: contact.phone,
              referral_source: contact.sources.join(', '),
              initial_notes: `Imported from: ${contact.sources.join(', ')}. Message count: ${contact.messageCount}`,
              loyalty_level: 'bronze',
              color_tag: 'new',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.error(`❌ Error creating contact ${contact.phone}:`, error);
            stats.errors++;
          } else {
            stats.imported++;
            console.log(`✅ Created contact: ${contact.name} (${contact.phone})`);
          }
        }
      } catch (error) {
        console.error(`❌ Unexpected error for contact ${contact.phone}:`, error);
        stats.errors++;
      }
    }

    // Import communication history
    if (communicationHistory.length > 0) {
      await this.importCommunicationHistory(communicationHistory);
    }

    console.log('📊 Import Statistics:', stats);
    return stats;
  }

  /**
   * Import communication history
   */
  async importCommunicationHistory(communicationHistory) {
    console.log('💬 Importing communication history...');
    
    let imported = 0;
    let errors = 0;

    for (const comm of communicationHistory) {
      try {
        // Get customer ID
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', comm.phone)
          .single();

        if (!customer) continue;

        // Check if communication already exists
        const { data: existing } = await supabase
          .from('customer_communications')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('message', comm.message)
          .eq('sent_at', comm.date)
          .single();

        if (existing) continue;

        // Insert communication record
        const { error } = await supabase
          .from('customer_communications')
          .insert({
            customer_id: customer.id,
            type: 'sms',
            message: comm.message,
            status: 'delivered',
            phone_number: comm.phone,
            sent_at: comm.date,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error(`❌ Error importing communication:`, error);
          errors++;
        } else {
          imported++;
        }
      } catch (error) {
        console.error(`❌ Unexpected error importing communication:`, error);
        errors++;
      }
    }

    console.log(`✅ Communication history imported: ${imported} records, ${errors} errors`);
  }
}

// Main execution function
async function main() {
  console.log('🚀 Starting Unified Contact Import Process...\n');

  try {
    // File paths
    const smsFilePath = '/Users/mtaasisi/Downloads/sms-20250919010749.xml';
    const csvFilePath = '/Users/mtaasisi/Combined_Contacts_Merged_Names.csv';

    // Check if files exist
    if (!fs.existsSync(smsFilePath)) {
      throw new Error(`SMS file not found: ${smsFilePath}`);
    }
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    // Initialize processors
    const smsProcessor = new SMSContactProcessor();
    const csvProcessor = new CSVContactProcessor();
    const deduplicator = new ContactDeduplicator();
    const dbImporter = new DatabaseImporter();

    // Process SMS contacts
    const smsData = await smsProcessor.extractContactsFromSMS(smsFilePath);
    
    // Process CSV contacts
    const csvContacts = await csvProcessor.extractContactsFromCSV(csvFilePath);
    
    // Merge and deduplicate
    const mergedData = deduplicator.mergeContacts(smsData.contacts, csvContacts);
    
    // Import to database
    const importStats = await dbImporter.importContactsToDatabase(
      mergedData.contacts, 
      smsData.communicationHistory
    );

    // Final summary
    console.log('\n🎉 Import Process Complete!');
    console.log('📊 Final Statistics:');
    console.log(`   • Total contacts processed: ${mergedData.stats.total}`);
    console.log(`   • SMS-only contacts: ${mergedData.stats.smsOnly}`);
    console.log(`   • CSV-only contacts: ${mergedData.stats.csvOnly}`);
    console.log(`   • Merged contacts: ${mergedData.stats.merged}`);
    console.log(`   • New contacts imported: ${importStats.imported}`);
    console.log(`   • Existing contacts updated: ${importStats.updated}`);
    console.log(`   • Errors: ${importStats.errors}`);
    console.log(`   • Communication history records: ${smsData.communicationHistory.length}`);

  } catch (error) {
    console.error('❌ Import process failed:', error);
    process.exit(1);
  }
}

// Run the import process
if (require.main === module) {
  main();
}

module.exports = {
  PhoneNumberUtils,
  SMSContactProcessor,
  CSVContactProcessor,
  ContactDeduplicator,
  DatabaseImporter
};
