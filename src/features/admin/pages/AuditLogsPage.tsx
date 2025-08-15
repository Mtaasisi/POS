import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { auditService, AuditFilter } from '../../../lib/auditService';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import { Download, Filter, Search, Calendar, User, Activity, FileText, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  entityType: 'device' | 'customer' | 'return' | 'user' | 'system';
  entityId: string;
  userId: string;
  userRole: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

const AuditLogsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const auditLogs = await auditService.getAuditLogs(filters);
      setLogs(auditLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = await auditService.exportAuditLogs(filters);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Failed to export audit logs');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'status_change':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'device_created':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'device_updated':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'user_login':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'customer_created':
        return <User className="h-4 w-4 text-green-500" />;
      case 'return_created':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'status_change':
        return 'bg-blue-50 border-blue-200';
      case 'device_created':
        return 'bg-green-50 border-green-200';
      case 'device_updated':
        return 'bg-yellow-50 border-yellow-200';
      case 'user_login':
        return 'bg-purple-50 border-purple-200';
      case 'customer_created':
        return 'bg-green-50 border-green-200';
      case 'return_created':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) {
      return 'No additional details';
    }
    
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      log.entityId.toLowerCase().includes(query) ||
      log.userId.toLowerCase().includes(query) ||
      log.userRole.toLowerCase().includes(query) ||
      formatDetails(log.details).toLowerCase().includes(query)
    );
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
        <p className="text-gray-600">Track all system activities and changes</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <GlassCard className="mb-6 p-4">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="status_change">Status Change</option>
                <option value="device_created">Device Created</option>
                <option value="device_updated">Device Updated</option>
                <option value="user_login">User Login</option>
                <option value="customer_created">Customer Created</option>
                <option value="return_created">Return Created</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={filters.entityType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="device">Device</option>
                <option value="customer">Customer</option>
                <option value="return">Return</option>
                <option value="user">User</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilters({})}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={loadAuditLogs}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </GlassCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <GlassCard className="bg-gradient-to-br from-blue-500/20 to-blue-400/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <Activity className="h-6 w-6 text-blue-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-green-500/20 to-green-400/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => {
                  const today = new Date().toDateString();
                  const logDate = new Date(log.timestamp).toDateString();
                  return logDate === today;
                }).length}
              </p>
            </div>
            <Calendar className="h-6 w-6 text-green-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-purple-500/20 to-purple-400/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(logs.map(log => log.userId)).size}
              </p>
            </div>
            <User className="h-6 w-6 text-purple-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-orange-500/20 to-orange-400/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Filtered</p>
              <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
            </div>
            <Filter className="h-6 w-6 text-orange-500" />
          </div>
        </GlassCard>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No audit logs found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <GlassCard key={log.id} className={`border-l-4 ${getActionColor(log.action)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getActionIcon(log.action)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{log.entityType}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm font-mono text-gray-600">{log.entityId}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{log.userId}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{log.userRole}</span>
                        <span className="mx-2">•</span>
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                        <span className="font-medium">Details:</span> {formatDetails(log.details)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                    {log.ipAddress && (
                      <span>IP: {log.ipAddress}</span>
                    )}
                    {log.userAgent && (
                      <span className="max-w-xs truncate" title={log.userAgent}>
                        UA: {log.userAgent.substring(0, 50)}...
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage; 