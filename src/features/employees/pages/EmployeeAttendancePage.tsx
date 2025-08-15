import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import EmployeeAttendanceCard from '../components/EmployeeAttendanceCard';
import { 
  Clock, Calendar, TrendingUp, Activity, 
  CheckCircle, AlertTriangle, CalendarDays, BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { mainOffice } from '../config/officeConfig';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  hours: number;
  notes?: string;
}

const EmployeeAttendancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'stats'>('today');

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Mock attendance history for the current employee
        const mockHistory: AttendanceRecord[] = [
          {
            id: '1',
            date: '2024-01-20',
            checkIn: '08:00:00',
            checkOut: '17:00:00',
            status: 'present',
            hours: 9
          },
          {
            id: '2',
            date: '2024-01-19',
            checkIn: '08:15:00',
            checkOut: '17:30:00',
            status: 'late',
            hours: 9.25
          },
          {
            id: '3',
            date: '2024-01-18',
            checkIn: '07:45:00',
            checkOut: '17:00:00',
            status: 'present',
            hours: 9.25
          },
          {
            id: '4',
            date: '2024-01-17',
            checkIn: '08:00:00',
            checkOut: '16:30:00',
            status: 'half-day',
            hours: 8.5
          },
          {
            id: '5',
            date: '2024-01-16',
            checkIn: '08:00:00',
            checkOut: '17:00:00',
            status: 'present',
            hours: 9
          }
        ];

        setAttendanceHistory(mockHistory);
      } catch (error) {
        toast.error('Failed to load attendance history');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCheckIn = (employeeId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      date: today,
      checkIn: time,
      status: 'present',
      hours: 0
    };
    
    setAttendanceHistory(prev => [newRecord, ...prev]);
  };

  const handleCheckOut = (employeeId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    setAttendanceHistory(prev => prev.map(record => {
      if (record.date === today && record.checkIn && !record.checkOut) {
        const checkIn = new Date(`2000-01-01T${record.checkIn}`);
        const checkOut = new Date(`2000-01-01T${time}`);
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        
        return {
          ...record,
          checkOut: time,
          hours: Math.max(0, hours)
        };
      }
      return record;
    }));
  };

  const getTodayRecord = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceHistory.find(record => record.date === today);
  };

  const getStats = () => {
    const totalDays = attendanceHistory.length;
    const presentDays = attendanceHistory.filter(r => r.status === 'present').length;
    const lateDays = attendanceHistory.filter(r => r.status === 'late').length;
    const totalHours = attendanceHistory.reduce((sum, r) => sum + r.hours, 0);
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0;

    return {
      totalDays,
      presentDays,
      lateDays,
      totalHours,
      avgHours,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    };
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading attendance...</span>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-gray-600 mt-1">Manage your daily check-ins and view history</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'today'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} />
            Today
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            History
          </div>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={16} />
            Statistics
          </div>
        </button>
      </div>

      {/* Today's Attendance */}
      {activeTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeAttendanceCard
            employeeId={currentUser?.id || '1'}
            employeeName={`${currentUser?.firstName || 'John'} ${currentUser?.lastName || 'Doe'}`}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            officeLocation={mainOffice.location}
            officeNetworks={mainOffice.networks}
          />
          
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Present</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Check In:</span>
                <span className="font-mono font-medium">08:00:00</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Hours Worked:</span>
                <span className="font-medium">9.0 hours</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Attendance History */}
      {activeTab === 'history' && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Check In</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Check Out</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {record.checkIn || 'Not checked in'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {record.checkOut || 'Not checked out'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900">{record.hours}h</span>
                        {record.hours >= 8 && (
                          <CheckCircle size={14} className="text-green-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Days</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalDays}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-blue-600" />
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Present Days</p>
                  <p className="text-2xl font-bold text-green-900">{stats.presentDays}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.attendanceRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Avg. Hours</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.avgHours.toFixed(1)}h
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const hasAttendance = Math.random() > 0.3; // Mock data
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                      hasAttendance 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span>No Record</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendancePage;
