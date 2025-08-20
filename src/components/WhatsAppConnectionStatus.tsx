import React, { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const WhatsAppConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    // Listen for connection status changes
    const handleStatusChange = (event: CustomEvent) => {
      const { type, status: newStatus } = event.detail;
      
      if (type === 'subscription') {
        if (newStatus === 'SUBSCRIBED') {
          setStatus('connected');
          setDetails('Real-time subscription active');
        } else if (newStatus === 'CLOSED') {
          setStatus('disconnected');
          setDetails('Connection lost, attempting to reconnect...');
        } else if (newStatus === 'CHANNEL_ERROR') {
          setStatus('error');
          setDetails('Channel error occurred');
        } else {
          setStatus('connecting');
          setDetails(`Status: ${newStatus}`);
        }
        setLastUpdate(new Date());
      }
    };

    // Listen for connection changes
    const handleConnectionChange = (event: CustomEvent) => {
      const { status: isConnected } = event.detail;
      if (isConnected) {
        setStatus('connected');
        setDetails('WhatsApp API connection healthy');
      } else {
        setStatus('error');
        setDetails('WhatsApp API connection failed');
      }
      setLastUpdate(new Date());
    };

    window.addEventListener('whatsapp-status-change', handleStatusChange as EventListener);
    window.addEventListener('whatsapp-connection-change', handleConnectionChange as EventListener);

    return () => {
      window.removeEventListener('whatsapp-status-change', handleStatusChange as EventListener);
      window.removeEventListener('whatsapp-connection-change', handleConnectionChange as EventListener);
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <div className="font-medium">{getStatusText()}</div>
            {details && (
              <div className="text-sm opacity-75">{details}</div>
            )}
          </div>
        </div>
        
        {lastUpdate && (
          <div className="text-xs opacity-60">
            {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="text-xs space-y-1">
            <div>Status: {status}</div>
            <div>Last Update: {lastUpdate?.toLocaleString() || 'Never'}</div>
            {details && <div>Details: {details}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnectionStatus;
