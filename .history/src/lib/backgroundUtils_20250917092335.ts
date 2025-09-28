// Background/Wallpaper utility functions

export interface WallpaperOption {
  id: string;
  name: string;
  cssClass: string;
  preview: string;
}

export const wallpaperOptions: WallpaperOption[] = [
  {
    id: 'default',
    name: 'Default',
    cssClass: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    preview: 'linear-gradient(135deg, #ebf8ff 0%, #e0e7ff 100%)'
  },
  {
    id: 's-curve-red-blue',
    name: 'S-Curve Red & Blue',
    cssClass: 'wallpaper-s-curve-red-blue',
    preview: 'linear-gradient(135deg, #ff4757 0%, #00d2d3 100%)'
  },
  {
    id: 'warm-gradient',
    name: 'Warm Gradient',
    cssClass: 'wallpaper-warm-gradient',
    preview: 'linear-gradient(135deg, #ff6b35 0%, #f0f8ff 100%)'
  },
  {
    id: 'cool-gradient',
    name: 'Cool Gradient',
    cssClass: 'wallpaper-cool-gradient',
    preview: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    cssClass: 'wallpaper-sunset',
    preview: 'linear-gradient(135deg, #ff9a9e 0%, #ffafbd 100%)'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    cssClass: 'wallpaper-ocean',
    preview: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)'
  },
  {
    id: 'forest',
    name: 'Forest',
    cssClass: 'wallpaper-forest',
    preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)'
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    cssClass: 'wallpaper-dark-mode',
    preview: 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    cssClass: 'wallpaper-minimal',
    preview: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'
  }
];

// Helper function to safely remove CSS classes (handles spaces)
function removeCssClasses(element: HTMLElement, classString: string): void {
  const classes = classString.split(' ').filter(cls => cls.trim() !== '');
  classes.forEach(cls => {
    if (cls.trim()) {
      element.classList.remove(cls.trim());
    }
  });
}

// Helper function to safely add CSS classes (handles spaces)
function addCssClasses(element: HTMLElement, classString: string): void {
  const classes = classString.split(' ').filter(cls => cls.trim() !== '');
  classes.forEach(cls => {
    if (cls.trim()) {
      element.classList.add(cls.trim());
    }
  });
}

// Change wallpaper using CSS classes
export function changeWallpaper(wallpaperId: string): void {
  const wallpaper = wallpaperOptions.find(w => w.id === wallpaperId);
  if (!wallpaper) {
    console.warn(`Wallpaper "${wallpaperId}" not found`);
    return;
  }

  // Remove all wallpaper classes from body
  wallpaperOptions.forEach(w => {
    removeCssClasses(document.body, w.cssClass);
  });

  // Add the selected wallpaper class
  addCssClasses(document.body, wallpaper.cssClass);
  
  // Save to localStorage
  localStorage.setItem('selectedWallpaper', wallpaperId);
  
  console.log(`Wallpaper changed to: ${wallpaper.name}`);
}

// Apply saved wallpaper on app startup
export function applySavedWallpaper(): void {
  const savedWallpaper = localStorage.getItem('selectedWallpaper');
  if (savedWallpaper) {
    changeWallpaper(savedWallpaper);
  } else {
    // Apply default wallpaper
    changeWallpaper('default');
  }
}

// Get current wallpaper ID
export function getCurrentWallpaper(): string {
  const savedWallpaper = localStorage.getItem('selectedWallpaper');
  return savedWallpaper || 'default';
}

// Reset to default wallpaper
export function resetWallpaper(): void {
  changeWallpaper('default');
} 