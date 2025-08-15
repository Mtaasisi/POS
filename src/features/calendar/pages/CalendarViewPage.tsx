import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Calendar, Clock, Users, MapPin, Phone, Mail, Plus, Edit, Trash2, 
  ChevronLeft, ChevronRight, Filter, RefreshCw, Eye, EyeOff,
  CheckCircle, AlertTriangle, XCircle, CalendarDays, User, Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

interface EmployeeSchedule {
  id: string;
  employeeName: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'busy' | 'off' | 'leave';
  events: CalendarEvent[];
}

const CalendarViewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const mockEvents: CalendarEvent[] = [
          {
            id: '1',
            title: 'iPhone Screen Replacement',
            type: 'appointment',
            start: '2024-01-20T09:00:00',
            end: '2024-01-20T11:00:00',
            allDay: false,
            customerName: 'John Doe',
            customerPhone: '+255 123 456 789',
            customerEmail: 'john.doe@email.com',
            serviceType: 'Device Repair',
            technicianName: 'Sarah Manager',
            location: 'Main Office',
            status: 'confirmed',
            priority: 'high',
            notes: 'Customer requested original screen replacement',
            color: 'blue'
          },
          {
            id: '2',
            title: 'Laptop Diagnostics',
            type: 'service',
            start: '2024-01-20T14:00:00',
            end: '2024-01-20T16:00:00',
            allDay: false,
            customerName: 'Sarah Smith',
            customerPhone: '+255 987 654 321',
            customerEmail: 'sarah.smith@email.com',
            serviceType: 'Diagnostics',
            technicianName: 'Mike Technician',
            location: 'Branch Office',
            status: 'scheduled',
            priority: 'medium',
            notes: 'Dell laptop not booting properly',
            color: 'green'
          },
          {
            id: '3',
            title: 'Team Meeting',
            type: 'meeting',
            start: '2024-01-20T10:00:00',
            end: '2024-01-20T11:00:00',
            allDay: false,
            location: 'Conference Room',
            status: 'scheduled',
            priority: 'medium',
            notes: 'Weekly team status update',
            color: 'purple'
          },
          {
            id: '4',
            title: 'Data Recovery Service',
            type: 'service',
            start: '2024-01-21T08:00:00',
            end: '2024-01-21T17:00:00',
            allDay: true,
            customerName: 'Mike Johnson',
            customerPhone: '+255 555 123 456',
            customerEmail: 'mike.johnson@email.com',
            serviceType: 'Data Recovery',
            technicianName: 'Lisa Support',
            location: 'Main Office',
            status: 'in-progress',
            priority: 'urgent',
            notes: 'Critical business data recovery needed',
            color: 'red'
          },
          {
            id: '5',
            title: 'Public Holiday',
            type: 'holiday',
            start: '2024-01-22T00:00:00',
            end: '2024-01-22T23:59:59',
            allDay: true,
            status: 'confirmed',
            priority: 'low',
            notes: 'Office closed for public holiday',
            color: 'gray'
          }
        ];

        const mockSchedules: EmployeeSchedule[] = [
          {
            id: 's1',
            employeeName: 'Sarah Manager',
            employeeId: 'emp1',
            date: '2024-01-20',
            startTime: '08:00',
            endTime: '17:00',
            status: 'available',
            events: [mockEvents[0], mockEvents[2]]
          },
          {
            id: 's2',
            employeeName: 'Mike Technician',
            employeeId: 'emp2',
            date: '2024-01-20',
            startTime: '08:00',
            endTime: '17:00',
            status: 'busy',
            events: [mockEvents[1]]
          },
          {
            id: 's3',
            employeeName: 'Lisa Support',
            employeeId: 'emp3',
            date: '2024-01-21',
            startTime: '08:00',
            endTime: '17:00',
            status: 'busy',
            events: [mockEvents[3]]
          }
        ];

        setEvents(mockEvents);
        setEmployeeSchedules(mockSchedules);
      } catch (error) {
        toast.error('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'in-progress':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={16} />;
      case 'meeting':
        return <Users size={16} />;
      case 'service':
        return <Building size={16} />;
      case 'reminder':
        return <Clock size={16} />;
      default:
        return <CalendarDays size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar View</h1>
            <p className="text-gray-600 mt-1">Manage appointments, schedules, and events</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => setShowCreateEvent(true)}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
          >
            New Event
          </GlassButton>
          <GlassButton
            onClick={() => navigate('/appointments')}
            variant="secondary"
            icon={<Calendar size={18} />}
          >
            Manage Appointments
          </GlassButton>
        </div>
      </div>

      {/* Calendar Controls */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1);
                  } else if (viewMode === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else {
                    newDate.setDate(newDate.getDate() - 1);
                  }
                  setCurrentDate(newDate);
                }}
                variant="ghost"
                icon={<ChevronLeft size={18} />}
              />
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              <GlassButton
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1);
                  } else if (viewMode === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else {
                    newDate.setDate(newDate.getDate() + 1);
                  }
                  setCurrentDate(newDate);
                }}
                variant="ghost"
                icon={<ChevronRight size={18} />}
              />
            </div>

            <div className="flex gap-2">
              <GlassButton
                onClick={() => setViewMode('month')}
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
              >
                Month
              </GlassButton>
              <GlassButton
                onClick={() => setViewMode('week')}
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
              >
                Week
              </GlassButton>
              <GlassButton
                onClick={() => setViewMode('day')}
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
              >
                Day
              </GlassButton>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassSelect
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'appointment', label: 'Appointments' },
                { value: 'meeting', label: 'Meetings' },
                { value: 'service', label: 'Services' },
                { value: 'reminder', label: 'Reminders' },
                { value: 'holiday', label: 'Holidays' }
              ]}
              value={filterType}
              onChange={setFilterType}
              placeholder="Filter by Type"
              className="min-w-[150px]"
            />
            <GlassSelect
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Filter by Status"
              className="min-w-[150px]"
            />
          </div>
        </div>
      </GlassCard>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar Events</h3>
              <p className="text-sm text-gray-600">
                {viewMode === 'month' ? 'Monthly View' : viewMode === 'week' ? 'Weekly View' : 'Daily View'}
              </p>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                date.setDate(date.getDate() + i - date.getDay());
                
                const dayEvents = events.filter(event => {
                  const eventDate = new Date(event.start);
                  return eventDate.toDateString() === date.toDateString();
                });

                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] p-2 border border-gray-200 ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-sm font-medium ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'text-blue-600' : ''}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                          className={`text-xs p-1 rounded cursor-pointer ${
                            event.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            event.color === 'green' ? 'bg-green-100 text-green-800' :
                            event.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            event.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {getEventTypeIcon(event.type)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Events</h3>
            <div className="space-y-3">
              {events
                .filter(event => {
                  const eventDate = new Date(event.start);
                  const today = new Date();
                  return eventDate.toDateString() === today.toDateString();
                })
                .slice(0, 5)
                .map(event => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventTypeIcon(event.type)}
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {event.allDay ? 'All Day' : `${formatTime(event.start)} - ${formatTime(event.end)}`}
                      </p>
                      {event.customerName && (
                        <p className="text-sm text-gray-500">Customer: {event.customerName}</p>
                      )}
                      {event.location && (
                        <p className="text-sm text-gray-500">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusIcon(event.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {events.filter(event => {
                const eventDate = new Date(event.start);
                const today = new Date();
                return eventDate.toDateString() === today.toDateString();
              }).length === 0 && (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No events today</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Employee Schedules */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Schedules</h3>
            <div className="space-y-3">
              {employeeSchedules.slice(0, 5).map(schedule => (
                <div key={schedule.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{schedule.employeeName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      schedule.status === 'available' ? 'bg-green-100 text-green-800' :
                      schedule.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                      schedule.status === 'off' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {schedule.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {schedule.startTime} - {schedule.endTime}
                  </p>
                  <p className="text-sm text-gray-500">
                    {schedule.events.length} events scheduled
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Events</span>
                <span className="font-semibold text-gray-900">{events.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold text-gray-900">
                  {events.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.getMonth() === currentDate.getMonth() && 
                           eventDate.getFullYear() === currentDate.getFullYear();
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-semibold text-gray-900">
                  {events.filter(event => event.status === 'scheduled').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confirmed</span>
                <span className="font-semibold text-gray-900">
                  {events.filter(event => event.status === 'confirmed').length}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Event Details</h3>
                <GlassButton
                  onClick={() => setShowEventModal(false)}
                  variant="ghost"
                  icon={<XCircle size={20} />}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getEventTypeIcon(selectedEvent.type)}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h4>
                    <p className="text-sm text-gray-500 capitalize">{selectedEvent.type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Date & Time</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedEvent.start)}
                      {!selectedEvent.allDay && (
                        <span> • {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedEvent.status)}
                      <span className="text-sm text-gray-600 capitalize">{selectedEvent.status}</span>
                    </div>
                  </div>

                  {selectedEvent.customerName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Customer</p>
                      <p className="text-sm text-gray-600">{selectedEvent.customerName}</p>
                      {selectedEvent.customerPhone && (
                        <p className="text-sm text-gray-500">{selectedEvent.customerPhone}</p>
                      )}
                      {selectedEvent.customerEmail && (
                        <p className="text-sm text-gray-500">{selectedEvent.customerEmail}</p>
                      )}
                    </div>
                  )}

                  {selectedEvent.serviceType && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Service Type</p>
                      <p className="text-sm text-gray-600">{selectedEvent.serviceType}</p>
                    </div>
                  )}

                  {selectedEvent.technicianName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Assigned Technician</p>
                      <p className="text-sm text-gray-600">{selectedEvent.technicianName}</p>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Location</p>
                      <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Priority</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedEvent.priority)}`}>
                      {selectedEvent.priority}
                    </span>
                  </div>
                </div>

                {selectedEvent.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedEvent.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <GlassButton
                    onClick={() => {
                      setShowEventModal(false);
                      // Handle edit event
                      toast.success('Edit functionality coming soon!');
                    }}
                    icon={<Edit size={16} />}
                    className="flex-1"
                  >
                    Edit Event
                  </GlassButton>
                  <GlassButton
                    onClick={() => {
                      setShowEventModal(false);
                      // Handle delete event
                      toast.success('Delete functionality coming soon!');
                    }}
                    variant="secondary"
                    icon={<Trash2 size={16} />}
                    className="flex-1"
                  >
                    Delete Event
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Upcoming Events List */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search events..."
            className="w-64"
            suggestions={events.map(e => e.title)}
            searchKey="calendar_events_search"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Event</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events
                .filter(event => {
                  const matchesSearch = !searchQuery || 
                    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (event.customerName && event.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchesType = filterType === 'all' || event.type === filterType;
                  const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
                  return matchesSearch && matchesType && matchesStatus;
                })
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getEventTypeIcon(event.type)}
                      <span className="font-medium text-gray-900">{event.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-sm text-gray-600">{event.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-gray-900">{formatDate(event.start)}</p>
                      <p className="text-xs text-gray-500">
                        {event.allDay ? 'All Day' : `${formatTime(event.start)} - ${formatTime(event.end)}`}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {event.customerName ? (
                      <div>
                        <p className="text-sm text-gray-900">{event.customerName}</p>
                        {event.customerPhone && (
                          <p className="text-xs text-gray-500">{event.customerPhone}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event.status)}
                      <span className="text-sm text-gray-600 capitalize">{event.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={16} />}
                      >
                        View
                      </GlassButton>
                      <GlassButton
                        onClick={() => toast.success('Edit functionality coming soon!')}
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                      >
                        Edit
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.filter(event => {
          const matchesSearch = !searchQuery || 
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.customerName && event.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesType = filterType === 'all' || event.type === filterType;
          const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
          return matchesSearch && matchesType && matchesStatus;
        }).length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first event'
              }
            </p>
            {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
              <GlassButton
                onClick={() => setShowCreateEvent(true)}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Create Your First Event
              </GlassButton>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default CalendarViewPage;
