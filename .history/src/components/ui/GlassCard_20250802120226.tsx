import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`
        backdrop-blur-xl rounded-xl shadow-lg 
        p-4 sm:p-6 transition-all duration-300 
        hover:shadow-xl hover:backdrop-blur-2xl hover:scale-[1.02]
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
        original-theme:bg-white/70 original-theme:border-white/30 original-theme:hover:bg-white/80 original-theme:hover:border-white/40
        dark-theme:bg-white/10 dark-theme:border-white/20 dark-theme:hover:bg-white/15 dark-theme:hover:border-white/30
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;