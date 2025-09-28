#!/usr/bin/env node

const fs = require('fs');

// Read the large SQL file
const sqlContent = fs.readFileSync('update-all-customers-complete.sql', 'utf8');

// Split into chunks
const lines = sqlContent.split('\n');
const chunkSize = 1000; // 1000 customers per chunk
const chunks = [];

let currentChunk = [];
let customerCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header lines
    if (line.startsWith('--') || line.startsWith('CREATE TEMP TABLE') || line.startsWith('SELECT * FROM (VALUES')) {
        continue;
    }
    
    // Skip closing lines
    if (line.startsWith(') AS call_data') || line.startsWith('-- Step 2:') || line.startsWith('-- Step 3:') || line.startsWith('-- Step 4:') || line.startsWith('-- Step 5:') || line.startsWith('-- Step 6:') || line.startsWith('-- Step 7:')) {
        break;
    }
    
    // If it's a customer data line
    if (line.includes('+255') && line.includes(',')) {
        currentChunk.push(line);
        customerCount++;
        
        // When chunk is full, save it
        if (currentChunk.length >= chunkSize) {
            chunks.push([...currentChunk]);
            currentChunk = [];
        }
    }
}

// Add remaining customers
if (currentChunk.length > 0) {
    chunks.push(currentChunk);
}

console.log(`📊 Created ${chunks.length} chunks with ${customerCount} total customers`);

// Create chunk files
chunks.forEach((chunk, index) => {
    const chunkNumber = index + 1;
    const chunkContent = `-- Update Customers from Call Log - Chunk ${chunkNumber}
-- This chunk contains ${chunk.length} customers

-- Step 1: Create temporary table with call log data
CREATE TEMP TABLE temp_call_log_chunk_${chunkNumber} AS
SELECT * FROM (VALUES
${chunk.join(',\n')}
) AS call_data(phone, best_name, first_call_date, last_call_date, total_calls, incoming_calls, outgoing_calls, missed_calls, total_duration_minutes, avg_duration_minutes, loyalty_level);

-- Step 2: Update existing customers
UPDATE customers SET
    name = CASE WHEN customers.name = '__' OR customers.name IS NULL OR LENGTH(t.best_name) > LENGTH(customers.name) THEN t.best_name ELSE customers.name END,
    created_at = COALESCE(t.first_call_date::timestamp, customers.created_at),
    total_calls = t.total_calls,
    total_call_duration_minutes = t.total_duration_minutes,
    incoming_calls = t.incoming_calls,
    outgoing_calls = t.outgoing_calls,
    missed_calls = t.missed_calls,
    avg_call_duration_minutes = t.avg_duration_minutes,
    first_call_date = t.first_call_date::timestamp,
    last_call_date = t.last_call_date::timestamp,
    call_loyalty_level = t.loyalty_level,
    last_visit = t.last_call_date::timestamp,
    updated_at = NOW()
FROM temp_call_log_chunk_${chunkNumber} t
WHERE customers.phone = t.phone;

-- Step 3: Show results for this chunk
SELECT 
    'Chunk ${chunkNumber} Results:' as info,
    COUNT(*) as customers_updated
FROM customers 
WHERE updated_at > NOW() - INTERVAL '1 minute';

-- Step 4: Drop temporary table
DROP TABLE temp_call_log_chunk_${chunkNumber};
`;

    const filename = `update-customers-chunk-${chunkNumber}.sql`;
    fs.writeFileSync(filename, chunkContent);
    console.log(`✅ Created ${filename} with ${chunk.length} customers`);
});

console.log(`\n🎉 Created ${chunks.length} chunk files!`);
console.log(`📋 Run them in order: update-customers-chunk-1.sql, update-customers-chunk-2.sql, etc.`);
