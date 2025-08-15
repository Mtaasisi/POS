import React from 'react';

interface ActivityCounterProps {
  count: number;
  className?: string;
  compact?: boolean;
}

const ActivityCounter: React.FC<ActivityCounterProps> = ({ count, className = '', compact = false }) => {
  // Don't render anything if count is 0 or less
  if (count <= 0) return null;
  
  if (compact) {
    return (
      <div className="absolute -top-1 -right-1 z-10">
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white shadow">
          {count > 99 ? '99+' : count}
        </span>
      </div>
    );
  }
  
  return (
    <span className={`
      inline-flex items-center justify-center
      min-w-[20px] h-5 px-1.5
      text-xs font-bold text-white
      bg-red-500 rounded-full
      ${className}
    `}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default ActivityCounter; 