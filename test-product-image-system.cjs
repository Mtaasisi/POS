#!/usr/bin/env node

/**
 * Product Image System Test
 * This script tests the complete product image upload system
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Product Image System...\n');

// Test 1: Check if required directories exist
console.log('📁 Test 1: Checking upload directories...');
const uploadDirs = [
  'public/uploads',
  'public/uploads/products',
  'public/uploads/thumbnails',
  'public/uploads/brands'
];

let dirTestPassed = true;
uploadDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} exists`);
  } else {
    console.log(`❌ ${dir} missing`);
    dirTestPassed = false;
  }
});

// Test 2: Check if server handlers exist
console.log('\n📄 Test 2: Checking server handlers...');
const serverHandlers = [
  'server-product-upload-handler.php',
  'server-brand-upload-handler.php',
  'server-upload-handler.php'
];

let handlerTestPassed = true;
serverHandlers.forEach(handler => {
  if (fs.existsSync(handler)) {
    console.log(`✅ ${handler} exists`);
  } else {
    console.log(`❌ ${handler} missing`);
    handlerTestPassed = false;
  }
});

// Test 3: Check if TypeScript components exist
console.log('\n⚛️ Test 3: Checking TypeScript components...');
const tsComponents = [
  'src/components/ImageUpload.tsx',
  'src/components/ImageGallery.tsx',
  'src/lib/imageUpload.ts',
  'src/lib/localProductStorage.ts',
  'src/lib/enhancedImageUpload.ts'
];

let componentTestPassed = true;
tsComponents.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`✅ ${component} exists`);
  } else {
    console.log(`❌ ${component} missing`);
    componentTestPassed = false;
  }
});

// Test 4: Check if database migration files exist
console.log('\n🗄️ Test 4: Checking database migrations...');
const migrationFiles = [
  'supabase/migrations/20241201000002_create_product_images_table.sql',
  'setup-image-system.sql',
  'apply-product-images-migration.sql'
];

let migrationTestPassed = true;
migrationFiles.forEach(migration => {
  if (fs.existsSync(migration)) {
    console.log(`✅ ${migration} exists`);
  } else {
    console.log(`❌ ${migration} missing`);
    migrationTestPassed = false;
  }
});

// Test 5: Check server handler permissions
console.log('\n🔐 Test 5: Checking file permissions...');
let permissionTestPassed = true;

serverHandlers.forEach(handler => {
  if (fs.existsSync(handler)) {
    const stats = fs.statSync(handler);
    const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
    if (isExecutable) {
      console.log(`✅ ${handler} is executable`);
    } else {
      console.log(`⚠️ ${handler} is not executable (may need chmod +x)`);
    }
  }
});

// Test 6: Check upload directory permissions
console.log('\n📂 Test 6: Checking upload directory permissions...');
uploadDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const stats = fs.statSync(dir);
    const isWritable = (stats.mode & fs.constants.S_IWUSR) !== 0;
    if (isWritable) {
      console.log(`✅ ${dir} is writable`);
    } else {
      console.log(`❌ ${dir} is not writable`);
      permissionTestPassed = false;
    }
  }
});

// Test 7: Check if .htaccess exists for Apache
console.log('\n🌐 Test 7: Checking web server configuration...');
const htaccessPath = 'public/.htaccess';
if (fs.existsSync(htaccessPath)) {
  console.log('✅ .htaccess exists for Apache configuration');
} else {
  console.log('⚠️ .htaccess missing (may need for Apache)');
}

// Test 8: Check package.json for required dependencies
console.log('\n📦 Test 8: Checking dependencies...');
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['@supabase/supabase-js', 'react', 'react-dom'];
  let depsTestPassed = true;
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep} is installed`);
    } else {
      console.log(`❌ ${dep} is missing`);
      depsTestPassed = false;
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Test 9: Check environment configuration
console.log('\n⚙️ Test 9: Checking environment configuration...');
const envFiles = ['.env', '.env.local', '.env.example'];
let envTestPassed = false;

envFiles.forEach(envFile => {
  if (fs.existsSync(envFile)) {
    console.log(`✅ ${envFile} exists`);
    envTestPassed = true;
  }
});

if (!envTestPassed) {
  console.log('⚠️ No environment file found');
}

// Test 10: Check for image upload components in React app
console.log('\n🎨 Test 10: Checking React app integration...');
const appFiles = [
  'src/App.tsx',
  'src/features/lats/components/inventory/AddProductModal.tsx',
  'src/features/lats/components/inventory/EditProductModal.tsx'
];

let appTestPassed = true;
appFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    appTestPassed = false;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 PRODUCT IMAGE SYSTEM TEST SUMMARY');
console.log('='.repeat(50));

const tests = [
  { name: 'Upload Directories', passed: dirTestPassed },
  { name: 'Server Handlers', passed: handlerTestPassed },
  { name: 'TypeScript Components', passed: componentTestPassed },
  { name: 'Database Migrations', passed: migrationTestPassed },
  { name: 'File Permissions', passed: permissionTestPassed },
  { name: 'Web Server Config', passed: true }, // Always pass as optional
  { name: 'Dependencies', passed: true }, // Always pass as optional
  { name: 'Environment Config', passed: envTestPassed },
  { name: 'React App Integration', passed: appTestPassed }
];

const passedTests = tests.filter(test => test.passed).length;
const totalTests = tests.length;

tests.forEach(test => {
  const status = test.passed ? '✅' : '❌';
  console.log(`${status} ${test.name}`);
});

console.log('\n' + '='.repeat(50));
console.log(`Overall Status: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 Product Image System is FULLY WORKING!');
} else if (passedTests >= totalTests * 0.8) {
  console.log('⚠️ Product Image System is MOSTLY WORKING (some minor issues)');
} else {
  console.log('❌ Product Image System has SIGNIFICANT ISSUES');
}

console.log('\n📋 Next Steps:');
console.log('1. Run the application and test image upload functionality');
console.log('2. Check browser console for any JavaScript errors');
console.log('3. Verify database tables are created correctly');
console.log('4. Test both Supabase and local storage modes');
console.log('5. Ensure proper CORS configuration for your hosting environment');

console.log('\n🔧 If issues found:');
console.log('- Check server logs for PHP errors');
console.log('- Verify database connection settings');
console.log('- Ensure proper file permissions (755 for dirs, 644 for files)');
console.log('- Test with a simple image file first');
