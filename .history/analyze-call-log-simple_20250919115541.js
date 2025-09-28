#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

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

// Function to determine loyalty level
function determineLoyaltyLevel(totalCalls, totalDuration, daysSpan) {
    if (totalCalls >= 100 && totalDuration >= 300) return 'VIP';
    if (totalCalls >= 50 && totalDuration >= 150) return 'Gold';
    if (daysSpan > 2) return 'Silver';
    if (totalCalls === 1) return 'Bronze';
    if (totalCalls >= 5) return 'Basic';
    return 'New';
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

// Function to analyze call data
function analyzeCallData(callData) {
    const loyaltyLevels = {
        VIP: 0,
        Gold: 0,
        Silver: 0,
        Bronze: 0,
        Basic: 0,
        New: 0
    };
    
    const topCustomers = [];
    
    for (const [phone, data] of callData) {
        const bestName = Array.from(data.names).sort((a, b) => b.length - a.length)[0];
        const daysSpan = Math.ceil((data.lastCall - data.firstCall) / (1000 * 60 * 60 * 24));
        const loyaltyLevel = determineLoyaltyLevel(data.totalCalls, data.totalDuration, daysSpan);
        
        loyaltyLevels[loyaltyLevel]++;
        
        topCustomers.push({
            phone,
            name: bestName,
            totalCalls: data.totalCalls,
            totalDuration: data.totalDuration,
            daysSpan,
            loyaltyLevel,
            firstCall: data.firstCall,
            lastCall: data.lastCall
        });
    }
    
    return { loyaltyLevels, topCustomers };
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting call log analysis...\n');
        
        // Process call log
        const callData = await processCallLog();
        
        // Analyze data
        const { loyaltyLevels, topCustomers } = analyzeCallData(callData);
        
        // Display results
        console.log('\n📊 CALL LOG ANALYSIS RESULTS:');
        console.log('='.repeat(50));
        
        console.log(`\n📞 Total Call Records: ${Array.from(callData.values()).reduce((sum, data) => sum + data.totalCalls, 0)}`);
        console.log(`👥 Unique Contacts: ${callData.size}`);
        console.log(`⏱️  Total Duration: ${Array.from(callData.values()).reduce((sum, data) => sum + data.totalDuration, 0).toFixed(1)} minutes`);
        
        // Show loyalty level distribution
        console.log('\n🏆 LOYALTY LEVEL DISTRIBUTION:');
        console.log('-'.repeat(40));
        Object.entries(loyaltyLevels).forEach(([level, count]) => {
            console.log(`${level}: ${count} customers`);
        });
        
        // Show top customers
        console.log('\n🥇 TOP 20 CUSTOMERS (by call volume):');
        console.log('-'.repeat(100));
        topCustomers
            .sort((a, b) => b.totalCalls - a.totalCalls)
            .slice(0, 20)
            .forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.name || 'Unknown'} (${customer.phone})`);
                console.log(`   Calls: ${customer.totalCalls}, Duration: ${customer.totalDuration.toFixed(1)} min, Days: ${customer.daysSpan}, Level: ${customer.loyaltyLevel}`);
                console.log(`   First: ${customer.firstCall.toDateString()}, Last: ${customer.lastCall.toDateString()}`);
                console.log('');
            });
        
        // Show customers by loyalty level
        console.log('\n💎 VIP CUSTOMERS:');
        console.log('-'.repeat(60));
        topCustomers
            .filter(c => c.loyaltyLevel === 'VIP')
            .sort((a, b) => b.totalCalls - a.totalCalls)
            .forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.name || 'Unknown'} (${customer.phone}) - ${customer.totalCalls} calls`);
            });
        
        console.log('\n🥈 GOLD CUSTOMERS:');
        console.log('-'.repeat(60));
        topCustomers
            .filter(c => c.loyaltyLevel === 'Gold')
            .sort((a, b) => b.totalCalls - a.totalCalls)
            .forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.name || 'Unknown'} (${customer.phone}) - ${customer.totalCalls} calls`);
            });
        
        console.log('\n✅ Analysis complete!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the analysis
main();
