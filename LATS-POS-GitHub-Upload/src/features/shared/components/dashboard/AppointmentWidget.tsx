import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { dashboardService, AppointmentSummary } from '../../../../services/dashboardService';
import { useAuth } from '../../../../context/AuthContext';

interface AppointmentWidgetProps {
  className?: string;
}

export const AppointmentWidget: React.FC<AppointmentWidgetProps> = ({ className }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const [todayAppointments, dashboardStats] = await Promise.all([
        dashboardService.getTodayAppointments(4),
        dashboardService.getDashboardStats(currentUser?.id || '')
      ]);
      
      setAppointments(todayAppointments);
      setStats({
        today: dashboardStats.todayAppointments,
        upcoming: dashboardStats.upcomingAppointments,
        completionRate: dashboardStats.appointmentCompletionRate
      });
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-emerald-600 bg-emerald-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'scheduled': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-300';
      case 'high': return 'border-orange-300';
      case 'medium': return 'border-blue-300';
      default: return 'border-gray-300';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
            <p className="text-sm text-gray-600">
              {stats.today} appointments • {stats.completionRate}% completion
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <p className="text-lg font-bold text-purple-700">{stats.today}</p>
          <p className="text-xs text-purple-600">Today</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-700">{stats.upcoming}</p>
          <p className="text-xs text-blue-600">Upcoming</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">{stats.completionRate}%</p>
          <p className="text-xs text-green-600">Complete</p>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-2 h-40 overflow-y-auto">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div key={appointment.id} className={`p-3 bg-white rounded-lg border-l-4 ${getPriorityColor(appointment.priority)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(appointment.time)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {appointment.customerName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {appointment.serviceName}
                  </p>
                  {appointment.technicianName && (
                    <div className="flex items-center gap-1 mt-1">
                      <User size={10} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{appointment.technicianName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No appointments today</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/appointments')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          View All
        </GlassButton>
        <GlassButton
          onClick={() => navigate('/appointments/new')}
          variant="ghost"
          size="sm"
          icon={<Calendar size={14} />}
        >
          Book
        </GlassButton>
      </div>
    </GlassCard>
  );
};
