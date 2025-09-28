import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Gift, Users } from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import { Customer } from '../../../types';

interface BirthdayCalendarProps {
  customers: Customer[];
  onCustomerClick?: (customer: Customer) => void;
}

const BirthdayCalendar: React.FC<BirthdayCalendarProps> = ({
  customers,
  onCustomerClick
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  // Group customers by month
  const birthdaysByMonth = useMemo(() => {
    const grouped: { [key: string]: Customer[] } = {};
    
    customers.forEach(customer => {
      if (!customer.birthMonth || !customer.birthDay) return;
      
      let month: number;
      let day: number;
      
      // Parse month
      if (typeof customer.birthMonth === 'string') {
        if (customer.birthMonth.trim() === '') return;
        
        const numericMonth = parseInt(customer.birthMonth);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          month = numericMonth;
        } else {
          month = monthNames.indexOf(customer.birthMonth.toLowerCase()) + 1;
        }
      } else {
        return;
      }
      
      // Parse day
      if (typeof customer.birthDay === 'string') {
        if (customer.birthDay.trim() === '') return;
        
        const dayMatch = customer.birthDay.match(/^(\d+)/);
        if (dayMatch) {
          day = parseInt(dayMatch[1]);
        } else {
          day = parseInt(customer.birthDay);
        }
      } else {
        day = parseInt(customer.birthDay);
      }
      
      if (month && day) {
        const monthKey = `${month}-${day}`;
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(customer);
      }
    });
    
    return grouped;
  }, [customers]);

  // Get birthdays for a specific month
  const getBirthdaysForMonth = (monthIndex: number) => {
    const monthBirthdays: { day: number; customers: Customer[] }[] = [];
    
    Object.keys(birthdaysByMonth).forEach(key => {
      const [month, day] = key.split('-').map(Number);
      if (month === monthIndex + 1) {
        monthBirthdays.push({
          day,
          customers: birthdaysByMonth[key]
        });
      }
    });
    
    return monthBirthdays.sort((a, b) => a.day - b.day);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthName = (monthIndex: number) => {
    return months[monthIndex];
  };

  const isToday = (day: number, monthIndex: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === monthIndex && today.getFullYear() === currentYear;
  };

  const isPast = (day: number, monthIndex: number) => {
    const today = new Date();
    const birthday = new Date(currentYear, monthIndex, day);
    return birthday < today && !isToday(day, monthIndex);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-pink-600" />
          Birthday Calendar {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentYear(prev => prev - 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-lg font-semibold text-gray-700">{currentYear}</span>
          <button
            onClick={() => setCurrentYear(prev => prev + 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map((_, monthIndex) => {
          const monthBirthdays = getBirthdaysForMonth(monthIndex);
          const daysInMonth = getDaysInMonth(monthIndex, currentYear);
          
          return (
            <GlassCard key={monthIndex} className="p-4">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getMonthName(monthIndex)}
                </h3>
                <p className="text-sm text-gray-600">
                  {monthBirthdays.length} birthday{monthBirthdays.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-xs">
                {/* Day headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center text-gray-500 font-medium py-1">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dayBirthdays = monthBirthdays.find(b => b.day === day);
                  const isCurrentDay = isToday(day, monthIndex);
                  const isPastDay = isPast(day, monthIndex);
                  
                  return (
                    <div
                      key={day}
                      className={`
                        relative p-1 text-center cursor-pointer rounded transition-colors
                        ${isCurrentDay ? 'bg-pink-500 text-white font-bold' : ''}
                        ${isPastDay && !isCurrentDay ? 'text-gray-400' : 'text-gray-700'}
                        ${dayBirthdays ? 'bg-pink-50 hover:bg-pink-100' : 'hover:bg-gray-50'}
                      `}
                      onClick={() => dayBirthdays && onCustomerClick?.(dayBirthdays.customers[0])}
                    >
                      <span className="text-xs">{day}</span>
                      {dayBirthdays && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Birthday list for this month */}
              {monthBirthdays.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="space-y-1">
                    {monthBirthdays.map(({ day, customers }) => (
                      <div key={day} className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 bg-pink-100 rounded-full flex items-center justify-center">
                          <Gift className="w-2 h-2 text-pink-600" />
                        </div>
                        <span className="font-medium text-gray-700">{day}</span>
                        <span className="text-gray-600">
                          {customers.length} customer{customers.length > 1 ? 's' : ''}
                        </span>
                        {isToday(day, monthIndex) && (
                          <span className="text-pink-600 font-medium">Today!</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

export default BirthdayCalendar;
