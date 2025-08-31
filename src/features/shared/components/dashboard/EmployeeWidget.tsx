import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle, AlertTriangle, ExternalLink, UserCheck } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { dashboardService, EmployeeStatus } from '../../../../services/dashboardService';

interface EmployeeWidgetProps {
  className?: string;
}

export const EmployeeWidget: React.FC<EmployeeWidgetProps> = ({ className }) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    total: 0,
    onLeave: 0,
    attendanceRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      const [employeeStatus, dashboardStats] = await Promise.all([
        dashboardService.getTodayEmployeeStatus(),
        dashboardService.getDashboardStats('current-user') // Would be actual user ID
      ]);
      
      setEmployees(employeeStatus);
      setStats({
        present: dashboardStats.presentToday,
        total: dashboardStats.totalEmployees,
        onLeave: dashboardStats.onLeaveToday,
        attendanceRate: dashboardStats.attendanceRate
      });
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'late': return 'text-orange-600 bg-orange-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'on-leave': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle size={12} />;
      case 'late': return <Clock size={12} />;
      case 'absent': return <AlertTriangle size={12} />;
      case 'on-leave': return <UserCheck size={12} />;
      default: return <Users size={12} />;
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
          <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Staff Today</h3>
            <p className="text-sm text-gray-600">
              {stats.present}/{stats.total} present ({stats.attendanceRate}%)
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">{stats.present}</p>
          <p className="text-xs text-green-600">Present</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-700">{stats.onLeave}</p>
          <p className="text-xs text-blue-600">On Leave</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-700">{stats.attendanceRate}%</p>
          <p className="text-xs text-gray-600">Rate</p>
        </div>
      </div>

      {/* Employee Status List */}
      <div className="space-y-2">
        {employees.length > 0 ? (
          employees.slice(0, 4).map((employee) => (
            <div key={employee.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {employee.name}
                </p>
                <p className="text-xs text-gray-600">
                  {employee.department}
                  {employee.checkInTime && ` • ${employee.checkInTime}`}
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                {getStatusIcon(employee.status)}
                <span className="capitalize">{employee.status.replace('-', ' ')}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No employee data</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/employees')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          Manage Staff
        </GlassButton>
        <GlassButton
          onClick={() => navigate('/employees/attendance')}
          variant="ghost"
          size="sm"
          icon={<Clock size={14} />}
        >
          Attendance
        </GlassButton>
      </div>
    </GlassCard>
  );
};