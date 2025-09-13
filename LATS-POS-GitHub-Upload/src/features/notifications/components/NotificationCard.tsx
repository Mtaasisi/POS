import React from 'react';
import { 
  Bell, 
  Check, 
  X, 
  ExternalLink, 
  Clock,
  MoreVertical 
} from 'lucide-react';
import { Notification } from '../types';
import { notificationHelpers } from '../utils/notificationHelpers';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsActioned: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction?: (notification: Notification) => void;
  showActions?: boolean;
  compact?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsActioned,
  onDismiss,
  onAction,
  showActions = true,
  compact = false
}) => {
  const {
    id,
    type,
    category,
    title,
    message,
    priority,
    status,
    createdAt,
    actionUrl,
    actionText,
    icon,
    color
  } = notification;

  const isUnread = status === 'unread';
  const isRecent = notificationHelpers.isRecent(notification);
  const notificationIcon = icon || notificationHelpers.getNotificationIcon(type);
  const notificationColor = color || notificationHelpers.getNotificationColor(priority);
  const borderColor = notificationHelpers.getNotificationBorderColor(priority);

  const handleMarkAsRead = () => {
    if (isUnread) {
      onMarkAsRead(id);
    }
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    } else if (actionUrl) {
      window.open(actionUrl, '_blank');
    }
    if (isUnread) {
      onMarkAsRead(id);
    }
  };

  if (compact) {
    return (
      <div 
        className={`
          relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
          ${isUnread ? 'bg-white shadow-sm' : 'bg-gray-50'}
          ${borderColor}
          ${isUnread ? 'hover:shadow-md' : ''}
          ${isRecent ? 'ring-2 ring-blue-100' : ''}
        `}
        onClick={handleMarkAsRead}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-lg">{notificationIcon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`text-sm font-medium truncate ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                {title}
              </h4>
              {isUnread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 line-clamp-2">
              {message}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">
                {notificationHelpers.formatTime(createdAt)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${notificationColor}`}>
                {notificationHelpers.getPriorityDisplayName(priority)}
              </span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              {actionText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction();
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title={actionText}
                >
                  <ExternalLink size={14} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`
        group relative p-4 rounded-xl border transition-all duration-200
        ${isUnread ? 'bg-white shadow-sm' : 'bg-gray-50'}
        ${borderColor}
        ${isUnread ? 'hover:shadow-md' : ''}
        ${isRecent ? 'ring-2 ring-blue-100' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg
            ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            {notificationIcon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                  {title}
                </h4>
                {isUnread && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onMarkAsRead(id)}
                  className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded"
                  title="Mark as read"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => onDismiss(id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                <span>{notificationHelpers.formatTime(createdAt)}</span>
              </div>
              
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${notificationColor}`}>
                {notificationHelpers.getPriorityDisplayName(priority)}
              </span>
              
              <span className="text-xs text-gray-400">
                {notificationHelpers.getCategoryDisplayName(category)}
              </span>
            </div>
            
            {actionText && (
              <button
                onClick={handleAction}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                {actionText}
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isUnread && (
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
      )}
    </div>
  );
};

export default NotificationCard;
