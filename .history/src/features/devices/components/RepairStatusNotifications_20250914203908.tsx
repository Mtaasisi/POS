import React, { useState, useEffect, useRef } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Clock,
  User,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StatusNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  deviceId: string;
  status: DeviceStatus;
  read: boolean;
}

interface RepairStatusNotificationsProps {
  device: Device;
  onStatusChange?: (newStatus: DeviceStatus) => void;
  showNotifications?: boolean;
}

const RepairStatusNotifications: React.FC<RepairStatusNotificationsProps> = ({
  device,
  onStatusChange,
  showNotifications = true
}) => {
  const [notifications, setNotifications] = useState<StatusNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const previousStatusRef = useRef<DeviceStatus | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor status changes
  useEffect(() => {
    if (previousStatusRef.current && previousStatusRef.current !== device.status) {
      handleStatusChange(previousStatusRef.current, device.status);
    }
    previousStatusRef.current = device.status;
  }, [device.status]);

  const handleStatusChange = (oldStatus: DeviceStatus, newStatus: DeviceStatus) => {
    const notification = createStatusNotification(oldStatus, newStatus);
    if (notification) {
      addNotification(notification);
      showToastNotification(notification);
    }
  };

  const createStatusNotification = (
    oldStatus: DeviceStatus, 
    newStatus: DeviceStatus
  ): StatusNotification | null => {
    const statusLabels: { [key: string]: string } = {
      'assigned': 'Assigned',
      'diagnosis-started': 'Diagnosis Started',
      'awaiting-parts': 'Awaiting Parts',
      'in-repair': 'In Repair',
      'reassembled-testing': 'Testing',
      'repair-complete': 'Repair Complete',
      'returned-to-customer-care': 'Returned to Customer Care',
      'done': 'Done',
      'failed': 'Failed'
    };

    const getNotificationType = (status: DeviceStatus): 'success' | 'warning' | 'info' | 'error' => {
      switch (status) {
        case 'done':
        case 'repair-complete':
          return 'success';
        case 'failed':
          return 'error';
        case 'awaiting-parts':
          return 'warning';
        default:
          return 'info';
      }
    };

    const getNotificationMessage = (oldStatus: DeviceStatus, newStatus: DeviceStatus): string => {
      const messages: { [key: string]: string } = {
        'diagnosis-started': 'Diagnostic process has begun',
        'awaiting-parts': 'Waiting for replacement parts to arrive',
        'in-repair': 'Repair work is now in progress',
        'reassembled-testing': 'Device reassembled and testing phase started',
        'repair-complete': 'Repair completed successfully!',
        'returned-to-customer-care': 'Device ready for customer pickup',
        'done': 'Device has been picked up by customer',
        'failed': 'Repair could not be completed'
      };

      return messages[newStatus] || `Status changed to ${statusLabels[newStatus]}`;
    };

    return {
      id: `status-${Date.now()}`,
      type: getNotificationType(newStatus),
      title: `Status Updated: ${statusLabels[newStatus]}`,
      message: getNotificationMessage(oldStatus, newStatus),
      timestamp: new Date(),
      deviceId: device.id,
      status: newStatus,
      read: false
    };
  };

  const addNotification = (notification: StatusNotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    setUnreadCount(prev => prev + 1);
  };

  const showToastNotification = (notification: StatusNotification) => {
    const toastOptions = {
      duration: 4000,
      position: 'top-right' as const,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      case 'warning':
        toast(notification.message, { ...toastOptions, icon: '⚠️' });
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      default:
        toast(notification.message, { ...toastOptions, icon: 'ℹ️' });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!showNotifications) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Status Updates</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(notification.timestamp)}</span>
                        <span>•</span>
                        <span>{device.brand} {device.model}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairStatusNotifications;
