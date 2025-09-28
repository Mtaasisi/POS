#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing broken lines in chunk files...');

// Get all chunk files
const chunkFiles = fs.readdirSync('.').filter(file => file.startsWith('update-customers-chunk-') && file.endsWith('.sql'));

chunkFiles.forEach(filename => {
    console.log(`Fixing ${filename}...`);
    
    let content = fs.readFileSync(filename, 'utf8');
    
    // Find the VALUES section
    const valuesStart = content.indexOf('SELECT * FROM (VALUES');
    const valuesEnd = content.indexOf(') AS call_data');
    
    if (valuesStart === -1 || valuesEnd === -1) {
        console.log(`❌ Could not find VALUES section in ${filename}`);
        return;
    }
    
    // Extract the VALUES content
    const beforeValues = content.substring(0, valuesStart + 'SELECT * FROM (VALUES'.length);
    const valuesContent = content.substring(valuesStart + 'SELECT * FROM (VALUES'.length, valuesEnd);
    const afterValues = content.substring(valuesEnd);
    
    // Split into lines and filter out broken lines
    const lines = valuesContent.split('\n').map(line => line.trim()).filter(line => {
        // Only keep lines that look like complete customer records
        return line.length > 0 && 
               line.startsWith('(') && 
               line.includes("', '") && 
               line.includes("'Silver')") || 
               line.includes("'Gold')") || 
               line.includes("'Bronze')") || 
               line.includes("'Basic')") || 
               line.includes("'New')") || 
               line.includes("'VIP')");
    });
    
    // Add commas between lines (except the last one)
    const fixedLines = lines.map((line, index) => {
        if (index === lines.length - 1) {
            return line; // Last line doesn't get a comma
        } else {
            return line + ',';
        }
    });
    
    // Reconstruct the content
    const fixedContent = beforeValues + '\n' + fixedLines.join('\n') + '\n' + afterValues;
    
    // Write back to file
    fs.writeFileSync(filename, fixedContent);
    console.log(`✅ Fixed ${filename} - kept ${lines.length} valid records`);
});

console.log('🎉 All chunk files fixed!');
