import React from 'react';

interface ActivityCounterProps {
  count: number;
  className?: string;
  compact?: boolean;
}

const ActivityCounter: React.FC<ActivityCounterProps> = ({ count, className = '', compact = false }) => {
  // Convert count to number and check if it's 0 or less
  const numericCount = typeof count === 'string' ? parseInt(count, 10) : count;
  
  // Don't render anything if count is 0, less than 0, or NaN
  if (numericCount <= 0 || isNaN(numericCount)) return null;
  
  if (compact) {
    return (
      <div className="absolute -top-1 -right-1 z-10">
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white shadow">
          {numericCount > 99 ? '99+' : numericCount}
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
      {numericCount > 99 ? '99+' : numericCount}
    </span>
  );
};

export default ActivityCounter; 