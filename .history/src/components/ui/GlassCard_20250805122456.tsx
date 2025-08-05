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
        backdrop-blur-xl rounded-xl 
        border shadow-lg 
        p-4 sm:p-6 transition-all duration-300 
        hover:shadow-xl
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.7))',
        borderColor: 'var(--card-border, rgba(255, 255, 255, 0.3))',
        boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;