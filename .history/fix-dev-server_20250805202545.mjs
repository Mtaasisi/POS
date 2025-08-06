import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧹 Complete development environment reset...');

// Kill any running vite processes
try {
  execSync('pkill -f "vite"', { stdio: 'ignore' });
  console.log('✅ Killed existing Vite processes');
} catch (error) {
  console.log('ℹ️ No existing Vite processes found');
}

// Clear node_modules cache
try {
  execSync('rm -rf node_modules/.vite', { stdio: 'ignore' });
  console.log('✅ Cleared Vite cache');
} catch (error) {
  console.log('ℹ️ No Vite cache to clear');
}

// Clear browser cache instructions
console.log('\n📋 Manual steps to complete the fix:');
console.log('1. Open your browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Application tab');
console.log('4. Click "Clear storage" on the left');
console.log('5. Click "Clear site data"');
console.log('6. Close and reopen your browser');
console.log('7. Navigate to http://localhost:5173');

// Create a simple test page to verify the server is working
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Dev Server Test</title>
</head>
<body>
    <h1>Development Server is Running!</h1>
    <p>If you can see this, the server is working correctly.</p>
    <p><a href="/pos">Go to POS Page</a></p>
    <script>
        console.log('✅ Dev server test page loaded');
    </script>
</body>
</html>
`;

// Write test file
fs.writeFileSync('test-dev-server.html', testHTML);
console.log('\n✅ Created test page at /test-dev-server.html');

console.log('\n🚀 Starting development server...');
console.log('💡 Wait for the server to start, then try:');
console.log('   - http://localhost:5173/test-dev-server.html');
console.log('   - http://localhost:5173/pos');

// Clean up test file after 30 seconds
setTimeout(() => {
  if (fs.existsSync('test-dev-server.html')) {
    fs.unlinkSync('test-dev-server.html');
  }
}, 30000); 