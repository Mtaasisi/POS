import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Calendar,
  Tag,
  AlertTriangle,
  Users,
  Smartphone,
  CreditCard,
  Package,
  Settings,
  Clock,
  Star,
  MessageSquare,
  Database,
  Shield,
  Target
} from 'lucide-react';
import { 
  NotificationFilters as FiltersType,
  NotificationStatus,
  NotificationCategory,
  NotificationPriority,
  NotificationType
} from '../types';
import { notificationHelpers } from '../utils/notificationHelpers';

interface NotificationFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  stats: {
    byCategory: Record<NotificationCategory, number>;
    byPriority: Record<NotificationPriority, number>;
    byType: Record<NotificationType, number>;
  };
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filters,
  onFiltersChange,
  stats
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const categoryIcons: Record<NotificationCategory, React.ReactNode> = {
    devices: <Smartphone size={16} />,
    customers: <Users size={16} />,
    payments: <CreditCard size={16} />,
    inventory: <Package size={16} />,
    system: <Settings size={16} />,
    appointments: <Calendar size={16} />,
    diagnostics: <AlertTriangle size={16} />,
    loyalty: <Star size={16} />,
    communications: <MessageSquare size={16} />,
    backup: <Database size={16} />,
    security: <Shield size={16} />,
    goals: <Target size={16} />
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleStatusToggle = (status: NotificationStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({ 
      ...filters, 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    });
  };

  const handleCategoryToggle = (category: NotificationCategory) => {
    const currentCategories = filters.category || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    onFiltersChange({ 
      ...filters, 
      category: newCategories.length > 0 ? newCategories : undefined 
    });
  };

  const handlePriorityToggle = (priority: NotificationPriority) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    onFiltersChange({ 
      ...filters, 
      priority: newPriorities.length > 0 ? newPriorities : undefined 
    });
  };

  const handleTypeToggle = (type: NotificationType) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    onFiltersChange({ 
      ...filters, 
      type: newTypes.length > 0 ? newTypes : undefined 
    });
  };

  const clearAllFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof FiltersType];
    return value !== undefined && 
           (Array.isArray(value) ? value.length > 0 : value !== '');
  });

  const statusOptions: { value: NotificationStatus; label: string; color: string }[] = [
    { value: 'unread', label: 'Unread', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'read', label: 'Read', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { value: 'actioned', label: 'Actioned', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'dismissed', label: 'Dismissed', color: 'bg-red-100 text-red-700 border-red-200' }
  ];

  const priorityOptions: { value: NotificationPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchValue && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <Filter size={16} />
          Filters
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Status Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handleStatusToggle(value)}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium border transition-colors
                    ${filters.status?.includes(value) 
                      ? `${color} border-current` 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Priority</h4>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handlePriorityToggle(value)}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium border transition-colors
                    ${filters.priority?.includes(value) 
                      ? `${color} border-current` 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(stats.byCategory) as NotificationCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors
                    ${filters.category?.includes(category)
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  {categoryIcons[category]}
                  <span className="truncate">{notificationHelpers.getCategoryDisplayName(category)}</span>
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {stats.byCategory[category] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Type Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Types</h4>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(stats.byType) as NotificationType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors
                    ${filters.type?.includes(type)
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  <span>{notificationHelpers.getNotificationIcon(type)}</span>
                  <span className="truncate">{type.replace('_', ' ')}</span>
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {stats.byType[type] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.status?.map(status => (
              <span key={status} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                Status: {status}
              </span>
            ))}
            {filters.category?.map(category => (
              <span key={category} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {notificationHelpers.getCategoryDisplayName(category)}
              </span>
            ))}
            {filters.priority?.map(priority => (
              <span key={priority} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {notificationHelpers.getPriorityDisplayName(priority)}
              </span>
            ))}
            {filters.type?.map(type => (
              <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {type.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationFilters;
