import React from 'react';
import { Palette } from 'lucide-react';
import GlassButton from './GlassButton';

interface BackgroundButtonProps {
  onClick: () => void;
}

const BackgroundButton: React.FC<BackgroundButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 hover:scale-110"
      title="Change Background"
    >
      <Palette size={24} className="text-white" />
    </button>
  );
};

export default BackgroundButton; 