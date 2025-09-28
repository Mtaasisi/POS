import React, { useState, useEffect, useRef } from 'react';
import GlassCard from './ui/GlassCard';
import { 
  salesPaymentTrackingService, 
  SalesPayment 
} from '../../../lib/salesPaymentTrackingService';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Bell, CheckCircle, Clock, XCircle, AlertTriangle, 
  RefreshCw, Wifi, WifiOff, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RealTimePaymentUpdatesProps {
  onPaymentUpdate?: (payment: SalesPayment) => void;
  onMetricsUpdate?: () => void;
}

interface PaymentUpdate {
  id: string;
  type: 'new_sale' | 'status_update' | 'payment_received';
  saleId: string;
  saleNumber: string;
  amount: number;
  status: string;
  timestamp: string;
  message: string;
}

const RealTimePaymentUpdates: React.FC<RealTimePaymentUpdatesProps> = ({
  onPaymentUpdate,
  onMetricsUpdate
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<PaymentUpdate[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const subscriptionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxUpdates = 50; // Keep only last 50 updates

  useEffect(() => {
    startRealTimeUpdates();
    return () => {
      stopRealTimeUpdates();
    };
  }, []);

  const startRealTimeUpdates = async () => {
    try {
      setIsListening(true);
      
      // Subscribe to lats_sales table changes
      subscriptionRef.current = supabase
        .channel('sales-payment-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lats_sales'
          },
          (payload) => {
            handleSalesUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lats_sale_items'
          },
          (payload) => {
            handleSaleItemsUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            toast.success('Real-time updates connected');
          } else if (status === 'CHANNEL_ERROR') {
            toast.error('Real-time connection error');
            scheduleReconnect();
          }
        });

    } catch (error) {
      console.error('Error starting real-time updates:', error);
      toast.error('Failed to start real-time updates');
      scheduleReconnect();
    }
  };

  const stopRealTimeUpdates = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsListening(false);
    setIsConnected(false);
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...');
      startRealTimeUpdates();
    }, 5000); // Reconnect after 5 seconds
  };

  const handleSalesUpdate = async (payload: any) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      let update: PaymentUpdate;
      
      switch (eventType) {
        case 'INSERT':
          update = {
            id: `new-${newRecord.id}`,
            type: 'new_sale',
            saleId: newRecord.id,
            saleNumber: newRecord.sale_number,
            amount: newRecord.total_amount || 0,
            status: newRecord.status,
            timestamp: new Date().toISOString(),
            message: `New sale ${newRecord.sale_number} for ${formatCurrency(newRecord.total_amount || 0)}`
          };
          break;
          
        case 'UPDATE':
          if (oldRecord.status !== newRecord.status) {
            update = {
              id: `update-${newRecord.id}-${Date.now()}`,
              type: 'status_update',
              saleId: newRecord.id,
              saleNumber: newRecord.sale_number,
              amount: newRecord.total_amount || 0,
              status: newRecord.status,
              timestamp: new Date().toISOString(),
              message: `Sale ${newRecord.sale_number} status changed to ${newRecord.status}`
            };
          } else {
            return; // Skip if status didn't change
          }
          break;
          
        default:
          return; // Skip other event types
      }

      // Add update to list
      setUpdates(prev => {
        const newUpdates = [update, ...prev].slice(0, maxUpdates);
        return newUpdates;
      });

      setLastUpdateTime(new Date());

      // Show toast notification
      toast.success(update.message);

      // Fetch updated payment data
      if (onPaymentUpdate) {
        try {
          const updatedPayment = await salesPaymentTrackingService.fetchSalesPayments({
            searchQuery: newRecord.sale_number
          });
          if (updatedPayment.length > 0) {
            onPaymentUpdate(updatedPayment[0]);
          }
        } catch (error) {
          console.error('Error fetching updated payment:', error);
        }
      }

      // Trigger metrics update
      if (onMetricsUpdate) {
        onMetricsUpdate();
      }

    } catch (error) {
      console.error('Error handling sales update:', error);
    }
  };

  const handleSaleItemsUpdate = async (payload: any) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      // Only handle inserts for new sale items
      if (eventType === 'INSERT') {
        const update: PaymentUpdate = {
          id: `item-${newRecord.id}-${Date.now()}`,
          type: 'payment_received',
          saleId: newRecord.sale_id,
          saleNumber: `Sale-${newRecord.sale_id.slice(0, 8)}`,
          amount: newRecord.total_price || 0,
          status: 'completed',
          timestamp: new Date().toISOString(),
          message: `Item added to sale: ${newRecord.product_name || 'Product'}`
        };

        setUpdates(prev => {
          const newUpdates = [update, ...prev].slice(0, maxUpdates);
          return newUpdates;
        });

        setLastUpdateTime(new Date());
      }
    } catch (error) {
      console.error('Error handling sale items update:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-TZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUpdateIcon = (type: string, status: string) => {
    switch (type) {
      case 'new_sale':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'status_update':
        switch (status) {
          case 'completed':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
          case 'pending':
            return <Clock className="h-4 w-4 text-yellow-500" />;
          case 'cancelled':
            return <XCircle className="h-4 w-4 text-red-500" />;
          default:
            return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        }
      case 'payment_received':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const clearUpdates = () => {
    setUpdates([]);
    toast.success('Updates cleared');
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
            <p className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'} • {updates.length} updates
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdateTime && (
            <span className="text-xs text-gray-500">
              Last: {formatTime(lastUpdateTime.toISOString())}
            </span>
          )}
          <button
            onClick={clearUpdates}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Live updates active' : 'Connection lost - retrying...'}
          </span>
          {isListening && !isConnected && (
            <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
          )}
        </div>
      </div>

      {/* Updates List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No updates yet</p>
            <p className="text-xs">Real-time updates will appear here</p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {getUpdateIcon(update.type, update.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {update.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{update.saleNumber}</span>
                  <span>•</span>
                  <span>{formatCurrency(update.amount)}</span>
                  <span>•</span>
                  <span>{formatTime(update.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Real-time payment tracking</span>
          <span>{updates.length}/{maxUpdates} updates</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default RealTimePaymentUpdates;
