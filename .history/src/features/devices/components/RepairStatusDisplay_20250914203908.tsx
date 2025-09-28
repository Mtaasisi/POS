import React from 'react';
import { Device, DeviceStatus } from '../../../types';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Stethoscope, 
  Package, 
  TestTube, 
  UserCheck, 
  XCircle,
  ArrowRight,
  Calendar,
  Timer
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import StatusBadge from '../../shared/components/ui/StatusBadge';

interface RepairStatusDisplayProps {
  device: Device;
  showTimeline?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

interface StatusStep {
  status: DeviceStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  order: number;
}

const RepairStatusDisplay: React.FC<RepairStatusDisplayProps> = ({
  device,
  showTimeline = true,
  showProgress = true,
  compact = false
}) => {
  const statusSteps: StatusStep[] = [
    {
      status: 'assigned',
      label: 'Assigned',
      description: 'Device assigned to technician',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      order: 1
    },
    {
      status: 'diagnosis-started',
      label: 'Diagnosis',
      description: 'Diagnosis in progress',
      icon: <Stethoscope className="w-4 h-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      order: 2
    },
    {
      status: 'awaiting-parts',
      label: 'Awaiting Parts',
      description: 'Waiting for replacement parts',
      icon: <Package className="w-4 h-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      order: 3
    },
    {
      status: 'in-repair',
      label: 'In Repair',
      description: 'Repair work in progress',
      icon: <Wrench className="w-4 h-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      order: 4
    },
    {
      status: 'reassembled-testing',
      label: 'Testing',
      description: 'Device reassembled and testing',
      icon: <TestTube className="w-4 h-4" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      order: 5
    },
    {
      status: 'repair-complete',
      label: 'Complete',
      description: 'Repair completed successfully',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      order: 6
    },
    {
      status: 'returned-to-customer-care',
      label: 'Customer Care',
      description: 'Returned to customer care',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      order: 7
    },
    {
      status: 'done',
      label: 'Done',
      description: 'Device picked up by customer',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      order: 8
    },
    {
      status: 'failed',
      label: 'Failed',
      description: 'Repair could not be completed',
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      order: 9
    }
  ];

  const getCurrentStep = (): StatusStep | null => {
    return statusSteps.find(step => step.status === device.status) || null;
  };

  const getProgressPercentage = (): number => {
    const currentStep = getCurrentStep();
    if (!currentStep) return 0;
    
    // Special handling for failed status
    if (device.status === 'failed') return 0;
    
    return (currentStep.order / statusSteps.length) * 100;
  };

  const getCompletedSteps = (): StatusStep[] => {
    const currentStep = getCurrentStep();
    if (!currentStep) return [];
    
    if (device.status === 'failed') return [];
    
    return statusSteps.filter(step => step.order < currentStep.order);
  };

  const getUpcomingSteps = (): StatusStep[] => {
    const currentStep = getCurrentStep();
    if (!currentStep) return statusSteps;
    
    if (device.status === 'failed' || device.status === 'done') return [];
    
    return statusSteps.filter(step => step.order > currentStep.order);
  };

  const formatDuration = (startDate: string, endDate?: string): string => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h`;
  };

  const currentStep = getCurrentStep();
  const completedSteps = getCompletedSteps();
  const upcomingSteps = getUpcomingSteps();
  const progressPercentage = getProgressPercentage();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {currentStep?.icon}
          <span className="text-sm font-medium text-gray-900">
            {currentStep?.label || 'Unknown Status'}
          </span>
        </div>
        {showProgress && (
          <div className="flex-1 max-w-32">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentStep?.bgColor || 'bg-gray-100'}`}>
              <div className={currentStep?.color || 'text-gray-600'}>
                {currentStep?.icon || <Clock className="w-5 h-5" />}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentStep?.label || 'Unknown Status'}
              </h3>
              <p className="text-sm text-gray-600">
                {currentStep?.description || 'Status not recognized'}
              </p>
            </div>
          </div>
          <StatusBadge 
            status={device.status} 
            variant={device.status === 'failed' ? 'error' : 'default'}
          />
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  device.status === 'failed' 
                    ? 'bg-red-500' 
                    : 'bg-gradient-to-r from-blue-500 to-green-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Timeline */}
        {showTimeline && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Repair Timeline
            </h4>
            
            <div className="space-y-3">
              {/* Completed Steps */}
              {completedSteps.map((step, index) => (
                <div key={step.status} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{step.label}</span>
                      <span className="text-xs text-gray-500">Completed</span>
                    </div>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}

              {/* Current Step */}
              {currentStep && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${currentStep.bgColor} rounded-full flex items-center justify-center`}>
                      <div className={currentStep.color}>
                        {currentStep.icon}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{currentStep.label}</span>
                      <span className="text-xs text-blue-600 font-medium">Current</span>
                    </div>
                    <p className="text-xs text-gray-600">{currentStep.description}</p>
                    {device.statusUpdatedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Started {formatDuration(device.statusUpdatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming Steps */}
              {upcomingSteps.slice(0, 3).map((step, index) => (
                <div key={step.status} className="flex items-center gap-3 opacity-60">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">{step.label}</span>
                      <span className="text-xs text-gray-400">Pending</span>
                    </div>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}

              {upcomingSteps.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  +{upcomingSteps.length - 3} more steps
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Duration */}
        {device.statusUpdatedAt && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Time in current status:</span>
              <span className="font-medium text-gray-900">
                {formatDuration(device.statusUpdatedAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default RepairStatusDisplay;
