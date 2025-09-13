/**
 * ShippingTracker Component
 * 
 * A comprehensive shipping tracking component with debug capabilities.
 * 
 * Debug Features (when debugMode=true):
 * - Real-time debug logging of component state changes
 * - Debug panel with component state, processed values, and logs
 * - Copy to clipboard functionality for shipping data
 * - Download debug data as JSON file
 * - Visual debug controls in both compact and full views
 * 
 * Usage:
 * <ShippingTracker 
 *   shippingInfo={shippingData}
 *   debugMode={process.env.NODE_ENV === 'development'}
 *   onRefresh={handleRefresh}
 * />
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Truck, Package, CheckCircle, Clock, AlertTriangle, MapPin, 
  User, Building, Phone, Mail, ExternalLink, RefreshCw, Eye,
  Bug, Copy, Download, Edit3, PackageCheck
} from 'lucide-react';
import { ShippingInfo, ShippingStatus } from '../../types/inventory';
import GlassCard from '../../../shared/components/ui/GlassCard';
import { toast } from 'react-hot-toast';
import ShippingStatusUpdateModal from './ShippingStatusUpdateModal';
import ProductUpdateModal from './ProductUpdateModal';
import { 
  getAvailableStatuses, 
  STATUS_ICONS, 
  SHIPPING_STATUS_FLOW,
  normalizeStatus
} from '../../utils/shippingStatusFlow';
import { shippingDataService } from '../../services/shippingDataService';
import inventoryService from '../../services/inventoryService';
import { draftProductsService } from '../../services/draftProductsService';

interface ShippingTrackerProps {
  shippingInfo: ShippingInfo;
  onRefresh?: () => void;
  compact?: boolean;
  debugMode?: boolean;
}

const ShippingTracker: React.FC<ShippingTrackerProps> = ({
  shippingInfo,
  onRefresh,
  compact = false,
  debugMode = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(!compact);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showProductUpdateModal, setShowProductUpdateModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const prevShippingInfoRef = useRef<ShippingInfo | null>(null);
  const componentInstanceId = useRef<string>(Math.random().toString(36).substr(2, 9));
  const mountCountRef = useRef<number>(0);
  
  // Debug logging function - only log when debugMode is enabled and in development
  const addDebugLog = useMemo(() => (message: string, data?: any) => {
    if (!debugMode || process.env.NODE_ENV === 'production') return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] [${componentInstanceId.current}] ${message}`;
    
    console.log(`🐛 [ShippingTracker Debug] ${logEntry}`, data || '');
    setDebugLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
  }, [debugMode]);
  
  // Deep comparison function for shipping info
  const isShippingInfoEqual = (a: ShippingInfo | null, b: ShippingInfo | null): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    
    return (
      a.carrier === b.carrier &&
      a.trackingNumber === b.trackingNumber &&
      a.status === b.status &&
      a.method === b.method &&
      a.cost === b.cost &&
      a.notes === b.notes &&
      a.estimatedDelivery === b.estimatedDelivery &&
      a.shippedDate === b.shippedDate &&
      a.deliveredDate === b.deliveredDate &&
      JSON.stringify(a.agent) === JSON.stringify(b.agent) &&
      JSON.stringify(a.manager) === JSON.stringify(b.manager)
    );
  };
  
  // Component mount debug - only log once per component instance
  useEffect(() => {
    mountCountRef.current += 1;
    if (debugMode) {
      addDebugLog(`Component mounted (mount #${mountCountRef.current})`, { 
        compact, 
        debugMode, 
        hasShippingInfo: !!shippingInfo,
        hasOnRefresh: !!onRefresh,
        instanceId: componentInstanceId.current
      });
    }
  }, [addDebugLog, compact, debugMode, shippingInfo, onRefresh]);

  // Only log when shippingInfo actually changes (not on every render)
  useEffect(() => {
    if (shippingInfo && !isShippingInfoEqual(prevShippingInfoRef.current, shippingInfo)) {
      const updateData = {
        carrier: shippingInfo.carrier,
        trackingNumber: shippingInfo.trackingNumber,
        status: shippingInfo.status,
        hasAgent: !!shippingInfo.agent,
        hasManager: !!shippingInfo.manager,
        agentDetails: shippingInfo.agent,
        managerDetails: shippingInfo.manager,
        cost: shippingInfo.cost,
        method: shippingInfo.method,
        notes: shippingInfo.notes,
        instanceId: componentInstanceId.current
      };
      
      // Only log in development mode to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚚 [ShippingTracker] [${componentInstanceId.current}] Shipping info updated:`, updateData);
      }
      
      if (debugMode) {
        addDebugLog('Shipping info updated', updateData);
      }
      
      prevShippingInfoRef.current = shippingInfo;
    }
  }, [shippingInfo, debugMode, addDebugLog]);

  // Cleanup effect to track unmounts
  useEffect(() => {
    return () => {
      if (debugMode) {
        console.log(`🐛 [ShippingTracker Debug] [${componentInstanceId.current}] Component unmounted`);
      }
    };
  }, [debugMode]);
  
  // Safe defaults for potentially undefined values with better fallbacks
  const safeStatus = normalizeStatus(shippingInfo.status || 'pending');
  const safeTrackingNumber = (shippingInfo.trackingNumber && shippingInfo.trackingNumber.trim() !== '') 
    ? shippingInfo.trackingNumber 
    : 'N/A';
  const safeCarrier = shippingInfo.carrier || 'Unknown Carrier';
  const safeMethod = shippingInfo.method || shippingInfo.shippingMethod || 'Standard';
  const safeCost = shippingInfo.cost || shippingInfo.shippingCost || 0;
  
  // Safe defaults for agent and manager - handle missing fields with better fallbacks
  const safeAgentName = shippingInfo.agent?.name || 
                       (typeof shippingInfo.agent === 'string' ? shippingInfo.agent : null) ||
                       'Not Assigned';
  const safeManagerName = shippingInfo.manager?.name || 
                         (typeof shippingInfo.manager === 'string' ? shippingInfo.manager : null) ||
                         'Not Assigned';
  
  // Better handling of dates
  const safeEstimatedDelivery = shippingInfo.estimatedDelivery || '';
  const safeShippedDate = shippingInfo.shippedDate || '';
  const safeDeliveredDate = shippingInfo.deliveredDate || shippingInfo.actualDelivery || '';
  
  // Memoize processed values to prevent unnecessary recalculations
  const processedValues = useMemo(() => ({
    safeStatus,
    safeTrackingNumber,
    safeCarrier,
    safeAgentName,
    safeManagerName,
    safeEstimatedDelivery,
    safeShippedDate,
    safeDeliveredDate
  }), [safeStatus, safeTrackingNumber, safeCarrier, safeAgentName, safeManagerName, safeEstimatedDelivery, safeShippedDate, safeDeliveredDate]);
  
  const notes = shippingInfo.notes || '';

  const handleRefresh = async () => {
    addDebugLog('Refresh button clicked');
    
    if (!onRefresh) {
      const warning = 'No onRefresh function provided';
      console.warn('⚠️ [ShippingTracker]', warning);
      addDebugLog(warning);
      return;
    }
    
    setIsRefreshing(true);
    addDebugLog('Starting refresh process');
    
    try {
      await onRefresh();
      addDebugLog('Refresh completed successfully');
      toast.success('Tracking updated');
    } catch (error) {
      const errorMsg = 'Refresh failed';
      console.error('❌ [ShippingTracker]', errorMsg, error);
      addDebugLog(errorMsg, error);
      toast.error('Failed to update tracking');
    } finally {
      setIsRefreshing(false);
      addDebugLog('Refresh process finished');
    }
  };

  const handleStatusUpdate = async (updateData: any) => {
    if (!shippingInfo.id || shippingInfo.id.trim() === '') {
      toast.error('Shipping ID not found. Please create shipping information first.');
      return;
    }

    // Check if this is a fallback shipping info (not a real shipping record)
    if (shippingInfo.id.startsWith('fallback-')) {
      toast.error('Cannot update status for fallback shipping info. Please create proper shipping information first.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      addDebugLog('Updating shipping status', updateData);
      
      // Handle special status transitions
      if (updateData.status === 'arrived') {
        // Open product update modal after status update
        const result = await shippingDataService.updateShippingStatus(shippingInfo.id, updateData);
        if (result) {
          addDebugLog('Status updated to arrived, opening product update modal');
          setShowProductUpdateModal(true);
        }
      } else if (updateData.status === 'received') {
        // Check if products are validated before receiving
        const validationStatus = await draftProductsService.getShipmentValidationStatus(shippingInfo.id);
        
        if (!validationStatus.isReady) {
          addDebugLog('Products not validated, opening product update modal');
          toast.error(`Products need to be validated first. ${validationStatus.missingProducts} products still need validation. Opening product update modal...`);
          setShowProductUpdateModal(true);
          return; // Don't proceed with status update
        }
        
        // Call inventory service to receive shipment
        // Note: This will also update the shipping status to 'received' internally
        const inventoryResult = await inventoryService.receiveShipment(shippingInfo.id);
        if (inventoryResult.success) {
          addDebugLog('Shipment received into inventory', inventoryResult);
          toast.success(`Shipment received: ${inventoryResult.data?.productsCreated} products created, ${inventoryResult.data?.productsUpdated} products updated`);
        } else {
          throw new Error(inventoryResult.error || 'Failed to receive shipment');
        }
      } else {
        // Regular status update
        const result = await shippingDataService.updateShippingStatus(shippingInfo.id, updateData);
        if (result) {
          addDebugLog('Status update successful', result);
          toast.success(`Status updated to ${updateData.status.replace('_', ' ')}`);
        }
      }
      
      // Refresh the shipping info
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      addDebugLog('Status update failed', error);
      toast.error('Failed to update shipping status');
      console.error('Error updating shipping status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProductsUpdated = async (updatedProducts: any[]) => {
    addDebugLog('Products updated', updatedProducts);
    toast.success(`${updatedProducts.length} products updated successfully`);
    
    // Close the product update modal
    setShowProductUpdateModal(false);
    
    // Refresh shipping info
    if (onRefresh) {
      await onRefresh();
    }
    
    // Trigger a global refresh of product data to update any open product detail pages
    // This ensures that product details pages show the updated information
    window.dispatchEvent(new CustomEvent('productDataUpdated', { 
      detail: { 
        updatedProducts: updatedProducts.map(p => p.id),
        timestamp: new Date().toISOString()
      } 
    }));
  };

  const getStatusColor = (status: string) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'picked_up': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_transit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'exception': return 'bg-red-100 text-red-800 border-red-200';
      case 'arrived': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    const safeStatus = status || 'pending';
    const iconName = STATUS_ICONS[safeStatus as keyof typeof STATUS_ICONS];
    switch (iconName) {
      case 'Clock': return <Clock size={16} />;
      case 'Package': return <Package size={16} />;
      case 'Truck': return <Truck size={16} />;
      case 'MapPin': return <MapPin size={16} />;
      case 'CheckCircle': return <CheckCircle size={16} />;
      case 'AlertTriangle': return <AlertTriangle size={16} />;
      case 'Building': return <Building size={16} />;
      case 'PackageCheck': return <PackageCheck size={16} />;
      default: return <Package size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (status: string) => {
    const safeStatus = status || 'pending';
    const position = SHIPPING_STATUS_FLOW.indexOf(safeStatus as any);
    if (position === -1) return 0; // Exception or unknown status
    
    return Math.round((position / (SHIPPING_STATUS_FLOW.length - 1)) * 100);
  };

  const trackingUrl = (shippingInfo as any).carrier?.trackingUrl?.replace('{tracking_number}', processedValues.safeTrackingNumber) || 
                     `https://www.google.com/search?q=${processedValues.safeCarrier}+tracking+${processedValues.safeTrackingNumber}`;

  // Debug utility functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addDebugLog('Copied to clipboard', { text });
      toast.success('Copied to clipboard');
    }).catch((error) => {
      addDebugLog('Failed to copy to clipboard', error);
      toast.error('Failed to copy');
    });
  };

  const downloadDebugData = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      shippingInfo,
      processedValues,
      debugLogs,
      componentState: {
        isRefreshing,
        showDetails,
        showDebugPanel,
        compact,
        debugMode
      }
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipping-tracker-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addDebugLog('Debug data downloaded');
    toast.success('Debug data downloaded');
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
    addDebugLog('Debug logs cleared');
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(processedValues.safeStatus)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(processedValues.safeStatus)}
                <span className="capitalize">{processedValues.safeStatus.replace('_', ' ')}</span>
              </div>
            </div>
            
            {/* Dynamic Workflow Action Buttons */}
            {(() => {
              const availableStatuses = getAvailableStatuses(
                processedValues.safeStatus as any, 
                shippingInfo.trackingEvents || []
              );
              
              return availableStatuses.map(status => {
                const statusConfig = {
                  'arrived': { 
                    label: 'Mark as Arrived', 
                    description: 'Shipment arrived and ready for product validation',
                    className: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  },
                  'ready_for_inventory': { 
                    label: 'Ready for Inventory', 
                    description: 'Products validated, ready for stock intake',
                    className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                  },
                  'received': { 
                    label: 'Receive to Inventory', 
                    description: 'Shipment received into inventory',
                    className: 'bg-green-100 text-green-700 hover:bg-green-200'
                  },
                  'exception': { 
                    label: 'Report Exception', 
                    description: 'Report delivery exception',
                    className: 'bg-red-100 text-red-700 hover:bg-red-200'
                  }
                };
                
                const config = statusConfig[status as keyof typeof statusConfig];
                if (!config) return null;
                
                return (
                  <button
                    key={status}
                    onClick={() => {
                      if (status === 'ready_for_inventory' as ShippingStatus) {
                        setShowProductUpdateModal(true);
                      } else {
                        handleStatusUpdate({ 
                          status, 
                          description: config.description 
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${config.className}`}
                    disabled={isUpdatingStatus}
                  >
                    {config.label}
                  </button>
                );
              });
            })()}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <div className="flex items-center gap-1">
                <Eye size={14} />
                Details
              </div>
            </button>
            {debugMode && process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                <div className="flex items-center gap-1">
                  <Bug size={14} />
                  Debug [{componentInstanceId.current.slice(0, 4)}]
                </div>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {debugMode && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(shippingInfo, null, 2))}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy shipping info"
              >
                <Copy size={14} />
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{processedValues.safeCarrier}</span>
            <span>{getProgressPercentage(processedValues.safeStatus)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage(processedValues.safeStatus)}%` }}
            />
          </div>
        </div>

        {/* Tracking Number */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tracking: {processedValues.safeTrackingNumber}</span>
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ExternalLink size={12} />
            Track
          </a>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-gray-400" />
              <span className="text-gray-600">Agent:</span>
              <span className="font-medium">{shippingInfo.agent?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building size={14} className="text-gray-400" />
              <span className="text-gray-600">Manager:</span>
              <span className="font-medium">{shippingInfo.manager?.name}</span>
            </div>
            {processedValues.safeEstimatedDelivery && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-600">ETA:</span>
                <span className="font-medium">{formatDate(processedValues.safeEstimatedDelivery)}</span>
              </div>
            )}
          </div>
        )}

        {/* Debug Panel for Compact View */}
        {debugMode && process.env.NODE_ENV === 'development' && showDebugPanel && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-purple-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-purple-900">Debug Info</h5>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(shippingInfo, null, 2))}
                    className="p-1 text-purple-600 hover:text-purple-700"
                    title="Copy data"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={downloadDebugData}
                    className="p-1 text-purple-600 hover:text-purple-700"
                    title="Download debug data"
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div><strong>Status:</strong> {processedValues.safeStatus}</div>
                <div><strong>Carrier:</strong> {processedValues.safeCarrier}</div>
                <div><strong>Tracking:</strong> {processedValues.safeTrackingNumber}</div>
                <div><strong>Agent:</strong> {processedValues.safeAgentName}</div>
                <div><strong>Manager:</strong> {processedValues.safeManagerName}</div>
                <div><strong>Cost:</strong> TZS {safeCost.toLocaleString()}</div>
                <div><strong>Logs:</strong> {debugLogs.length} entries</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassCard className="w-full max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Shipping Tracker</h3>
              <p className="text-gray-600">Track your purchase order delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {debugMode && process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Bug size={16} />
                Debug [{componentInstanceId.current.slice(0, 4)}]
              </button>
            )}
            <button
              onClick={() => setShowStatusUpdateModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              disabled={isUpdatingStatus}
            >
              <Edit3 size={16} />
              Update Status
            </button>
            
            {/* Workflow Action Buttons */}
            {processedValues.safeStatus === 'delivered' && (
              <button
                onClick={() => handleStatusUpdate({ status: 'arrived', description: 'Shipment arrived and ready for product validation' })}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                disabled={isUpdatingStatus}
              >
                <Building size={16} />
                Mark as Arrived
              </button>
            )}
            
            {processedValues.safeStatus === 'arrived' && (
              <button
                onClick={() => setShowProductUpdateModal(true)}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
              >
                <Package size={16} />
                Validate Product Details
              </button>
            )}
            
            {processedValues.safeStatus === 'arrived' && (
              <button
                onClick={() => handleStatusUpdate({ status: 'received', description: 'Shipment received into inventory' })}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                disabled={isUpdatingStatus}
              >
                <CheckCircle size={16} />
                Receive to Inventory
              </button>
            )}
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Track Online
            </a>
            {debugMode && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(shippingInfo, null, 2))}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy shipping info"
              >
                <Copy size={18} />
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Carrier</p>
                <p className="font-semibold text-gray-900">{processedValues.safeCarrier}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Agent</p>
                <p className="font-semibold text-gray-900">{processedValues.safeAgentName}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Building size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Manager</p>
                <p className="font-semibold text-gray-900">{processedValues.safeManagerName}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                processedValues.safeStatus === 'delivered' ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {getStatusIcon(processedValues.safeStatus)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {processedValues.safeStatus.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Progress</h4>
          
          {/* Progress Bar */}
          <div className="relative mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Order Placed</span>
              <span>In Transit</span>
              <span>Delivered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 relative"
                style={{ width: `${getProgressPercentage(processedValues.safeStatus)}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-current rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Status Steps */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { key: 'pending', label: 'pending' },
              { key: 'picked_up', label: 'picked up' },
              { key: 'in_transit', label: 'in transit' },
              { key: 'out_for_delivery', label: 'out for delivery' },
              { key: 'delivered', label: 'delivered' }
            ].map((statusItem, index) => {
              const isComplete = getProgressPercentage(processedValues.safeStatus) > getProgressPercentage(statusItem.key);
              const isCurrent = processedValues.safeStatus === statusItem.key;
              
              return (
                <div
                  key={statusItem.key}
                  className={`p-3 rounded-lg text-center border-2 transition-all ${
                    isComplete || isCurrent
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {getStatusIcon(statusItem.key)}
                  </div>
                  <p className="text-xs font-medium">
                    {statusItem.label}
                  </p>
                  {isCurrent && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracking Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-semibold text-gray-900">Shipping Information</h4>
              {shippingInfo.id.startsWith('fallback-') && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                  Fallback Data
                </span>
              )}
            </div>
            
            {shippingInfo.id.startsWith('fallback-') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Fallback Shipping Data</p>
                    <p className="text-yellow-700 mt-1">
                      This shipping information was created from purchase order data. 
                      To update shipping status, please create proper shipping information first.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tracking Number:</span>
                <span className="font-mono font-medium text-gray-900">{processedValues.safeTrackingNumber}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Delivery:</span>
                <span className="font-medium text-gray-900">
                  {processedValues.safeEstimatedDelivery ? formatDate(processedValues.safeEstimatedDelivery) : 'TBD'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Shipping Cost:</span>
                <span className="font-medium text-gray-900">
                  TZS {shippingInfo.cost?.toLocaleString() || '0'}
                </span>
              </div>
              
              {/* Shipping Origin and Destination */}
              {shippingInfo.shippingOrigin && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Origin:</span>
                  <span className="font-medium text-gray-900">{shippingInfo.shippingOrigin}</span>
                </div>
              )}
              
              {shippingInfo.shippingDestination && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Destination:</span>
                  <span className="font-medium text-gray-900">{shippingInfo.shippingDestination}</span>
                </div>
              )}
              
              {/* Port Information for Sea Shipping */}
              {shippingInfo.portOfLoading && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Port of Loading:</span>
                  <span className="font-medium text-gray-900">{shippingInfo.portOfLoading}</span>
                </div>
              )}
              
              {shippingInfo.portOfDischarge && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Port of Discharge:</span>
                  <span className="font-medium text-gray-900">{shippingInfo.portOfDischarge}</span>
                </div>
              )}
              
              {/* CBM Information */}
              {(shippingInfo as any).totalCBM && (shippingInfo as any).totalCBM > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total CBM:</span>
                  <span className="font-medium text-gray-900">{(shippingInfo as any).totalCBM.toFixed(3)} m³</span>
                </div>
              )}
              
              {shippingInfo.pricePerCBM && shippingInfo.pricePerCBM > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price per CBM:</span>
                  <span className="font-medium text-gray-900">TZS {shippingInfo.pricePerCBM.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Shipping Team</h4>
            
            {/* Agent Info */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{processedValues.safeAgentName}</p>
                  <p className="text-sm text-gray-600">Shipping Agent</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {shippingInfo.agent?.company || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {shippingInfo.agent?.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {shippingInfo.agent?.email || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Manager Info */}
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{processedValues.safeManagerName}</p>
                  <p className="text-sm text-gray-600">Shipping Manager</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {shippingInfo.manager?.department || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {shippingInfo.manager?.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {shippingInfo.manager?.email || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Events */}
        {shippingInfo.trackingEvents && shippingInfo.trackingEvents.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h4>
            
            <div className="space-y-4">
              {shippingInfo.trackingEvents
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 ${
                    index === 0 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 capitalize">
                        {event.status.replace('_', ' ')}
                      </p>
                      <span className="text-sm text-gray-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-1">{event.description}</p>
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">{event.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cargo Boxes Information */}
        {shippingInfo.cargoBoxes && shippingInfo.cargoBoxes.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Cargo Details</h4>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shippingInfo.cargoBoxes.map((box, index) => (
                  <div key={box.id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Box {index + 1}</h5>
                      <span className="text-sm text-gray-500">Qty: {box.quantity}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dimensions:</span>
                        <span className="font-medium text-gray-900">
                          {box.length} × {box.width} × {box.height} cm
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">CBM:</span>
                        <span className="font-medium text-gray-900">
                          {((box.length * box.width * box.height * box.quantity) / 1000000).toFixed(3)} m³
                        </span>
                      </div>
                      
                      {box.description && (
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-gray-600 text-xs">Description:</span>
                          <p className="text-gray-900 text-xs mt-1">{box.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total CBM Summary */}
              {(shippingInfo as any).totalCBM && (shippingInfo as any).totalCBM > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total CBM:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {(shippingInfo as any).totalCBM.toFixed(3)} m³
                    </span>
                  </div>
                  
                  {shippingInfo.pricePerCBM && shippingInfo.pricePerCBM > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-gray-700">CBM Cost:</span>
                      <span className="text-lg font-bold text-green-600">
                        TZS {((shippingInfo as any).totalCBM * shippingInfo.pricePerCBM).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping Notes */}
        <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <h5 className="font-medium text-gray-900 mb-2">Shipping Notes</h5>
          <p className="text-gray-700 text-sm">
            {shippingInfo.notes && shippingInfo.notes.trim() !== '' 
              ? shippingInfo.notes 
              : 'No additional notes'
            }
          </p>
        </div>

        {/* Debug Panel */}
        {debugMode && process.env.NODE_ENV === 'development' && showDebugPanel && (
          <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                <Bug size={20} />
                Debug Panel [{componentInstanceId.current}]
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={clearDebugLogs}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                  Clear Logs
                </button>
                <button
                  onClick={downloadDebugData}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm flex items-center gap-1"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Debug Information */}
              <div className="space-y-4">
                <h5 className="font-medium text-purple-900">Component State</h5>
                <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Instance ID:</span>
                    <span className="font-mono">{componentInstanceId.current}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mount Count:</span>
                    <span className="font-mono">{mountCountRef.current}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compact Mode:</span>
                    <span className="font-mono">{compact.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Debug Mode:</span>
                    <span className="font-mono">{debugMode.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Is Refreshing:</span>
                    <span className="font-mono">{isRefreshing.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Show Details:</span>
                    <span className="font-mono">{showDetails.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Show Debug Panel:</span>
                    <span className="font-mono">{showDebugPanel.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Has onRefresh:</span>
                    <span className="font-mono">{!!onRefresh}</span>
                  </div>
                </div>

                <h5 className="font-medium text-purple-900">Processed Values</h5>
                <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safe Status:</span>
                    <span className="font-mono">{processedValues.safeStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safe Carrier:</span>
                    <span className="font-mono">{processedValues.safeCarrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safe Tracking:</span>
                    <span className="font-mono">{processedValues.safeTrackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safe Agent:</span>
                    <span className="font-mono">{processedValues.safeAgentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safe Manager:</span>
                    <span className="font-mono">{processedValues.safeManagerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress %:</span>
                    <span className="font-mono">{getProgressPercentage(processedValues.safeStatus)}%</span>
                  </div>
                </div>
              </div>

              {/* Debug Logs */}
              <div className="space-y-4">
                <h5 className="font-medium text-purple-900">Debug Logs ({debugLogs.length})</h5>
                <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
                  {debugLogs.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No debug logs yet</p>
                  ) : (
                    <div className="space-y-1 text-xs font-mono">
                      {debugLogs.map((log, index) => (
                        <div key={index} className="text-gray-700 border-b border-gray-100 pb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Raw Data */}
            <div className="mt-6">
              <h5 className="font-medium text-purple-900 mb-3">Raw Shipping Info</h5>
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">JSON Data</span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(shippingInfo, null, 2))}
                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors flex items-center gap-1"
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                </div>
                <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(shippingInfo, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        <ShippingStatusUpdateModal
          isOpen={showStatusUpdateModal}
          onClose={() => setShowStatusUpdateModal(false)}
          onUpdateStatus={handleStatusUpdate}
          currentStatus={processedValues.safeStatus}
          shippingInfo={shippingInfo}
        />

        {/* Product Update Modal */}
        <ProductUpdateModal
          isOpen={showProductUpdateModal}
          onClose={() => setShowProductUpdateModal(false)}
          shippingInfo={shippingInfo}
          onProductsUpdated={handleProductsUpdated}
        />
      </div>
    </GlassCard>
  );
};

ShippingTracker.displayName = 'ShippingTracker';

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: ShippingTrackerProps, nextProps: ShippingTrackerProps) => {
  // Compare all props that could cause re-renders
  if (prevProps.compact !== nextProps.compact) return false;
  if (prevProps.debugMode !== nextProps.debugMode) return false;
  if (prevProps.onRefresh !== nextProps.onRefresh) return false;
  
  // Deep compare shippingInfo
  if (!prevProps.shippingInfo && !nextProps.shippingInfo) return true;
  if (!prevProps.shippingInfo || !nextProps.shippingInfo) return false;
  
  const prev = prevProps.shippingInfo;
  const next = nextProps.shippingInfo;
  
  return (
    prev.carrier === next.carrier &&
    prev.trackingNumber === next.trackingNumber &&
    prev.status === next.status &&
    prev.method === next.method &&
    prev.cost === next.cost &&
    prev.notes === next.notes &&
    prev.estimatedDelivery === next.estimatedDelivery &&
    prev.shippedDate === next.shippedDate &&
    prev.deliveredDate === next.deliveredDate &&
    JSON.stringify(prev.agent) === JSON.stringify(next.agent) &&
    JSON.stringify(prev.manager) === JSON.stringify(next.manager)
  );
};

export default React.memo(ShippingTracker, arePropsEqual);
