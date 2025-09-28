#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Call log file path
const callLogPath = '/Users/mtaasisi/Downloads/Call_Log_With_Names.csv';

// Function to clean and standardize phone numbers
function standardizePhone(phone) {
    if (!phone) return null;
    
    phone = phone.trim();
    
    if (phone.startsWith('+255')) {
        return phone;
    } else if (phone.startsWith('255')) {
        return '+' + phone;
    } else if (phone.length === 9) {
        return '+255' + phone;
    } else if (phone.length === 10 && phone.startsWith('0')) {
        return '+255' + phone.substring(1);
    } else {
        return '+255' + phone;
    }
}

// Function to clean customer names
function cleanName(name) {
    if (!name || name.trim() === '') return null;
    
    // Remove everything after | and clean special characters
    let clean = name.replace(/\|.*$/, '');
    clean = clean.replace(/[🤓🏀]/g, '');
    clean = clean.trim();
    
    return clean && clean !== 'Unknown' ? clean : null;
}

// Function to parse duration to minutes
function parseDuration(durationStr) {
    if (!durationStr || durationStr.trim() === '') return 0;
    
    try {
        // Parse format like "00h 01m 20s"
        const parts = durationStr.split(' ');
        let hours = 0, minutes = 0, seconds = 0;
        
        for (const part of parts) {
            if (part.endsWith('h')) {
                hours = parseInt(part.slice(0, -1)) || 0;
            } else if (part.endsWith('m')) {
                minutes = parseInt(part.slice(0, -1)) || 0;
            } else if (part.endsWith('s')) {
                seconds = parseInt(part.slice(0, -1)) || 0;
            }
        }
        
        return hours * 60 + minutes + seconds / 60;
    } catch (error) {
        return 0;
    }
}

// Function to get all customers from database
async function getAllCustomers() {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, phone, created_at')
            .not('phone', 'is', null);
        
        if (error) throw error;
        
        console.log(`✅ Retrieved ${data.length} customers from database`);
        return data;
    } catch (error) {
        console.error('❌ Error fetching customers:', error);
        return [];
    }
}

// Function to process call log
async function processCallLog() {
    return new Promise((resolve, reject) => {
        const callData = new Map();
        let totalRecords = 0;
        
        console.log('📞 Processing call log...');
        
        fs.createReadStream(callLogPath)
            .pipe(csv())
            .on('data', (row) => {
                totalRecords++;
                
                try {
                    const phone = standardizePhone(row['To Number']);
                    const name = cleanName(row['Name']);
                    const callDateTime = new Date(row['Date Time']);
                    const duration = parseDuration(row['Duration']);
                    const callType = row['Type'];
                    
                    if (!phone) return;
                    
                    if (!callData.has(phone)) {
                        callData.set(phone, {
                            phone,
                            names: new Set(),
                            calls: [],
                            firstCall: callDateTime,
                            lastCall: callDateTime,
                            totalCalls: 0,
                            incomingCalls: 0,
                            outgoingCalls: 0,
                            missedCalls: 0,
                            totalDuration: 0
                        });
                    }
                    
                    const data = callData.get(phone);
                    
                    if (name) data.names.add(name);
                    data.calls.push({ callDateTime, duration, callType });
                    data.totalCalls++;
                    data.totalDuration += duration;
                    
                    if (callType === 'Incoming') data.incomingCalls++;
                    else if (callType === 'Outgoing') data.outgoingCalls++;
                    else if (callType === 'Missed') data.missedCalls++;
                    
                    if (callDateTime < data.firstCall) data.firstCall = callDateTime;
                    if (callDateTime > data.lastCall) data.lastCall = callDateTime;
                    
                } catch (error) {
                    console.warn(`⚠️  Error processing row ${totalRecords}:`, error.message);
                }
            })
            .on('end', () => {
                console.log(`✅ Processed ${totalRecords} call records`);
                console.log(`✅ Found ${callData.size} unique phone numbers`);
                resolve(callData);
            })
            .on('error', reject);
    });
}

// Function to check overlap
function checkOverlap(callData, customers) {
    const customerPhones = new Set(customers.map(c => c.phone));
    
    const matching = [];
    const newContacts = [];
    
    for (const [phone, data] of callData) {
        const bestName = Array.from(data.names).sort((a, b) => b.length - a.length)[0];
        
        if (customerPhones.has(phone)) {
            const customer = customers.find(c => c.phone === phone);
            matching.push({
                phone,
                callLogName: bestName,
                databaseName: customer.name,
                totalCalls: data.totalCalls,
                totalDuration: data.totalDuration,
                firstCall: data.firstCall,
                lastCall: data.lastCall,
                customerId: customer.id
            });
        } else {
            newContacts.push({
                phone,
                name: bestName,
                totalCalls: data.totalCalls,
                totalDuration: data.totalDuration,
                firstCall: data.firstCall,
                lastCall: data.lastCall
            });
        }
    }
    
    return { matching, newContacts };
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting call log and database overlap analysis...\n');
        
        // Get customers from database
        const customers = await getAllCustomers();
        
        // Process call log
        const callData = await processCallLog();
        
        // Check overlap
        const { matching, newContacts } = checkOverlap(callData, customers);
        
        // Display results
        console.log('\n📊 OVERLAP ANALYSIS RESULTS:');
        console.log('='.repeat(50));
        
        console.log(`\n📞 Call Log Contacts: ${callData.size}`);
        console.log(`👥 Database Customers: ${customers.length}`);
        console.log(`✅ Matching Contacts: ${matching.length}`);
        console.log(`🆕 New Contacts: ${newContacts.length}`);
        console.log(`📋 Database Only: ${customers.length - matching.length}`);
        
        // Show top matching contacts
        console.log('\n🏆 TOP MATCHING CONTACTS (by call volume):');
        console.log('-'.repeat(80));
        matching
            .sort((a, b) => b.totalCalls - a.totalCalls)
            .slice(0, 10)
            .forEach((contact, index) => {
                console.log(`${index + 1}. ${contact.callLogName || 'Unknown'} (${contact.phone})`);
                console.log(`   Calls: ${contact.totalCalls}, Duration: ${contact.totalDuration.toFixed(1)} min`);
                console.log(`   DB Name: ${contact.databaseName || 'N/A'}`);
                console.log('');
            });
        
        // Show top new contacts
        console.log('\n🆕 TOP NEW CONTACTS (by call volume):');
        console.log('-'.repeat(80));
        newContacts
            .sort((a, b) => b.totalCalls - a.totalCalls)
            .slice(0, 10)
            .forEach((contact, index) => {
                console.log(`${index + 1}. ${contact.name || 'Unknown'} (${contact.phone})`);
                console.log(`   Calls: ${contact.totalCalls}, Duration: ${contact.totalDuration.toFixed(1)} min`);
                console.log(`   First Call: ${contact.firstCall.toDateString()}`);
                console.log('');
            });
        
        // Summary statistics
        console.log('\n📈 SUMMARY STATISTICS:');
        console.log('-'.repeat(40));
        console.log(`Total Call Records: ${Array.from(callData.values()).reduce((sum, data) => sum + data.totalCalls, 0)}`);
        console.log(`Total Call Duration: ${Array.from(callData.values()).reduce((sum, data) => sum + data.totalDuration, 0).toFixed(1)} minutes`);
        console.log(`Average Calls per Contact: ${(Array.from(callData.values()).reduce((sum, data) => sum + data.totalCalls, 0) / callData.size).toFixed(1)}`);
        
        console.log('\n✅ Analysis complete!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the analysis
main();
