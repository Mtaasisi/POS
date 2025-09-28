import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Calendar, Clock, Users, MapPin, Phone, Mail, Plus, Edit, Trash2, 
  ChevronLeft, ChevronRight, Filter, RefreshCw, Eye, EyeOff,
  CheckCircle, AlertTriangle, XCircle, CalendarDays, User, Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CalendarViewTabProps {
  isActive: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: 'appointment' | 'meeting' | 'service' | 'reminder' | 'holiday';
  start: string;
  end: string;
  allDay: boolean;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceType?: string;
  technicianName?: string;
  location?: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  color: string;
}

const CalendarViewTab: React.FC<CalendarViewTabProps> = ({ isActive }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (isActive) {
      console.log('📅 CalendarViewTab activated, loading events...');
      loadCalendarEvents();
    }
  }, [isActive, currentDate]);

  const loadCalendarEvents = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading calendar events...');
      // Get current date for dynamic mock events
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();
      
      console.log('📅 Current date info:', { currentYear, currentMonth, currentDay });
      
      // No sample data - calendar starts empty
      const mockEvents: CalendarEvent[] = [];
      
      setEvents(mockEvents);
      console.log('✅ Calendar events loaded successfully:', mockEvents.length, 'events');
    } catch (error) {
      console.error('❌ Error loading calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500';
      case 'high':
        return 'border-orange-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-green-500';
      default:
        return 'border-gray-500';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  const monthDays = getMonthDays(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GlassButton
            onClick={() => navigateMonth('prev')}
            icon={<ChevronLeft size={18} />}
            variant="secondary"
          />
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <GlassButton
            onClick={() => navigateMonth('next')}
            icon={<ChevronRight size={18} />}
            variant="secondary"
          />
          <GlassButton
            onClick={goToToday}
            variant="secondary"
            size="sm"
          >
            Today
          </GlassButton>
        </div>
        
        <div className="flex gap-2">
          <GlassButton
            onClick={() => setViewMode('month')}
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
            size="sm"
          >
            Month
          </GlassButton>
          <GlassButton
            onClick={() => setViewMode('week')}
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            size="sm"
          >
            Week
          </GlassButton>
          <GlassButton
            onClick={() => setViewMode('day')}
            variant={viewMode === 'day' ? 'primary' : 'secondary'}
            size="sm"
          >
            Day
          </GlassButton>
          <GlassButton
            onClick={loadCalendarEvents}
            icon={<RefreshCw size={16} />}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </GlassButton>
        </div>
      </div>

      {/* Calendar Grid */}
      <GlassCard className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 rounded-lg transition-colors hover:bg-gray-50 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`p-1 rounded text-xs cursor-pointer border-l-4 transition-all hover:shadow-sm ${getPriorityColor(event.priority)} ${getStatusColor(event.status)}`}
                      onClick={() => setSelectedEvent(event)}
                      title={`${event.title} - ${formatTime(event.start)}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {formatTime(event.start)}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Title:</span>
                <p className="text-gray-900">{selectedEvent.title}</p>
              </div>
              
              {selectedEvent.customerName && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Customer:</span>
                  <p className="text-gray-900">{selectedEvent.customerName}</p>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-gray-600">Time:</span>
                <p className="text-gray-900">
                  {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                </p>
              </div>
              
              {selectedEvent.location && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Location:</span>
                  <p className="text-gray-900">{selectedEvent.location}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedEvent.priority)}`}>
                  {selectedEvent.priority}
                </span>
              </div>
              
              {selectedEvent.notes && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Notes:</span>
                  <p className="text-gray-900 text-sm">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-6">
              <GlassButton
                onClick={() => {/* TODO: Edit event */}}
                icon={<Edit size={14} />}
                size="sm"
              >
                Edit
              </GlassButton>
              <GlassButton
                onClick={() => setSelectedEvent(null)}
                variant="secondary"
                size="sm"
              >
                Close
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarViewTab;
