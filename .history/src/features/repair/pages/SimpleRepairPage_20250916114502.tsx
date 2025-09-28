import React from 'react';
import { useDevices } from '../../../context/DevicesContext';
import { useAuth } from '../../../context/AuthContext';
import { 
  Smartphone, 
  Wrench, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SimpleRepairPage: React.FC = () => {
  const { devices, loading } = useDevices();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Filter devices that are in repair status
  const repairDevices = devices.filter(device => 
    device.status && !['done', 'failed'].includes(device.status)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'diagnosis-started': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting-parts': return 'bg-orange-100 text-orange-800';
      case 'in-repair': return 'bg-purple-100 text-purple-800';
      case 'reassembled-testing': return 'bg-indigo-100 text-indigo-800';
      case 'repair-complete': return 'bg-green-100 text-green-800';
      case 'returned-to-customer-care': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'in-repair': return <Wrench className="w-4 h-4 text-purple-600" />;
      default: return <Smartphone className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading repair data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repair Service</h1>
          <p className="text-gray-600">Track and manage your assigned device repairs</p>
        </div>
        {currentUser?.role !== 'technician' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/devices/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Device</span>
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Repairs</p>
              <p className="text-2xl font-bold text-gray-900">{repairDevices.length}</p>
            </div>
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => d.status === 'done').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => d.status === 'failed').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Active Repairs */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Repairs</h2>
        
        {repairDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repairDevices.map((device) => (
              <div key={device.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(device.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {device.brand} {device.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        SN: {device.serialNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Customer:</span>
                    <span className="text-sm font-medium text-gray-900">{device.customerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm text-gray-900">{device.phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Issue:</span>
                    <span className="text-sm text-gray-900 line-clamp-2">{device.issueDescription}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                    {device.status?.replace('-', ' ')}
                  </span>
                  <button
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Repairs</h3>
            <p className="text-gray-600 mb-4">
              All devices are either completed or no repairs are in progress.
            </p>
            <button
              onClick={() => navigate('/devices/new')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Device</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/devices/new')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">New Device</p>
              <p className="text-sm text-gray-600">Add a new device for repair</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/devices')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Smartphone className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">All Devices</p>
              <p className="text-sm text-gray-600">View all devices in the system</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/customers')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckCircle className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Customers</p>
              <p className="text-sm text-gray-600">Manage customer information</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleRepairPage;
