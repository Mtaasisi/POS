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

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

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

// Call Log Contact Processor
class CallLogProcessor {
  /**
   * Extract contacts from call log CSV
   */
  async extractContactsFromCallLog(csvFilePath) {
    console.log('📞 Processing call log file...');
    
    try {
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
      });

      if (parsed.errors.length > 0) {
        console.warn('⚠️ Call log CSV parsing warnings:', parsed.errors);
      }

      const contacts = new Map();
      const callHistory = [];
      const stats = {
        total: 0,
        tanzanian: 0,
        incoming: 0,
        outgoing: 0,
        missed: 0,
        totalDuration: 0
      };

      for (const row of parsed.data) {
        stats.total++;
        
        const fromNumber = row['From Number'] || row['from_number'];
        const toNumber = row['To Number'] || row['to_number'];
        const name = row['Name'] || row['name'] || 'Unknown';
        const dateTime = row['Date Time'] || row['date_time'];
        const duration = row['Duration'] || row['duration'];
        const type = row['Type'] || row['type'];

        // Skip rows with missing essential data
        if (!fromNumber || !toNumber || !dateTime) {
          continue;
        }

        // Determine the contact number (the other party, not your number)
        const contactNumber = fromNumber === ' 712378850' ? toNumber : fromNumber;
        
        if (!contactNumber) continue;

        const normalizedPhone = PhoneNumberUtils.normalizePhone(contactNumber);
        
        if (!normalizedPhone || !PhoneNumberUtils.isTanzanianPhone(normalizedPhone)) {
          continue;
        }

        stats.tanzanian++;
        
        // Track call types
        if (type === 'Incoming') stats.incoming++;
        else if (type === 'Outgoing') stats.outgoing++;
        else if (type === 'Missed') stats.missed++;

        // Parse duration
        const durationSeconds = this.parseDuration(duration);
        stats.totalDuration += durationSeconds;

        // Add to contacts map
        if (!contacts.has(normalizedPhone)) {
          contacts.set(normalizedPhone, {
            phone: normalizedPhone,
            name: this.cleanName(name),
            source: 'Call Log',
            callCount: 0,
            totalDuration: 0,
            lastCallDate: null,
            firstCallDate: null,
            incomingCalls: 0,
            outgoingCalls: 0,
            missedCalls: 0
          });
        }

        const contact = contacts.get(normalizedPhone);
        contact.callCount++;
        contact.totalDuration += durationSeconds;
        
        if (!contact.lastCallDate || new Date(dateTime) > new Date(contact.lastCallDate)) {
          contact.lastCallDate = dateTime;
        }
        
        if (!contact.firstCallDate || new Date(dateTime) < new Date(contact.firstCallDate)) {
          contact.firstCallDate = dateTime;
        }

        // Track call types
        if (type === 'Incoming') contact.incomingCalls++;
        else if (type === 'Outgoing') contact.outgoingCalls++;
        else if (type === 'Missed') contact.missedCalls++;

        // Store call history
        callHistory.push({
          phone: normalizedPhone,
          type: (type || 'unknown').toLowerCase(),
          duration: durationSeconds,
          dateTime: dateTime,
          contact_name: name
        });
      }

      console.log(`✅ Extracted ${contacts.size} contacts from call log`);
      console.log(`📊 Call Log Statistics:`, {
        ...stats,
        averageDuration: Math.round(stats.totalDuration / stats.tanzanian),
        totalDurationFormatted: this.formatDuration(stats.totalDuration)
      });

