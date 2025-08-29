// ExpectedDeliverySection component - For managing delivery expectations
import React from 'react';
import { Calendar, Clock, Truck, AlertCircle } from 'lucide-react';

interface ExpectedDeliverySectionProps {
  expectedDelivery: string;
  onExpectedDeliveryChange: (date: string) => void;
  supplierLeadTime?: number;
  className?: string;
}

const ExpectedDeliverySection: React.FC<ExpectedDeliverySectionProps> = ({
  expectedDelivery,
  onExpectedDeliveryChange,
  supplierLeadTime,
  className = ''
}) => {
  const today = new Date().toISOString().split('T')[0];
  const recommendedDate = supplierLeadTime 
    ? new Date(Date.now() + supplierLeadTime * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : '';

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expected Delivery Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={expectedDelivery}
            onChange={(e) => onExpectedDeliveryChange(e.target.value)}
            min={today}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {supplierLeadTime && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Clock className="w-4 h-4" />
            <span>Supplier lead time: {supplierLeadTime} days</span>
          </div>
          {recommendedDate && (
            <div className="mt-2">
              <button
                onClick={() => onExpectedDeliveryChange(recommendedDate)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Use recommended date: {new Date(recommendedDate).toLocaleDateString()}
              </button>
            </div>
          )}
        </div>
      )}

      {expectedDelivery && new Date(expectedDelivery) < new Date(today) && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Selected date is in the past</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpectedDeliverySection;