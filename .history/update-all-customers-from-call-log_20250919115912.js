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

// Function to process call log and generate SQL
async function processCallLogAndGenerateSQL() {
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
                
                // Generate SQL
                generateSQL(callData);
                resolve(callData);
            })
            .on('error', reject);
    });
}

// Function to generate SQL for updating customers
function generateSQL(callData) {
    console.log('📝 Generating SQL update script...');
    
    const sqlParts = [];
    
    // Create temporary table
    sqlParts.push('-- Update All Customers from Call Log');
    sqlParts.push('-- This script updates all customers with call log data');
    sqlParts.push('');
    sqlParts.push('-- Step 1: Create temporary table with all call log data');
    sqlParts.push('CREATE TEMP TABLE temp_all_call_log AS');
    sqlParts.push('SELECT * FROM (VALUES');
    
    // Generate VALUES for each phone number
    const values = [];
    for (const [phone, data] of callData) {
        // Get the best name (longest, most descriptive)
        const bestName = Array.from(data.names).sort((a, b) => b.length - a.length)[0] || 'Unknown';
        const cleanBestName = bestName.replace(/'/g, "''"); // Escape single quotes
        
        // Calculate average duration
        const avgDuration = data.totalDuration / data.totalCalls;
        
        // Calculate days span
        const daysSpan = Math.ceil((data.lastCall - data.firstCall) / (1000 * 60 * 60 * 24));
        
        // Determine loyalty level
        const loyaltyLevel = determineLoyaltyLevel(data.totalCalls, data.totalDuration, daysSpan);
        
        // Format datetime
        const firstCall = data.firstCall.toISOString().replace('T', ' ').replace('Z', '+00');
        const lastCall = data.lastCall.toISOString().replace('T', ' ').replace('Z', '+00');
        
        values.push(`('${phone}', '${cleanBestName}', '${firstCall}', '${lastCall}', ${data.totalCalls}, ${data.incomingCalls}, ${data.outgoingCalls}, ${data.missedCalls}, ${data.totalDuration.toFixed(2)}, ${avgDuration.toFixed(2)}, '${loyaltyLevel}')`);
    }
    
    sqlParts.push(values.join(',\n'));
    sqlParts.push(') AS call_data(phone, best_name, first_call_date, last_call_date, total_calls, incoming_calls, outgoing_calls, missed_calls, total_duration_minutes, avg_duration_minutes, loyalty_level);');
    sqlParts.push('');
    
    // Add analysis queries
    sqlParts.push('-- Step 2: Show analysis of call log data');
    sqlParts.push('SELECT \'Call Log Analysis:\' as info, COUNT(*) as unique_phone_numbers FROM temp_all_call_log;');
    sqlParts.push('');
    
    sqlParts.push('-- Step 3: Show loyalty level distribution');
    sqlParts.push('SELECT loyalty_level, COUNT(*) as count FROM temp_all_call_log GROUP BY loyalty_level ORDER BY count DESC;');
    sqlParts.push('');
    
    // Add update query
    sqlParts.push('-- Step 4: Update existing customers with call log data');
    sqlParts.push('UPDATE customers SET');
    sqlParts.push('    name = CASE WHEN customers.name = \'__\' OR customers.name IS NULL OR LENGTH(t.best_name) > LENGTH(customers.name) THEN t.best_name ELSE customers.name END,');
    sqlParts.push('    created_at = COALESCE(t.first_call_date::timestamp, customers.created_at),');
    sqlParts.push('    total_calls = t.total_calls,');
    sqlParts.push('    total_call_duration_minutes = t.total_duration_minutes,');
    sqlParts.push('    incoming_calls = t.incoming_calls,');
    sqlParts.push('    outgoing_calls = t.outgoing_calls,');
    sqlParts.push('    missed_calls = t.missed_calls,');
    sqlParts.push('    avg_call_duration_minutes = t.avg_duration_minutes,');
    sqlParts.push('    first_call_date = t.first_call_date::timestamp,');
    sqlParts.push('    last_call_date = t.last_call_date::timestamp,');
    sqlParts.push('    call_loyalty_level = t.loyalty_level,');
    sqlParts.push('    last_visit = t.last_call_date::timestamp,');
    sqlParts.push('    updated_at = NOW()');
    sqlParts.push('FROM temp_all_call_log t');
    sqlParts.push('WHERE customers.phone = t.phone;');
    sqlParts.push('');
    
    sqlParts.push('-- Step 5: Show updated customers count');
    sqlParts.push('SELECT \'Updated customers:\' as info, COUNT(*) as count FROM customers WHERE updated_at > NOW() - INTERVAL \'1 minute\';');
    sqlParts.push('');
    
    sqlParts.push('-- Step 6: Show loyalty level distribution after update');
    sqlParts.push('SELECT \'Loyalty level distribution:\' as info, call_loyalty_level, COUNT(*) as customer_count FROM customers WHERE call_loyalty_level IS NOT NULL GROUP BY call_loyalty_level ORDER BY customer_count DESC;');
    sqlParts.push('');
    
    sqlParts.push('-- Step 7: Show top customers by call activity');
    sqlParts.push('SELECT \'Top customers by call activity:\' as info, name, phone, total_calls, ROUND(total_call_duration_minutes, 1) as total_duration_minutes, call_loyalty_level FROM customers WHERE total_calls > 0 ORDER BY total_calls DESC, total_call_duration_minutes DESC LIMIT 20;');
    
    // Write to file
    const sqlContent = sqlParts.join('\n');
    const outputFile = '/Users/mtaasisi/Desktop/LATS CHANCE copy/update-all-customers-complete.sql';
    
    fs.writeFileSync(outputFile, sqlContent);
    console.log(`✅ SQL file generated: ${outputFile}`);
    console.log(`📊 Total customers to update: ${callData.size}`);
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting complete customer update from call log...\n');
        
        // Process call log and generate SQL
        await processCallLogAndGenerateSQL();
        
        console.log('\n✅ Complete customer update SQL generated!');
        console.log('\n📋 Next steps:');
        console.log('1. Run the generated SQL file: update-all-customers-complete.sql');
        console.log('2. This will update all customers with call log data');
        console.log('3. Check the results with the analysis queries');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the analysis
main();
