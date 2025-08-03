import React from 'react';
import GlassButton from '../ui/GlassButton';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ isDark, onToggle, className = '' }) => {
  return (
    <GlassButton
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={`flex items-center gap-2 ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </GlassButton>
  );
};

export default DarkModeToggle; 