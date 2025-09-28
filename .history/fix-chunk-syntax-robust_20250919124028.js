#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Creating clean chunk files with robust syntax...');

// Read the original large SQL file
const originalContent = fs.readFileSync('update-all-customers-complete.sql', 'utf8');

// Extract the VALUES section
const valuesMatch = originalContent.match(/SELECT \* FROM \(VALUES\n(.*?)\) AS call_data/s);
if (!valuesMatch) {
    console.error('❌ Could not find VALUES section in original file');
    process.exit(1);
}

const valuesContent = valuesMatch[1];

// Split into individual customer lines
const customerLines = valuesContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith('('))
    .map(line => {
        // Remove trailing comma if present
        if (line.endsWith(',')) {
            line = line.slice(0, -1);
        }
        return line;
    });

console.log(`📊 Found ${customerLines.length} customer records`);

// Create chunks
const chunkSize = 1000;
const chunks = [];

for (let i = 0; i < customerLines.length; i += chunkSize) {
    const chunk = customerLines.slice(i, i + chunkSize);
    chunks.push(chunk);
}

console.log(`📦 Created ${chunks.length} chunks`);

// Create clean chunk files
chunks.forEach((chunk, index) => {
    const chunkNumber = index + 1;
    const filename = `update-customers-chunk-${chunkNumber}-clean.sql`;
    
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

    fs.writeFileSync(filename, chunkContent);
    console.log(`✅ Created ${filename} with ${chunk.length} customers`);
});

console.log('🎉 All clean chunk files created!');
console.log('📋 Use the -clean.sql files instead of the original ones');
