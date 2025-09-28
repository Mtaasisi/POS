#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing syntax errors in chunk files...');

// Fix each chunk file
for (let i = 1; i <= 12; i++) {
    const filename = `update-customers-chunk-${i}.sql`;
    
    if (!fs.existsSync(filename)) {
        console.log(`❌ File ${filename} not found`);
        continue;
    }
    
    console.log(`🔧 Fixing ${filename}...`);
    
    try {
        let content = fs.readFileSync(filename, 'utf8');
        
        // Fix double commas
        content = content.replace(/,,/g, ',');
        
        // Fix trailing commas before closing parenthesis
        content = content.replace(/,\)/g, ')');
        
        // Fix any other comma issues
        content = content.replace(/,\s*,/g, ',');
        
        // Write the fixed content back
        fs.writeFileSync(filename, content);
        
        console.log(`✅ Fixed ${filename}`);
        
    } catch (error) {
        console.error(`❌ Error fixing ${filename}:`, error.message);
    }
}

console.log('🎉 All chunk files fixed!');
console.log('📋 You can now run the chunk files in your SQL editor');
