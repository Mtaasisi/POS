// Simple script to apply S-Curve Red & Blue background
// This can be run in the browser console or integrated into the app

console.log('Applying S-Curve Red & Blue background...');

// Remove all existing wallpaper classes
const wallpaperClasses = [
  'bg-gradient-to-br',
  'from-blue-50',
  'to-indigo-100',
  'wallpaper-s-curve-red-blue',
  'wallpaper-warm-gradient',
  'wallpaper-cool-gradient',
  'wallpaper-sunset',
  'wallpaper-ocean',
  'wallpaper-forest',
  'wallpaper-dark-mode',
  'wallpaper-minimal'
];

// Remove all wallpaper classes from body
wallpaperClasses.forEach(cls => {
  document.body.classList.remove(cls);
});

// Add the S-Curve Red & Blue background class
document.body.classList.add('s-curve-red-blue');

// Save to localStorage
localStorage.setItem('selectedWallpaper', 's-curve-red-blue');

console.log('S-Curve Red & Blue background applied successfully!');
console.log('Background saved to localStorage for persistence.');
