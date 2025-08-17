// Script to fix HTTP 431 "Request Header Fields Too Large" error
// Run this in your browser console to clean up localStorage

console.log('🔧 Starting HTTP 431 error fix...');

// Function to get size of localStorage item
function getItemSize(key) {
  const value = localStorage.getItem(key);
  return value ? new Blob([value]).size : 0;
}

// Function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get all localStorage items and their sizes
const items = [];
let totalSize = 0;

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const size = getItemSize(key);
  items.push({ key, size });
  totalSize += size;
}

// Sort by size (largest first)
items.sort((a, b) => b.size - a.size);

console.log('📊 LocalStorage Analysis:');
console.log(`Total items: ${items.length}`);
console.log(`Total size: ${formatBytes(totalSize)}`);

// Find large items (> 50KB)
const largeItems = items.filter(item => item.size > 50 * 1024);
console.log(`Large items (>50KB): ${largeItems.length}`);

if (largeItems.length > 0) {
  console.log('\n🔍 Large items found:');
  largeItems.forEach(item => {
    console.log(`- ${item.key}: ${formatBytes(item.size)}`);
  });
  
  console.log('\n🧹 Cleaning up large items...');
  
  // Remove large items that might be causing issues
  const itemsToRemove = [
    'supabase.auth.token',
    'repair-app-auth-token',
    'supabase.auth.expires_at',
    'supabase.auth.refresh_token',
    'supabase.auth.access_token',
    'supabase.auth.user',
    'supabase.auth.session'
  ];
  
  itemsToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      const size = getItemSize(key);
      console.log(`Removing ${key} (${formatBytes(size)})`);
      localStorage.removeItem(key);
    }
  });
  
  // Also remove any items larger than 100KB
  largeItems.forEach(item => {
    if (item.size > 100 * 1024) {
      console.log(`Removing very large item ${item.key} (${formatBytes(item.size)})`);
      localStorage.removeItem(item.key);
    }
  });
  
  console.log('✅ Cleanup completed');
} else {
  console.log('✅ No large items found');
}

console.log('\n💡 Recommendations:');
console.log('1. If you still see 431 errors, try clearing all localStorage: localStorage.clear()');
console.log('2. Check browser developer tools Network tab for large request headers');
console.log('3. Consider implementing data compression for large objects');
console.log('4. Refresh the page after cleanup to ensure changes take effect');
