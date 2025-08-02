import React from 'react';
import { Palette, Sun, Moon, Waves, Leaf, Cloud, Sparkles, Settings } from 'lucide-react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

interface SimpleBackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onBackgroundChange: (backgroundClass: string) => void;
  currentBackground?: string;
}

const SimpleBackgroundSelector: React.FC<SimpleBackgroundSelectorProps> = ({
  isOpen,
  onClose,
  onBackgroundChange,
  currentBackground = ''
}) => {
  const backgrounds = [
    {
      id: 'default',
      name: 'Default Blue',
      class: '',
      icon: <Palette size={20} />,
      description: 'Clean blue gradient'
    },
    {
      id: 's-curve-red-blue',
      name: 'S-Curve Red-Blue',
      class: 's-curve-red-blue',
      icon: <Waves size={20} />,
      description: 'Dynamic red-blue blend'
    },
    {
      id: 'warm-gradient',
      name: 'Warm Gradient',
      class: 'warm-gradient',
      icon: <Sun size={20} />,
      description: 'Warm sunset colors'
    },
    {
      id: 'cool-gradient',
      name: 'Cool Gradient',
      class: 'cool-gradient',
      icon: <Cloud size={20} />,
      description: 'Cool purple-blue tones'
    },
    {
      id: 'sunset',
      name: 'Sunset',
      class: 'sunset',
      icon: <Sun size={20} />,
      description: 'Beautiful sunset colors'
    },
    {
      id: 'ocean',
      name: 'Ocean',
      class: 'ocean',
      icon: <Waves size={20} />,
      description: 'Deep ocean blues'
    },
    {
      id: 'forest',
      name: 'Forest',
      class: 'forest',
      icon: <Leaf size={20} />,
      description: 'Natural green tones'
    },
    {
      id: 'animated-gradient',
      name: 'Animated',
      class: 'animated-gradient',
      icon: <Sparkles size={20} />,
      description: 'Moving gradient animation'
    },
    {
      id: 'glass-overlay',
      name: 'Glass Overlay',
      class: 'glass-overlay',
      icon: <Settings size={20} />,
      description: 'Subtle glass morphism'
    },
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      class: 'dark-mode',
      icon: <Moon size={20} />,
      description: 'Dark theme background'
    },
    {
      id: 'admin-wallpaper',
      name: 'Admin Dashboard',
      class: 'admin-wallpaper',
      icon: <Settings size={20} />,
      description: 'Professional admin theme'
    },
    {
      id: 'database-wallpaper',
      name: 'Database Setup',
      class: 'database-wallpaper',
      icon: <Settings size={20} />,
      description: 'Technical setup theme'
    }
  ];

  const handleBackgroundSelect = (background: typeof backgrounds[0]) => {
    onBackgroundChange(background.class);
  };

  const handleReset = () => {
    onBackgroundChange('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Background Selector</h2>
              <p className="text-gray-600">Choose your preferred background wallpaper</p>
            </div>
            <GlassButton
              onClick={onClose}
              className="flex items-center gap-2"
            >
              ✕ Close
            </GlassButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {backgrounds.map((background) => (
              <div
                key={background.id}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300
                  ${currentBackground === background.class
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }
                `}
                onClick={() => handleBackgroundSelect(background)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-blue-600">
                    {background.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{background.name}</h3>
                    <p className="text-sm text-gray-600">{background.description}</p>
                  </div>
                </div>
                
                {/* Background Preview */}
                <div 
                  className={`
                    w-full h-20 rounded-md border border-gray-200
                    ${background.class ? background.class : 'bg-gradient-to-br from-blue-400 to-blue-600'}
                  `}
                />
                
                {currentBackground === background.class && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <GlassButton
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              🔄 Reset to Default
            </GlassButton>
            
            <div className="text-sm text-gray-600">
              Selected: {currentBackground || 'Default Blue'}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SimpleBackgroundSelector; 