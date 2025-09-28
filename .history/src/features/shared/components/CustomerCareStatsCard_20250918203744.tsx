import React, { useState } from 'react';
import { Trophy, UserCheck, Users, ClipboardList, Gift } from 'lucide-react';
import { CARD_COLORS, ANIMATION_DURATIONS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface CustomerCareStatsCardProps {
  currentUser: any;
  checkinStats: Record<string, number>;
  newCustomersToday: any[];
  devicesToday: any[];
  birthdaysThisMonth: any[];
}

const CustomerCareStatsCard: React.FC<CustomerCareStatsCardProps> = ({
  currentUser,
  checkinStats,
  newCustomersToday,
  devicesToday,
  birthdaysThisMonth
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm cursor-pointer transition-all duration-300 ${
        expanded ? 'shadow-lg scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center justify-between gap-5">
        {/* Left: Trophy Icon in circle */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
            <Trophy size={28} className="text-yellow-500" />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{currentUser?.points ?? 0}</span>
            <span className="text-2xl font-bold text-gray-700">Daily points</span>
          </div>
        </div>
        
        {/* Right: Progress Icons Only */}
        <div className="flex gap-4 items-center text-base font-bold">
          <span className="flex items-center gap-1 text-yellow-600">
            <UserCheck size={20} />
            {Object.keys(checkinStats).length}
          </span>
          <span className="flex items-center gap-1 text-blue-600">
            <Users size={20} />
            {newCustomersToday.length}
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <ClipboardList size={20} />
            {devicesToday.length}
          </span>
          <span className="flex items-center gap-1 text-pink-600">
            <Gift size={20} />
            {birthdaysThisMonth.length}
          </span>
        </div>
      </div>
      
      {/* Expandable details */}
      <div className={`overflow-hidden ${ANIMATION_DURATIONS.slow} ${
        expanded ? 'max-h-[400px] mt-4 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Checked In Today */}
          <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-yellow-100">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-2">
              <UserCheck size={28} className="text-yellow-500" />
            </span>
            <span className="text-3xl font-extrabold text-gray-900 mb-1">{Object.keys(checkinStats).length}</span>
            <span className="text-xs font-semibold text-gray-500 mb-2">Checked In</span>
            <div className="w-full h-1 bg-yellow-100 rounded-full overflow-hidden">
              <div 
                className="h-1 bg-yellow-400 rounded-full transition-all duration-1000 animate-progress" 
                style={{ width: `${Math.min(100, Math.round((Object.keys(checkinStats).length / 5) * 100))}%` }} 
              />
            </div>
          </div>
          
          {/* New Customers Today */}
          <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-blue-100">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
              <Users size={28} className="text-blue-500" />
            </span>
            <span className="text-3xl font-extrabold text-gray-900 mb-1">{newCustomersToday.length}</span>
            <span className="text-xs font-semibold text-gray-500 mb-2">New Customers</span>
            <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden">
              <div 
                className="h-1 bg-blue-500 rounded-full transition-all duration-1000 animate-progress" 
                style={{ width: `${Math.min(100, Math.round((newCustomersToday.length / 5) * 100))}%` }} 
              />
            </div>
          </div>
          
          {/* Devices Received Today */}
          <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-green-100">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2">
              <ClipboardList size={28} className="text-green-500" />
            </span>
            <span className="text-3xl font-extrabold text-gray-900 mb-1">{devicesToday.length}</span>
            <span className="text-xs font-semibold text-gray-500 mb-2">Devices Received</span>
            <div className="w-full h-1 bg-green-100 rounded-full overflow-hidden">
              <div 
                className="h-1 bg-green-500 rounded-full transition-all duration-1000 animate-progress" 
                style={{ width: `${Math.min(100, Math.round((devicesToday.length / 5) * 100))}%` }} 
              />
            </div>
          </div>
          
          {/* Birthdays This Month */}
          <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-pink-100">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 mb-2">
              <Gift size={28} className="text-pink-500" />
            </span>
            <span className="text-3xl font-extrabold text-gray-900 mb-1">{birthdaysThisMonth.length}</span>
            <span className="text-xs font-semibold text-gray-500 mb-2">Birthdays</span>
            <div className="w-full h-1 bg-pink-100 rounded-full overflow-hidden">
              <div 
                className="h-1 bg-pink-500 rounded-full transition-all duration-1000 animate-progress" 
                style={{ width: `${Math.min(100, Math.round((birthdaysThisMonth.length / 10) * 100))}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCareStatsCard;
