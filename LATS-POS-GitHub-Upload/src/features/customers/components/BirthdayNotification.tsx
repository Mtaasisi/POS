import React from 'react';
import { Gift, X, Bell } from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Customer } from '../../../types';

interface BirthdayNotificationProps {
  todaysBirthdays: Customer[];
  onClose?: () => void;
  onViewCustomers?: () => void;
}

const BirthdayNotification: React.FC<BirthdayNotificationProps> = ({
  todaysBirthdays,
  onClose,
  onViewCustomers
}) => {
  if (todaysBirthdays.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 bottom-4 sm:bottom-auto z-[9999] w-80 sm:w-96 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <GlassCard className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-pink-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-pink-900">
                🎉 Birthday Alert!
              </h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-pink-500 hover:text-pink-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className="text-sm text-pink-800 mb-3">
              {todaysBirthdays.length} customer{todaysBirthdays.length > 1 ? 's' : ''} celebrating their birthday today!
            </p>
            
            <div className="space-y-2 mb-4">
              {todaysBirthdays.slice(0, 3).map((customer) => (
                <div key={customer.id} className="flex items-center gap-2 text-xs p-2 bg-white/50 rounded-lg">
                  <div className="w-6 h-6 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-700 font-medium text-xs">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-pink-800 font-medium truncate block">{customer.name}</span>
                    {customer.phone && (
                      <span className="text-pink-600 text-xs block truncate">{customer.phone}</span>
                    )}
                  </div>
                  {customer.loyaltyLevel && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      customer.loyaltyLevel === 'platinum' ? 'bg-purple-100 text-purple-700' :
                      customer.loyaltyLevel === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                      customer.loyaltyLevel === 'silver' ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {customer.loyaltyLevel}
                    </span>
                  )}
                </div>
              ))}
              {todaysBirthdays.length > 3 && (
                <div className="text-xs text-pink-600 font-medium text-center py-2 bg-pink-100/50 rounded-lg">
                  +{todaysBirthdays.length - 3} more celebrating today
                </div>
              )}
            </div>
            
            {onViewCustomers && (
              <GlassButton
                onClick={onViewCustomers}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm py-3 font-medium"
              >
                <Bell className="w-4 h-4 mr-2" />
                View All Birthday Customers
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default BirthdayNotification;
