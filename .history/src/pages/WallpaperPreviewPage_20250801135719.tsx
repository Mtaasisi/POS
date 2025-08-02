import React, { useState } from 'react';
import '../styles/wallpapers.css';

const WallpaperPreviewPage: React.FC = () => {
  const [currentWallpaper, setCurrentWallpaper] = useState('default');

  const wallpapers = [
    { id: 'default', name: 'Default Main Background', class: '' },
    { id: 's-curve-red-blue', name: 'S-Curve Red-Blue', class: 's-curve-red-blue' },
    { id: 'warm-gradient', name: 'Warm Gradient', class: 'warm-gradient' },
    { id: 'cool-gradient', name: 'Cool Gradient', class: 'cool-gradient' },
    { id: 'sunset', name: 'Sunset', class: 'sunset' },
    { id: 'ocean', name: 'Ocean', class: 'ocean' },
    { id: 'forest', name: 'Forest', class: 'forest' },
    { id: 'animated-gradient', name: 'Animated Gradient', class: 'animated-gradient' },
    { id: 'dark-mode', name: 'Dark Mode', class: 'dark-mode' },
    { id: 'pos-wallpaper', name: 'POS Page', class: 'pos-wallpaper' },
    { id: 'database-wallpaper', name: 'Database Setup', class: 'database-wallpaper' },
    { id: 'admin-wallpaper', name: 'Admin Dashboard', class: 'admin-wallpaper' },
    { id: 'mobile-wallpaper', name: 'Mobile Optimized', class: 'mobile-wallpaper' },
    { id: 'glass-overlay', name: 'Glass Morphism Overlay', class: 'glass-overlay' },
  ];

  const wallpaperClass = wallpapers.find(w => w.id === currentWallpaper)?.class || '';

  return (
    <div 
      className={`min-h-screen transition-all duration-500 ${wallpaperClass}`}
      style={{
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="glass rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">🎨 Wallpaper Preview</h1>
          <p className="text-white/80 mb-6">Click on any wallpaper to see it applied to the background</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wallpapers.map((wallpaper) => (
              <button
                key={wallpaper.id}
                onClick={() => setCurrentWallpaper(wallpaper.id)}
                className={`p-4 rounded-lg transition-all duration-300 ${
                  currentWallpaper === wallpaper.id
                    ? 'ring-4 ring-white ring-opacity-50 scale-105'
                    : 'hover:scale-105'
                }`}
                style={{
                  background: wallpaper.id === 'default' 
                    ? 'radial-gradient(ellipse at center, #e0f7fa 0%, #b3e5fc 40%, #039be5 80%, #01579b 100%)'
                    : wallpaper.id === 's-curve-red-blue'
                    ? 'radial-gradient(ellipse at 20% 80%, #ff4757 0%, #ff6b6b 25%, #ee5a52 50%, #c44569 75%, #2f3542 100%), radial-gradient(ellipse at 80% 20%, #00d2d3 0%, #00b894 25%, #00a8ff 50%, #0984e3 75%, #0652dd 100%)'
                    : wallpaper.id === 'warm-gradient'
                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 15%, #ffb3ba 30%, #87ceeb 50%, #dda0dd 70%, #e6e6fa 85%, #f0f8ff 100%)'
                    : wallpaper.id === 'cool-gradient'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)'
                    : wallpaper.id === 'sunset'
                    ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 25%, #fecfef 50%, #ffc3a0 75%, #ffafbd 100%)'
                    : wallpaper.id === 'ocean'
                    ? 'linear-gradient(135deg, #667db6 0%, #0082c8 25%, #0082c8 50%, #667db6 75%, #0082c8 100%)'
                    : wallpaper.id === 'forest'
                    ? 'linear-gradient(135deg, #134e5e 0%, #71b280 25%, #71b280 50%, #134e5e 75%, #71b280 100%)'
                    : wallpaper.id === 'animated-gradient'
                    ? 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)'
                    : wallpaper.id === 'dark-mode'
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                    : wallpaper.id === 'pos-wallpaper'
                    ? '#668CB5'
                    : wallpaper.id === 'database-wallpaper'
                    ? 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
                    : wallpaper.id === 'admin-wallpaper'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)'
                    : wallpaper.id === 'mobile-wallpaper'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : wallpaper.id === 'glass-overlay'
                    ? 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)'
                    : 'transparent'
                }}
              >
                <div className="text-center">
                  <div className="text-white font-semibold text-sm">{wallpaper.name}</div>
                  {currentWallpaper === wallpaper.id && (
                    <div className="text-white/80 text-xs mt-1">✓ Active</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Current Wallpaper: {wallpapers.find(w => w.id === currentWallpaper)?.name}</h2>
          <div className="text-white/80">
            <p className="mb-2">This preview shows how the wallpaper looks in your app.</p>
            <p className="mb-4">To use this wallpaper in your app, add the class <code className="bg-white/20 px-2 py-1 rounded">{wallpaperClass || 'default'}</code> to your body element.</p>
            
            <div className="bg-white/10 rounded p-4">
              <h3 className="font-semibold mb-2">CSS Class:</h3>
              <code className="text-sm">{wallpaperClass || 'default (no class needed)'}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallpaperPreviewPage; 