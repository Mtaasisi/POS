// Quick fix script for console issues
// Run this in your browser console to fix immediate problems

console.log('🔧 Running quick fixes...');

// 1. Fix HTTP 431 errors by cleaning localStorage
function fix431Error() {
  console.log('🧹 Cleaning localStorage to fix HTTP 431 errors...');
  
  const itemsToRemove = [
    'supabase.auth.token',
    'repair-app-auth-token',
    'supabase.auth.expires_at',
    'supabase.auth.refresh_token',
    'supabase.auth.access_token',
    'supabase.auth.user',
    'supabase.auth.session'
  ];
  
  let removedCount = 0;
  itemsToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      removedCount++;
    }
  });
  
  console.log(`✅ Removed ${removedCount} large localStorage items`);
}

// 2. Fix image loading errors
function fixImageErrors() {
  console.log('🖼️ Fixing image loading errors...');
  
  // Replace broken placeholder images with fallback
  const images = document.querySelectorAll('img[src*="via.placeholder.com"]');
  images.forEach(img => {
    const width = img.width || 400;
    const height = img.height || 400;
    const fallbackSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dy=".3em">
          Image
        </text>
      </svg>
    `;
    img.src = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
    img.alt = 'Image placeholder';
  });
  
  console.log(`✅ Fixed ${images.length} broken images`);
}

// 3. Reduce console spam from real-time connections
function reduceConsoleSpam() {
  console.log('🔇 Reducing console spam...');
  
  // Override console methods to filter out real-time spam
  const originalLog = console.log;
  const originalWarn = console.warn;
  
  const spamPatterns = [
    'Connection cooldown active',
    'Real-time stock monitoring already',
    'Database connection test',
    'Main subscription status',
    'Real-time stock monitoring connected',
    'Real-time stock monitoring initialized'
  ];
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (!spamPatterns.some(pattern => message.includes(pattern))) {
      originalLog.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (!spamPatterns.some(pattern => message.includes(pattern))) {
      originalWarn.apply(console, args);
    }
  };
  
  console.log('✅ Console spam filtering enabled');
}

// 4. Fix AudioContext issues
function fixAudioContext() {
  console.log('🔊 Fixing AudioContext issues...');
  
  // AudioContext logs are normal - just acknowledge them
  console.log('ℹ️ AudioContext user interaction logs are normal browser behavior');
  console.log('ℹ️ This is a security feature, not an error');
}

// Run all fixes
try {
  fix431Error();
  fixImageErrors();
  reduceConsoleSpam();
  fixAudioContext();
  
  console.log('✅ All quick fixes applied successfully!');
  console.log('💡 Refresh the page to see the improvements');
} catch (error) {
  console.error('❌ Error applying fixes:', error);
}

// Export functions for manual use
window.quickFixes = {
  fix431Error,
  fixImageErrors,
  reduceConsoleSpam,
  fixAudioContext
};
