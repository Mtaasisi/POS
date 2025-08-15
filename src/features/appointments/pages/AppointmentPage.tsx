import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Calendar, Clock, User, Phone, Plus, Edit, Trash2, 
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: string;
  technicianName?: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

const AppointmentPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            customerName: 'John Doe',
            customerPhone: '+255 123 456 789',
            customerEmail: 'john@example.com',
            serviceType: 'Device Repair',
            technicianName: 'Mike Technician',
            date: '2024-01-20',
            time: '09:00',
            duration: 60,
            status: 'confirmed',
            notes: 'iPhone screen replacement',
            priority: 'medium'
          },
          {
            id: '2',
            customerName: 'Sarah Smith',
            customerPhone: '+255 987 654 321',
            customerEmail: 'sarah@example.com',
            serviceType: 'Device Diagnostics',
            technicianName: 'Lisa Tech',
            date: '2024-01-20',
            time: '11:00',
            duration: 30,
            status: 'scheduled',
            notes: 'Laptop not turning on',
            priority: 'high'
          }
        ];
        setAppointments(mockAppointments);
      } catch (error) {
        toast.error('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchQuery || 
      appointment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.serviceType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const metrics = {
    total: appointments.length,
    today: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
    pending: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading appointments...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage customer appointments and scheduling</p>
          </div>
        </div>

        <GlassButton
          onClick={() => setShowCreateModal(true)}
          icon={<Plus size={18} />}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white"
        >
          New Appointment
        </GlassButton>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Appointments</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-green-900">{metrics.today}</p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{metrics.pending}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Completed</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search appointments by customer or service..."
              className="w-full"
              suggestions={appointments.map(a => a.customerName)}
              searchKey="appointment_search"
            />
          </div>

          <GlassSelect
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter by Status"
            className="min-w-[150px]"
          />
        </div>
      </GlassCard>

      {/* Appointments List */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Service</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Technician</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.customerName}</p>
                      <p className="text-sm text-gray-500">{appointment.customerEmail}</p>
                      <p className="text-xs text-gray-400">{appointment.customerPhone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.serviceType}</p>
                      <p className="text-sm text-gray-500">{appointment.duration} min</p>
                      {appointment.notes && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{appointment.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.date}</p>
                      <p className="text-sm text-gray-500">{appointment.time}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {appointment.technicianName || 'Unassigned'}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                      {appointment.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                      >
                        Edit
                      </GlassButton>
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first appointment'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <GlassButton
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Create Your First Appointment
              </GlassButton>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AppointmentPage;
