import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { 
  Smartphone, 
  Wrench, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import RepairStatusDisplay from './RepairStatusDisplay';
import RepairStatusUpdater from './RepairStatusUpdater';
import RepairStatusHistory from './RepairStatusHistory';

interface RepairStatusDashboardProps {
  device: Device;
  currentUser: any;
  onStatusUpdate: (newStatus: DeviceStatus, notes?: string) => Promise<void>;
  onRefresh?: () => void;
  showHistory?: boolean;
  showUpdater?: boolean;
}

const RepairStatusDashboard: React.FC<RepairStatusDashboardProps> = ({
  device,
  currentUser,
  onStatusUpdate,
  onRefresh,
  showHistory = true,
  showUpdater = true
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'updates'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusStats = () => {
    const statusCounts: { [key: string]: number } = {
      'assigned': 0,
      'diagnosis-started': 0,
      'awaiting-parts': 0,
      'in-repair': 0,
      'reassembled-testing': 0,
      'repair-complete': 0,
      'returned-to-customer-care': 0,
      'done': 0,
      'failed': 0
    };

    // This would typically come from a devices context or API
    // For now, we'll just show the current device's status
    statusCounts[device.status] = 1;

    return statusCounts;
  };

  const getStatusIcon = (status: DeviceStatus) => {
    switch (status) {
      case 'assigned': return <Users className="w-4 h-4" />;
      case 'diagnosis-started': return <Clock className="w-4 h-4" />;
      case 'awaiting-parts': return <AlertTriangle className="w-4 h-4" />;
      case 'in-repair': return <Wrench className="w-4 h-4" />;
      case 'reassembled-testing': return <CheckCircle className="w-4 h-4" />;
      case 'repair-complete': return <CheckCircle className="w-4 h-4" />;
      case 'returned-to-customer-care': return <Users className="w-4 h-4" />;
      case 'done': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Smartphone className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'diagnosis-started': return 'text-yellow-600 bg-yellow-100';
      case 'awaiting-parts': return 'text-orange-600 bg-orange-100';
      case 'in-repair': return 'text-purple-600 bg-purple-100';
      case 'reassembled-testing': return 'text-indigo-600 bg-indigo-100';
      case 'repair-complete': return 'text-green-600 bg-green-100';
      case 'returned-to-customer-care': return 'text-teal-600 bg-teal-100';
      case 'done': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (startDate: string): string => {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
    { id: 'updates', label: 'Updates', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getStatusColor(device.status)}`}>
            {getStatusIcon(device.status)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Repair Status Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              {device.brand} {device.model} • {device.status.replace('-', ' ')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onRefresh && (
            <GlassButton
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </GlassButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Display */}
            <RepairStatusDisplay 
              device={device} 
              showTimeline={true}
              showProgress={true}
            />

            {/* Quick Stats */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                    {device.status.replace('-', ' ')}
                  </span>
                </div>
                
                {device.statusUpdatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time in Status</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDuration(device.statusUpdatedAt)}
                    </span>
                  </div>
                )}
                
                {device.assignedTo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Assigned To</span>
                    <span className="text-sm font-medium text-gray-900">
                      {device.assignedTo}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Device ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {device.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'history' && showHistory && (
          <RepairStatusHistory device={device} />
        )}

        {activeTab === 'updates' && showUpdater && (
          <RepairStatusUpdater
            device={device}
            currentUser={currentUser}
            onStatusUpdate={onStatusUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default RepairStatusDashboard;
