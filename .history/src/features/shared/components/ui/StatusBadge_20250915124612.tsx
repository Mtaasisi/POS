import React from 'react';
import { DeviceStatus } from '../../../types';

interface StatusBadgeProps {
  status: DeviceStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: DeviceStatus) => {
    switch (status) {
      case 'assigned':
        return {
          bg: 'bg-gradient-to-r from-amber-500/80 to-orange-500/80',
          text: 'text-white',
          label: 'Assigned'
        };
      case 'diagnosis-started':
        return {
          bg: 'bg-gradient-to-r from-blue-500/80 to-blue-600/80',
          text: 'text-white',
          label: 'Diagnosis'
        };
      case 'awaiting-parts':
        return {
          bg: 'bg-gradient-to-r from-amber-600/80 to-orange-700/80',
          text: 'text-white',
          label: 'Awaiting Parts'
        };
      case 'in-repair':
        return {
          bg: 'bg-gradient-to-r from-purple-500/80 to-indigo-500/80',
          text: 'text-white',
          label: 'Repairing'
        };
      case 'reassembled-testing':
        return {
          bg: 'bg-gradient-to-r from-cyan-500/80 to-blue-400/80',
          text: 'text-white',
          label: 'Testing'
        };
      case 'repair-complete':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/80 to-green-500/80',
          text: 'text-white',
          label: 'Complete'
        };
      case 'process-payments':
        return {
          bg: 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80',
          text: 'text-white',
          label: 'Process Payments'
        };
      case 'returned-to-customer-care':
        return {
          bg: 'bg-gradient-to-r from-teal-500/80 to-cyan-500/80',
          text: 'text-white',
          label: 'Back to CC'
        };
      case 'done':
        return {
          bg: 'bg-gradient-to-r from-gray-500/80 to-gray-700/80',
          text: 'text-white',
          label: 'Done'
        };
      case 'failed':
        return {
          bg: 'bg-gradient-to-r from-red-500/80 to-pink-500/80',
          text: 'text-white',
          label: 'Failed'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-200/80 to-gray-300/80',
          text: 'text-gray-800',
          label: status
        };
    }
  };

  const { bg, text, label } = getStatusConfig(status);

  return (
    <span className={`
      ${bg} ${text} px-3 py-1 rounded-full text-sm font-medium
      backdrop-blur-xl inline-flex items-center gap-1
      border border-white/20 shadow-sm
      transform transition-all duration-300
      hover:border-white/40 hover:shadow-lg
      whitespace-nowrap
      max-w-[120px] overflow-hidden text-ellipsis
      flex-shrink-0
      ${className}
    `}>
      {label}
    </span>
  );
};

export default StatusBadge;