import React, { useState, useEffect } from 'react';
import { Device } from '../../../types';
import { 
  Clock, 
  User, 
  MessageSquare, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Search
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import { supabase } from '../../../lib/supabaseClient';

interface StatusHistoryEntry {
  id: string;
  deviceId: string;
  status: string;
  previousStatus?: string;
  notes?: string;
  updatedBy: string;
  updatedByName?: string;
  updatedAt: string;
  duration?: number; // Duration in current status (minutes)
}

interface RepairStatusHistoryProps {
  device: Device;
  compact?: boolean;
}

const RepairStatusHistory: React.FC<RepairStatusHistoryProps> = ({
  device,
  compact = false
}) => {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStatusHistory();
  }, [device.id]);

  const loadStatusHistory = async () => {
    setLoading(true);
    try {
      // Get status history from device_remarks table (assuming it stores status changes)
      const { data: remarks, error } = await supabase
        .from('device_remarks')
        .select(`
          id,
          device_id,
          remark,
          created_at,
          created_by,
          users!device_remarks_created_by_fkey (
            name,
            email
          )
        `)
        .eq('device_id', device.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading status history:', error);
        return;
      }

      // Transform remarks into status history entries
      const statusHistory: StatusHistoryEntry[] = remarks?.map((remark, index) => {
        // Try to extract status information from remark text
        const statusMatch = remark.remark.match(/Status changed to: (\w+)/i);
        const previousStatusMatch = remark.remark.match(/from (\w+)/i);
        
        return {
          id: remark.id,
          deviceId: remark.device_id,
          status: statusMatch ? statusMatch[1] : 'unknown',
          previousStatus: previousStatusMatch ? previousStatusMatch[1] : undefined,
          notes: remark.remark,
          updatedBy: remark.created_by,
          updatedByName: remark.users?.name || remark.users?.email || 'Unknown User',
          updatedAt: remark.created_at,
          duration: index > 0 ? calculateDuration(remark.created_at, remarks[index - 1]?.created_at) : undefined
        };
      }) || [];

      setHistory(statusHistory);
    } catch (error) {
      console.error('Error loading status history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startDate: string, endDate?: string): number => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return `${hours}h ${remainingMinutes}m`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'assigned': 'bg-blue-100 text-blue-800',
      'diagnosis-started': 'bg-yellow-100 text-yellow-800',
      'awaiting-parts': 'bg-orange-100 text-orange-800',
      'in-repair': 'bg-purple-100 text-purple-800',
      'reassembled-testing': 'bg-indigo-100 text-indigo-800',
      'repair-complete': 'bg-green-100 text-green-800',
      'returned-to-customer-care': 'bg-teal-100 text-teal-800',
      'done': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredHistory = history.filter(entry => {
    // Filter by status
    if (filter !== 'all' && entry.status !== filter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.updatedByName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <Clock className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading history...</span>
        </div>
      </GlassCard>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Status History</span>
            <span className="text-xs text-gray-500">({history.length})</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expanded && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                    {entry.status.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(entry.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User className="w-3 h-3" />
                  <span>{entry.updatedByName}</span>
                  {entry.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(entry.duration)}</span>
                    </>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-xs text-gray-700 mt-2 line-clamp-2">{entry.notes}</p>
                )}
              </div>
            ))}
            {filteredHistory.length > 5 && (
              <div className="text-center text-xs text-gray-500 py-2">
                +{filteredHistory.length - 5} more entries
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status History
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {expanded && (
          <>
            {/* Filters */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="diagnosis-started">Diagnosis</option>
                <option value="awaiting-parts">Awaiting Parts</option>
                <option value="in-repair">In Repair</option>
                <option value="reassembled-testing">Testing</option>
                <option value="repair-complete">Complete</option>
                <option value="returned-to-customer-care">Customer Care</option>
                <option value="done">Done</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* History List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No status history found</p>
                </div>
              ) : (
                filteredHistory.map((entry, index) => (
                  <div key={entry.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status.replace('-', ' ')}
                        </span>
                        {entry.previousStatus && (
                          <>
                            <span className="text-gray-400">from</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.previousStatus)}`}>
                              {entry.previousStatus.replace('-', ' ')}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(entry.updatedAt)}
                        </div>
                        {entry.duration && (
                          <div className="text-xs text-gray-500">
                            Duration: {formatDuration(entry.duration)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>{entry.updatedByName}</span>
                    </div>
                    
                    {entry.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{entry.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default RepairStatusHistory;
