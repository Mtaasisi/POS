import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Download,
  Printer
} from 'lucide-react';
import { 
  getRequestedSparePartsNames, 
  getSparePartsByStatus 
} from '../services/repairPartsApi';
import { useAuth } from '../../../context/AuthContext';

interface RequestedSparePartsListProps {
  deviceId?: string;
  showDeviceInfo?: boolean;
  compact?: boolean;
}

const RequestedSparePartsList: React.FC<RequestedSparePartsListProps> = ({
  deviceId,
  showDeviceInfo = true,
  compact = false
}) => {
  const [requestedParts, setRequestedParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needed' | 'ordered'>('all');
  const [showDetails, setShowDetails] = useState(!compact);
  const { currentUser } = useAuth();
  
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadRequestedParts();
  }, [deviceId, statusFilter]);

  const loadRequestedParts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (statusFilter === 'all') {
        result = await getRequestedSparePartsNames(deviceId);
      } else {
        result = await getSparePartsByStatus(statusFilter, deviceId);
      }
      
      if (result.ok && result.data) {
        setRequestedParts(result.data);
        console.log('📦 Requested spare parts loaded:', result.data);
        
        // Log the names for easy access
        const partNames = result.data.map(part => part.name);
        console.log('📝 Spare part names:', partNames);
      } else {
        setError(result.message || 'Failed to load requested parts');
      }
    } catch (err) {
      console.error('Error loading requested parts:', err);
      setError('Failed to load requested parts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'needed': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'ordered': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'received': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'used': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'needed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      case 'used': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredParts = requestedParts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.part_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const exportToText = () => {
    const textContent = requestedParts.map(part => 
      `${part.name} (${part.part_number}) - Qty: ${part.quantity_needed} - Status: ${part.status}`
    ).join('\n');
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requested-spare-parts-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading requested spare parts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center text-red-800 font-medium mb-2">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Error loading requested parts
        </div>
        <div className="text-red-600 text-sm mb-3">{error}</div>
        <button 
          onClick={loadRequestedParts}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-semibold">Requested Spare Parts</h3>
              <p className="text-blue-100 text-sm">
                {requestedParts.length} parts {deviceId ? 'for this device' : 'across all devices'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToText}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              title="Export to text file"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={loadRequestedParts}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by part name or number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="needed">Needed</option>
              <option value="ordered">Ordered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parts List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredParts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-1">No requested parts found</h4>
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'No spare parts are currently requested'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredParts.map((part, index) => (
              <div key={part.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(part.status)}
                      <h4 className="font-medium text-gray-900">{part.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(part.status)}`}>
                        {part.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Part Number:</span> {part.part_number} • 
                      <span className="font-medium ml-2">Quantity:</span> {part.quantity_needed}
                    </div>

                    {showDetails && (
                      <div className="text-sm text-gray-500 space-y-1">
                        {part.device_info && showDeviceInfo && (
                          <div>
                            <span className="font-medium">Device:</span> {part.device_info.brand} {part.device_info.model} 
                            {part.device_info.serialNumber && ` (${part.device_info.serialNumber})`}
                          </div>
                        )}
                        {part.spare_part_info && (
                          <div className="flex items-center gap-4">
                            {part.spare_part_info.brand && (
                              <span><span className="font-medium">Brand:</span> {part.spare_part_info.brand}</span>
                            )}
                            {part.spare_part_info.category && (
                              <span><span className="font-medium">Category:</span> {part.spare_part_info.category}</span>
                            )}
                            {part.spare_part_info.location && (
                              <span><span className="font-medium">Location:</span> {part.spare_part_info.location}</span>
                            )}
                            <span><span className="font-medium">Stock:</span> {part.spare_part_info.stock_quantity}</span>
                          </div>
                        )}
                        {part.total_cost && isAdmin && (
                          <div>
                            <span className="font-medium">Total Cost:</span> ${part.total_cost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div>#{index + 1}</div>
                    {part.device_id && (
                      <div className="text-xs mt-1">
                        {part.device_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredParts.length} of {requestedParts.length} requested parts
          </div>
          {compact && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {showDetails ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Show Details
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Console Log for Names */}
      <div className="bg-blue-50 border-t border-blue-200 p-3">
        <div className="text-sm text-blue-800">
          <strong>📝 Part Names (for easy copying):</strong>
          <div className="mt-1 font-mono text-xs bg-white p-2 rounded border">
            {requestedParts.map(part => part.name).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestedSparePartsList;
