import React, { useState, useEffect } from 'react';
import { aiServiceStatus, getAIServiceStatusMessage, isAIServiceReady } from '../utils/aiServiceStatus';

interface AIServiceStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const AIServiceStatusIndicator: React.FC<AIServiceStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState(aiServiceStatus.getStatus());
  const [message, setMessage] = useState(getAIServiceStatusMessage());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(aiServiceStatus.getStatus());
      setMessage(getAIServiceStatusMessage());
    };

    // Update status every second to show countdown
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (!status.isAvailable) return '🔴';
    if (status.requestCount >= status.maxRequestsPerMinute) return '🟡';
    return '🟢';
  };

  const getStatusColor = () => {
    if (!status.isAvailable) return 'text-red-600';
    if (status.requestCount >= status.maxRequestsPerMinute) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <span className="text-lg">{getStatusIcon()}</span>
      <div className="flex flex-col">
        <span className={`font-medium ${getStatusColor()}`}>
          AI Service Status
        </span>
        {showDetails && (
          <span className="text-xs text-gray-600">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

// Simple status badge component
export const AIServiceStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isReady, setIsReady] = useState(isAIServiceReady());

  useEffect(() => {
    const checkStatus = () => {
      setIsReady(isAIServiceReady());
    };

    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isReady 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    } ${className}`}>
      <span className="w-2 h-2 rounded-full mr-1.5 ${
        isReady ? 'bg-green-400' : 'bg-red-400'
      }"></span>
      {isReady ? 'AI Ready' : 'AI Busy'}
    </div>
  );
};
