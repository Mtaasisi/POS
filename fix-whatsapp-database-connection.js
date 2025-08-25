#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixWhatsAppDatabaseConnection() {
  console.log('🔧 Fixing WhatsApp Database Connection...\n');

  try {
    // Step 1: Test current database connection
    console.log('📋 Step 1: Testing current database connection...');
    
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'whatsapp.%')
      .limit(1);

    if (testError) {
      console.log(`❌ Database connection test failed: ${testError.message}`);
    } else {
      console.log(`✅ Database connection test passed: Found ${testData?.length || 0} settings`);
    }

    // Step 2: Get the correct database password from Supabase
    console.log('\n📋 Step 2: Getting database connection details...');
    
    // Extract database host from Supabase URL
    const hostMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const dbHost = hostMatch ? `${hostMatch[1]}.supabase.co` : 'db.jxhzveborezjhsmzsgbc.supabase.co';
    
    console.log(`   Database Host: ${dbHost}`);
    console.log(`   Database Port: 5432`);
    console.log(`   Database Name: postgres`);
    console.log(`   Database User: postgres`);
    console.log(`   ⚠️  You need to get the database password from your Supabase dashboard`);

    // Step 3: Update the .env file with correct database configuration
    console.log('\n📋 Step 3: Updating .env file...');
    
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update database configuration
    const dbConfigUpdates = {
      'SUPABASE_DB_HOST': dbHost,
      'SUPABASE_DB_PORT': '5432',
      'SUPABASE_DB_NAME': 'postgres',
      'SUPABASE_DB_USER': 'postgres'
    };

    for (const [key, value] of Object.entries(dbConfigUpdates)) {
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    // Add a note about the password
    if (!envContent.includes('SUPABASE_DB_PASSWORD=')) {
      envContent += '\nSUPABASE_DB_PASSWORD=your_database_password_here';
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with database configuration');

    // Step 4: Create a PHP test script to verify database connection
    console.log('\n📋 Step 4: Creating database connection test script...');
    
    const phpTestScript = `<?php
/**
 * Database Connection Test for WhatsApp Proxy
 * This script tests the database connection using the same configuration as the WhatsApp proxy
 */

// Load environment variables
function loadEnvFile($path) {
    if (!file_exists($path)) {
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) {
            continue; // Skip comments
        }
        
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }
            
            if (!getenv($key)) {
                putenv("$key=$value");
            }
        }
    }
    return true;
}

// Load .env file
loadEnvFile(__DIR__ . '/.env');

// Database connection function (same as WhatsApp proxy)
function getDatabaseConnection() {
    $host = getenv('SUPABASE_DB_HOST') ?: 'db.jxhzveborezjhsmzsgbc.supabase.co';
    $port = getenv('SUPABASE_DB_PORT') ?: '5432';
    $database = getenv('SUPABASE_DB_NAME') ?: 'postgres';
    $username = getenv('SUPABASE_DB_USER') ?: 'postgres';
    $password = getenv('SUPABASE_DB_PASSWORD') ?: '';
    
    echo "Testing database connection with:\\n";
    echo "Host: $host\\n";
    echo "Port: $port\\n";
    echo "Database: $database\\n";
    echo "Username: $username\\n";
    echo "Password: " . (empty($password) ? 'NOT SET' : 'SET') . "\\n\\n";
    
    try {
        $dsn = "pgsql:host=$host;port=$port;dbname=$database;sslmode=require";
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        
        echo "✅ Database connection successful!\\n";
        
        // Test query
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM settings WHERE key LIKE 'whatsapp.%'");
        $stmt->execute();
        $result = $stmt->fetch();
        
        echo "✅ Test query successful: Found {$result['count']} WhatsApp settings\\n";
        
        return $pdo;
    } catch (PDOException $e) {
        echo "❌ Database connection failed: " . $e->getMessage() . "\\n";
        return null;
    }
}

// Run the test
getDatabaseConnection();
`;

    fs.writeFileSync('test-database-connection.php', phpTestScript);
    console.log('✅ Created test-database-connection.php');

    // Step 5: Create instructions for getting the database password
    console.log('\n📋 Step 5: Creating setup instructions...');
    
    const instructions = `# WhatsApp Database Connection Setup

## Current Status
✅ Database configuration updated in .env file
✅ PHP test script created

## Next Steps

### 1. Get Database Password from Supabase
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: jxhzveborezjhsmzsgbc
3. Go to Settings > Database
4. Find the "Connection string" section
5. Copy the password from the connection string (it's after "password=" and before "@")

### 2. Update .env File
Replace this line in your .env file:
\`\`\`
SUPABASE_DB_PASSWORD=your_database_password_here
\`\`\`

With your actual password:
\`\`\`
SUPABASE_DB_PASSWORD=your_actual_password_here
\`\`\`

### 3. Test Database Connection
Run this command to test the database connection:
\`\`\`
php test-database-connection.php
\`\`\`

### 4. Test WhatsApp Proxy
After fixing the database connection, test the WhatsApp proxy:
\`\`\`
node test-whatsapp-proxy.js
\`\`\`

## Troubleshooting

### If database connection fails:
1. Make sure you copied the correct password
2. Check that your IP is allowed in Supabase (Settings > Database > Connection pooling)
3. Try using the connection string format instead

### If WhatsApp proxy still fails:
1. Make sure you have GreenAPI credentials configured
2. Check the application settings for WhatsApp configuration
3. Verify the database has the required settings table
`;

    fs.writeFileSync('WHATSAPP_DATABASE_SETUP.md', instructions);
    console.log('✅ Created WHATSAPP_DATABASE_SETUP.md');

    console.log('\n🎯 Database Connection Fix Summary:');
    console.log('=====================================');
    console.log('✅ Updated .env file with correct database configuration');
    console.log('✅ Created database connection test script');
    console.log('✅ Created setup instructions');
    console.log('\n📋 Next Steps:');
    console.log('1. Get your database password from Supabase dashboard');
    console.log('2. Update SUPABASE_DB_PASSWORD in your .env file');
    console.log('3. Run: php test-database-connection.php');
    console.log('4. Run: node test-whatsapp-proxy.js');

  } catch (error) {
    console.error('❌ Error fixing database connection:', error);
  }
}

// Run the fix
fixWhatsAppDatabaseConnection();