      return {
        contacts: Array.from(contacts.values()),
        callHistory,
        stats
      };
    } catch (error) {
      console.error('❌ Error processing call log file:', error);
      throw error;
    }
  }

  /**
   * Parse duration string to seconds
   */
  parseDuration(durationStr) {
    if (!durationStr) return 0;
    
    // Format: "00h 00m 04s" or "00h 01m 06s"
    const match = durationStr.match(/(\d+)h\s+(\d+)m\s+(\d+)s/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    return 0;
  }

  /**
   * Format duration in seconds to readable format
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Clean contact name
   */
  cleanName(name) {
    if (!name || name === 'Unknown') return 'Unknown Contact';
    
    // Remove emojis and special characters, but keep business indicators
    return name.replace(/[^\w\s\-\.\|]/g, '').trim() || 'Unknown Contact';
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
  mergeContacts(smsContacts, csvContacts, callLogContacts = []) {
    console.log('🔄 Merging and deduplicating contacts...');
    
    const mergedContacts = new Map();
    const stats = {
      smsOnly: 0,
      csvOnly: 0,
      callLogOnly: 0,
      merged: 0,
      total: 0
    };

    // Process SMS contacts
    for (const contact of smsContacts) {
      mergedContacts.set(contact.phone, {
        ...contact,
        sources: ['SMS Backup'],
        callCount: 0,
        totalDuration: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0
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
          sources: [contact.source],
          callCount: 0,
          totalDuration: 0,
          incomingCalls: 0,
          outgoingCalls: 0,
          missedCalls: 0
        });
        stats.csvOnly++;
      }
    }

    // Process Call Log contacts
    for (const contact of callLogContacts) {
      if (mergedContacts.has(contact.phone)) {
        // Merge with existing contact
        const existing = mergedContacts.get(contact.phone);
        mergedContacts.set(contact.phone, {
          ...existing,
          name: this.chooseBetterName(existing.name, contact.name),
          sources: [...existing.sources, contact.source],
          callCount: contact.callCount,
          totalDuration: contact.totalDuration,
          incomingCalls: contact.incomingCalls,
          outgoingCalls: contact.outgoingCalls,
          missedCalls: contact.missedCalls,
          lastCallDate: contact.lastCallDate,
          firstCallDate: contact.firstCallDate
        });
        stats.merged++;
        // Adjust count based on what was merged
        if (existing.sources.includes('SMS Backup')) stats.smsOnly--;
        if (existing.sources.includes('CSV Import')) stats.csvOnly--;
      } else {
        mergedContacts.set(contact.phone, {
          ...contact,
          sources: [contact.source],
          messageCount: 0,
          email: '',
          address: ''
        });
        stats.callLogOnly++;
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
  async importContactsToDatabase(contacts, communicationHistory = [], callHistory = []) {
    console.log('💾 Importing contacts to database...');
    
    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    // Import contacts in batches for better performance
    const batchSize = 50;
    const totalBatches = Math.ceil(contacts.length / batchSize);
    
    console.log(`📦 Processing ${contacts.length} contacts in ${totalBatches} batches of ${batchSize}...`);
    
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} contacts)...`);
      
      // Get existing contacts in this batch
      const phoneNumbers = batch.map(c => c.phone);
      const { data: existingContacts } = await supabase
        .from('customers')
        .select('phone')
        .in('phone', phoneNumbers);
      
      const existingPhones = new Set(existingContacts?.map(c => c.phone) || []);
      
      // Filter out existing contacts
      const newContacts = batch.filter(contact => !existingPhones.has(contact.phone));
      const skippedCount = batch.length - newContacts.length;
      
      stats.skipped += skippedCount;
      
      if (skippedCount > 0) {
        console.log(`⏭️ Skipped ${skippedCount} existing contacts in batch ${batchNumber}`);
      }
      
      // Insert new contacts in batch
      if (newContacts.length > 0) {
        const contactsToInsert = newContacts.map(contact => ({
          name: contact.name,
          phone: contact.phone,
          email: contact.email || '',
          gender: 'other',
          city: contact.address || 'Dar es Salaam',
          whatsapp: contact.phone,
          referral_source: contact.sources.join(', '),
          initial_notes: this.generateInitialNotes(contact),
          loyalty_level: this.determineLoyaltyLevel(contact),
          color_tag: this.determineColorTag(contact),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('customers')
          .insert(contactsToInsert);
        
        if (error) {
          console.error(`❌ Error creating batch ${batchNumber}:`, error);
          stats.errors += newContacts.length;
        } else {
          stats.imported += newContacts.length;
          console.log(`✅ Created ${newContacts.length} new contacts in batch ${batchNumber}`);
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Import communication history
    if (communicationHistory.length > 0) {
      await this.importCommunicationHistory(communicationHistory);
    }

    // Import call history
    if (callHistory.length > 0) {
      await this.importCallHistory(callHistory);
    }

    console.log('📊 Import Statistics:', stats);
    return stats;
  }

  /**
   * Generate initial notes for contact
   */
  generateInitialNotes(contact) {
    const notes = [];
    
    if (contact.sources) {
      notes.push(`Imported from: ${contact.sources.join(', ')}`);
    }
    
    if (contact.messageCount > 0) {
      notes.push(`SMS messages: ${contact.messageCount}`);
    }
    
    if (contact.callCount > 0) {
      notes.push(`Calls: ${contact.callCount} (${this.formatDuration(contact.totalDuration)})`);
      if (contact.incomingCalls > 0) notes.push(`Incoming: ${contact.incomingCalls}`);
      if (contact.outgoingCalls > 0) notes.push(`Outgoing: ${contact.outgoingCalls}`);
      if (contact.missedCalls > 0) notes.push(`Missed: ${contact.missedCalls}`);
    }
    
    return notes.join('. ');
  }

  /**
   * Determine loyalty level based on contact activity
   */
  determineLoyaltyLevel(contact) {
    const totalActivity = (contact.messageCount || 0) + (contact.callCount || 0);
    
    if (totalActivity >= 50) return 'platinum';
    if (totalActivity >= 20) return 'gold';
    if (totalActivity >= 10) return 'silver';
    return 'bronze';
  }

  /**
   * Determine color tag based on contact type
   */
  determineColorTag(contact) {
    if (contact.sources && contact.sources.includes('Call Log') && contact.callCount > 10) {
      return 'vip';
    }
    if (contact.messageCount > 20) {
      return 'purchased';
    }
    if (contact.sources && contact.sources.length > 1) {
      return 'new';
    }
    return 'new';
  }

  /**
   * Format duration in seconds to readable format
   */
  formatDuration(seconds) {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Import call history
   */
  async importCallHistory(callHistory) {
    console.log('📞 Importing call history...');
    
    let imported = 0;
    let errors = 0;

    for (const call of callHistory) {
      try {
        // Get customer ID
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', call.phone)
          .single();

        if (!customer) continue;

        // Check if call already exists
        const { data: existing } = await supabase
          .from('customer_communications')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('type', 'phone_call')
          .eq('sent_at', call.dateTime)
          .single();

        if (existing) continue;

        // Insert call record
        const { error } = await supabase
          .from('customer_communications')
          .insert({
            customer_id: customer.id,
            type: 'phone_call',
            message: `Call ${call.type} - Duration: ${this.formatDuration(call.duration)}`,
            status: call.type === 'missed' ? 'failed' : 'delivered',
            phone_number: call.phone,
            sent_at: call.dateTime,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error(`❌ Error importing call:`, error);
          errors++;
        } else {
          imported++;
        }
      } catch (error) {
        console.error(`❌ Unexpected error importing call:`, error);
        errors++;
      }
    }

    console.log(`✅ Call history imported: ${imported} records, ${errors} errors`);
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
  console.log('📁 Checking file paths...');

  try {
    // File paths
    const smsFilePath = '/Users/mtaasisi/Downloads/sms-20250919010749.xml';
    const csvFilePath = '/Users/mtaasisi/Combined_Contacts_Merged_Names.csv';
    const callLogFilePath = '/Users/mtaasisi/Downloads/Call_Log_With_Names.csv';

    // Check if files exist
    console.log(`📱 SMS file: ${smsFilePath} - ${fs.existsSync(smsFilePath) ? '✅ Found' : '❌ Not found'}`);
    console.log(`📋 CSV file: ${csvFilePath} - ${fs.existsSync(csvFilePath) ? '✅ Found' : '❌ Not found'}`);
    console.log(`📞 Call log file: ${callLogFilePath} - ${fs.existsSync(callLogFilePath) ? '✅ Found' : '❌ Not found'}`);
    
    if (!fs.existsSync(smsFilePath)) {
      throw new Error(`SMS file not found: ${smsFilePath}`);
    }
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }
    if (!fs.existsSync(callLogFilePath)) {
      throw new Error(`Call log file not found: ${callLogFilePath}`);
    }

    // Initialize processors
    const smsProcessor = new SMSContactProcessor();
    const csvProcessor = new CSVContactProcessor();
    const callLogProcessor = new CallLogProcessor();
    const deduplicator = new ContactDeduplicator();
    const dbImporter = new DatabaseImporter();

    // Process SMS contacts
    const smsData = await smsProcessor.extractContactsFromSMS(smsFilePath);
    
    // Process CSV contacts
    const csvContacts = await csvProcessor.extractContactsFromCSV(csvFilePath);
    
    // Process Call Log contacts
    const callLogData = await callLogProcessor.extractContactsFromCallLog(callLogFilePath);
    
    // Merge and deduplicate
    const mergedData = deduplicator.mergeContacts(
      smsData.contacts, 
      csvContacts, 
      callLogData.contacts
    );
    
    // Import to database
    const importStats = await dbImporter.importContactsToDatabase(
      mergedData.contacts, 
      smsData.communicationHistory,
      callLogData.callHistory
    );

    // Final summary
    console.log('\n🎉 Import Process Complete!');
    console.log('📊 Final Statistics:');
    console.log(`   • Total contacts processed: ${mergedData.stats.total}`);
    console.log(`   • SMS-only contacts: ${mergedData.stats.smsOnly}`);
    console.log(`   • CSV-only contacts: ${mergedData.stats.csvOnly}`);
    console.log(`   • Call Log-only contacts: ${mergedData.stats.callLogOnly}`);
    console.log(`   • Merged contacts: ${mergedData.stats.merged}`);
    console.log(`   • New contacts imported: ${importStats.imported}`);
    console.log(`   • Existing contacts updated: ${importStats.updated}`);
    console.log(`   • Errors: ${importStats.errors}`);
    console.log(`   • SMS communication history: ${smsData.communicationHistory.length}`);
    console.log(`   • Call history records: ${callLogData.callHistory.length}`);
    console.log(`   • Total call duration: ${callLogProcessor.formatDuration(callLogData.stats.totalDuration)}`);
    console.log(`   • Average call duration: ${Math.round(callLogData.stats.totalDuration / callLogData.stats.tanzanian)}s`);

  } catch (error) {
    console.error('❌ Import process failed:', error);
    process.exit(1);
  }
}

// Run the import process
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('import-unified-contacts.js')) {
  main();
}

export {
  PhoneNumberUtils,
  SMSContactProcessor,
  CSVContactProcessor,
  CallLogProcessor,
  ContactDeduplicator,
  DatabaseImporter
};
