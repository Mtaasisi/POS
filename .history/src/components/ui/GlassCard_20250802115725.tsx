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
        backdrop-blur-xl bg-white/10 rounded-xl 
        border border-white/20 shadow-lg 
        p-4 sm:p-6 transition-all duration-300 
        hover:bg-white/15 hover:shadow-xl hover:border-white/30
        hover:backdrop-blur-2xl hover:scale-[1.02]
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;