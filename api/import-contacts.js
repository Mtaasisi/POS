/**
 * API Endpoint for Unified Contact Import
 * Handles importing contacts from SMS backup and CSV files
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Phone number utilities
class PhoneNumberUtils {
  static normalizePhone(phone) {
    if (!phone) return null;
    
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('255')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+255' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '+255' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('255')) {
      return '+' + cleaned;
    }
    
    return null;
  }

  static isTanzanianPhone(phone) {
    const normalized = this.normalizePhone(phone);
    return normalized && normalized.startsWith('+255');
  }
}

// SMS Contact Processor
class SMSContactProcessor {
  constructor() {
    this.parser = require('fast-xml-parser').XMLParser;
  }

  async extractContactsFromSMS(xmlFilePath) {
    try {
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      const parser = new this.parser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      
      const jsonData = parser.parse(xmlData);
      
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
        const type = sms['@_type'];
        const contactName = sms['@_contact_name'];
        const readableDate = sms['@_readable_date'];

        if (this.isSystemMessage(address)) continue;

        const normalizedPhone = PhoneNumberUtils.normalizePhone(address);
        if (!normalizedPhone || !PhoneNumberUtils.isTanzanianPhone(normalizedPhone)) {
          continue;
        }

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

        communicationHistory.push({
          phone: normalizedPhone,
          message: body,
          date: readableDate,
          type: type === '1' ? 'received' : 'sent',
          contact_name: contactName
        });
      }

      return {
        contacts: Array.from(contacts.values()),
        communicationHistory
      };
    } catch (error) {
      console.error('Error processing SMS backup:', error);
      throw error;
    }
  }

  isSystemMessage(address) {
    const systemAddresses = [
      'TIGOPESA', 'Tigopesa', 'Tigo Packs', 'CRDB BANK', 'JIHUDUMIE',
      '15670', 'SILENTOCEAN', 'B2B DATA', 'MIXX BY YAS'
    ];
    
    return systemAddresses.includes(address) || 
           address.length < 10 || 
           /^\d{3,5}$/.test(address);
  }

  extractNameFromPhone(phone) {
    const normalized = PhoneNumberUtils.normalizePhone(phone);
    if (!normalized) return 'Unknown Contact';
    return `Contact ${normalized.substring(4, 7)}***`;
  }
}

// CSV Contact Processor
class CSVContactProcessor {
  async extractContactsFromCSV(csvFilePath) {
    try {
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const Papa = require('papaparse');
      
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
      });

      const contacts = [];

      for (const row of parsed.data) {
        const phone = row.Phone || row.phone;
        const name = row.Name || row.name || 'Unknown';
        const email = row.Email || row.email || '';
        const address = row.Address || row.address || '';
        const source = row.Source || row.source || 'CSV Import';

        if (!phone) continue;

        const normalizedPhone = PhoneNumberUtils.normalizePhone(phone);
        
        if (!normalizedPhone || !PhoneNumberUtils.isTanzanianPhone(normalizedPhone)) {
          continue;
        }

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
      }

      return contacts;
    } catch (error) {
      console.error('Error processing CSV file:', error);
      throw error;
    }
  }

  cleanName(name) {
    if (!name || name === 'Unknown') return 'Unknown Contact';
    return name.replace(/[^\w\s\-\.]/g, '').trim() || 'Unknown Contact';
  }
}

// Contact Deduplicator
class ContactDeduplicator {
  mergeContacts(smsContacts, csvContacts) {
    const mergedContacts = new Map();
    const stats = {
      smsOnly: 0,
      csvOnly: 0,
      merged: 0,
      total: 0
    };

    for (const contact of smsContacts) {
      mergedContacts.set(contact.phone, {
        ...contact,
        sources: ['SMS Backup']
      });
      stats.smsOnly++;
    }

    for (const contact of csvContacts) {
      if (mergedContacts.has(contact.phone)) {
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
        stats.smsOnly--;
      } else {
        mergedContacts.set(contact.phone, {
          ...contact,
          sources: [contact.source]
        });
        stats.csvOnly++;
      }
    }

    stats.total = mergedContacts.size;

    return {
      contacts: Array.from(mergedContacts.values()),
      stats
    };
  }

  chooseBetterName(name1, name2) {
    if (!name1 || name1 === 'Unknown Contact') return name2;
    if (!name2 || name2 === 'Unknown Contact') return name1;
    if (name1.length > name2.length) return name1;
    return name2;
  }
}

// Database Importer
class DatabaseImporter {
  async importContactsToDatabase(contacts, communicationHistory = []) {
    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    for (const contact of contacts) {
      try {
        const { data: existing } = await supabase
          .from('customers')
          .select('id, phone, name')
          .eq('phone', contact.phone)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('customers')
            .update({
              name: contact.name,
              email: contact.email || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) {
            console.error(`Error updating contact ${contact.phone}:`, error);
            stats.errors++;
          } else {
            stats.updated++;
          }
        } else {
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
            console.error(`Error creating contact ${contact.phone}:`, error);
            stats.errors++;
          } else {
            stats.imported++;
          }
        }
      } catch (error) {
        console.error(`Unexpected error for contact ${contact.phone}:`, error);
        stats.errors++;
      }
    }

    if (communicationHistory.length > 0) {
      await this.importCommunicationHistory(communicationHistory);
    }

    return stats;
  }

  async importCommunicationHistory(communicationHistory) {
    let imported = 0;
    let errors = 0;

    for (const comm of communicationHistory) {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', comm.phone)
          .single();

        if (!customer) continue;

        const { data: existing } = await supabase
          .from('customer_communications')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('message', comm.message)
          .eq('sent_at', comm.date)
          .single();

        if (existing) continue;

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
          console.error(`Error importing communication:`, error);
          errors++;
        } else {
          imported++;
        }
      } catch (error) {
        console.error(`Unexpected error importing communication:`, error);
        errors++;
      }
    }

    return { imported, errors };
  }
}

// Main handler function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { smsFilePath, csvFilePath, selectedContacts } = req.body;

    // Check if files exist
    if (!fs.existsSync(smsFilePath)) {
      return res.status(400).json({ error: `SMS file not found: ${smsFilePath}` });
    }
    if (!fs.existsSync(csvFilePath)) {
      return res.status(400).json({ error: `CSV file not found: ${csvFilePath}` });
    }

    // Initialize processors
    const smsProcessor = new SMSContactProcessor();
    const csvProcessor = new CSVContactProcessor();
    const deduplicator = new ContactDeduplicator();
    const dbImporter = new DatabaseImporter();

    // Process contacts
    const smsData = await smsProcessor.extractContactsFromSMS(smsFilePath);
    const csvContacts = await csvProcessor.extractContactsFromCSV(csvFilePath);
    
    // Merge and deduplicate
    const mergedData = deduplicator.mergeContacts(smsData.contacts, csvContacts);
    
    // Filter selected contacts if provided
    let contactsToImport = mergedData.contacts;
    if (selectedContacts && selectedContacts.length > 0) {
      contactsToImport = mergedData.contacts.filter(contact => 
        selectedContacts.includes(contact.phone)
      );
    }
    
    // Import to database
    const importStats = await dbImporter.importContactsToDatabase(
      contactsToImport, 
      smsData.communicationHistory
    );

    // Return results
    const finalStats = {
      ...mergedData.stats,
      ...importStats,
      communicationHistory: smsData.communicationHistory.length
    };

    res.status(200).json(finalStats);

  } catch (error) {
    console.error('Import process failed:', error);
    res.status(500).json({ error: 'Import process failed', details: error.message });
  }
}
