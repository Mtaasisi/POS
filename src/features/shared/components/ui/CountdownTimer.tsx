import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  estimatedHours?: number;
  variant?: 'card' | 'detail';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, estimatedHours, variant = 'card' }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isOverdue, setIsOverdue] = useState(false);
  const [isOverEstimated, setIsOverEstimated] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      let difference;
      let isOver = false;
      
      if (estimatedHours) {
        // Calculate remaining time based on estimated hours
        const estimatedMs = estimatedHours * 60 * 60 * 1000;
        const startTime = new Date().getTime();
        difference = estimatedMs;
        isOver = false;
      } else {
        // Fallback to using target date
        difference = new Date(targetDate).getTime() - new Date().getTime();
        // Overdue only when 1 hour or less remains
        isOver = difference <= 60 * 60 * 1000 && difference > 0;
        // If time is past, always overdue
        if (difference < 0) isOver = true;
      }
      
      setIsOverdue(isOver);
      const absoluteDiff = Math.abs(difference);
      
      return {
        days: Math.floor(absoluteDiff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((absoluteDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((absoluteDiff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((absoluteDiff % (1000 * 60)) / 1000)
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, estimatedHours]);

  if (variant === 'detail') {
    return (
      <div className={`
        flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br backdrop-blur-xl
        ${isOverdue 
          ? 'from-rose-500/30 to-rose-400/20 border border-white/20 hover:border-rose-200/40' 
          : 'from-emerald-500/30 to-emerald-400/20 border border-white/20 hover:border-emerald-200/40'
        }
        transition-all duration-300 hover:shadow-lg
      `}>
        <Clock 
          size={24} 
          className={isOverdue ? 'text-rose-500' : 'text-emerald-500'} 
        />
        <span className="font-semibold text-xl">
          {estimatedHours ? 'Estimated time: ' : isOverdue ? 'Overdue by: ' : 'Time remaining: '}
        </span>
        <div className="flex items-center gap-2 font-mono text-xl">
          {timeLeft.days > 0 && (
            <span className="font-bold">
              {timeLeft.days}d
            </span>
          )}
          <span className="font-bold">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      flex items-center gap-2 text-base font-medium p-2 rounded-lg
      backdrop-blur-xl border border-white/20
      ${isOverdue 
        ? 'bg-gradient-to-r from-rose-500/20 to-rose-400/10 hover:border-rose-200/30' 
        : 'bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:border-amber-200/30'
      }
      transition-all duration-300 hover:shadow-md
      ${isOverdue ? 'text-rose-600' : 'text-gray-600'}
    `}>
      <Clock
        size={18}
        className={isOverdue ? 'text-rose-500' : 'text-amber-500'}
      />
      <span className="font-medium">
        {estimatedHours ? 'Est. time: ' : isOverdue ? 'Overdue: ' : 'Due in: '}
      </span>
      <span className="font-mono font-bold">
        {timeLeft.days > 0 && (
          <span className="mr-1">{timeLeft.days}d</span>
        )}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default CountdownTimer;