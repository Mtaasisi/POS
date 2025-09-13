import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getDiagnosticRequests } from '../../../../lib/diagnosticsApi';
import { DiagnosticRequest } from '../../types/diagnostics';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  Monitor
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AssignedDiagnosticsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DiagnosticRequest[]>([]);

  useEffect(() => {
    if (currentUser && ['technician', 'admin'].includes(currentUser.role)) {
      loadAssignedRequests();
    }
  }, [currentUser]);

  const loadAssignedRequests = async () => {
    try {
      setLoading(true);
      const data = await getDiagnosticRequests();
      // Filter for assigned requests based on user role
      const assignedRequests = data.filter(request => 
        currentUser?.role === 'admin' || request.assigned_to === currentUser?.id
      );
      setRequests(assignedRequests);
    } catch (error) {
      console.error('Error loading assigned requests:', error);
      toast.error('Failed to load assigned diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Monitor className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      submitted_for_review: 'bg-blue-100 text-blue-800'
    };
    
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!currentUser || !['technician', 'admin'].includes(currentUser.role)) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view assigned diagnostics.</p>
        </div>
      </GlassCard>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <GlassCard key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assigned Diagnostics</h2>
          <p className="text-gray-600">Diagnostic requests assigned to you</p>
        </div>
        <div className="text-sm text-gray-500">
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </div>
      </div>

      {requests.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Diagnostics</h3>
          <p className="text-gray-500">You don't have any diagnostic requests assigned to you yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <GlassCard key={request.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(request.status)}
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>By {request.created_by_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Monitor className="w-4 h-4" />
                      <span>{request.total_devices} device{request.total_devices !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {request.notes && (
                    <p className="text-gray-600 text-sm mb-4">{request.notes}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <GlassButton
                    onClick={() => {
                      // Navigate to diagnostic details
                      toast('Opening diagnostic details...');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedDiagnosticsTab;
