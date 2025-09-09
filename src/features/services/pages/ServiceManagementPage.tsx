import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Wrench, DollarSign, Clock, Users, Plus, Edit, Trash2, 
  CheckCircle, AlertTriangle, Package, Star, TrendingUp, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  cost: number;
  status: 'active' | 'inactive' | 'draft';
  warrantyDays: number;
  popularity: number;
}

interface ServiceRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  notes?: string;
  technicianName?: string;
}

const ServiceManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [services, setServices] = useState<Service[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'requests'>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const mockServices: Service[] = [
          {
            id: '1',
            name: 'iPhone Screen Replacement',
            description: 'Replace cracked or broken iPhone screens',
            category: 'Device Repair',
            duration: 60,
            price: 80000,
            cost: 45000,
            status: 'active',
            warrantyDays: 90,
            popularity: 5
          },
          {
            id: '2',
            name: 'Laptop Diagnostics',
            description: 'Comprehensive laptop diagnostics',
            category: 'Diagnostics',
            duration: 30,
            price: 15000,
            cost: 5000,
            status: 'active',
            warrantyDays: 30,
            popularity: 4
          }
        ];

        const mockRequests: ServiceRequest[] = [
          {
            id: 'req1',
            customerName: 'John Doe',
            customerPhone: '+255 123 456 789',
            customerEmail: 'john@example.com',
            serviceName: 'iPhone Screen Replacement',
            status: 'approved',
            priority: 'medium',
            estimatedCost: 80000,
            notes: 'iPhone 12 Pro Max, black screen',
            technicianName: 'Mike Technician'
          }
        ];

        setServices(mockServices);
        setServiceRequests(mockRequests);
      } catch (error) {
        toast.error('Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading services...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
            <p className="text-gray-600 mt-1">Manage service catalog and service requests</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {activeTab === 'services' ? (
            <GlassButton
              onClick={() => setShowCreateService(true)}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Add Service
            </GlassButton>
          ) : (
            <GlassButton
              onClick={() => setShowCreateRequest(true)}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              New Request
            </GlassButton>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'services'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench size={16} />
            Services ({services.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package size={16} />
            Service Requests ({serviceRequests.length})
          </div>
        </button>
      </div>

      {/* Statistics */}
      {activeTab === 'services' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Services</p>
                <p className="text-2xl font-bold text-blue-900">{services.length}</p>
              </div>
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
          </GlassCard>
          
          <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Services</p>
                <p className="text-2xl font-bold text-green-900">
                  {services.filter(s => s.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </GlassCard>
          
          <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  {new Intl.NumberFormat('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(services.reduce((sum, s) => sum + s.price, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </GlassCard>
          
          <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg. Price</p>
                <p className="text-2xl font-bold text-orange-900">
                  {services.length > 0 ? new Intl.NumberFormat('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(services.reduce((sum, s) => sum + s.price, 0) / services.length) : 'TZS 0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-900">{serviceRequests.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </GlassCard>
          
          <GlassCard className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {serviceRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </GlassCard>
          
          <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {serviceRequests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </GlassCard>
          
          <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  {new Intl.NumberFormat('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(serviceRequests.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.estimatedCost, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Search and Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder={activeTab === 'services' 
                ? "Search services by name, description, or category..."
                : "Search requests by customer or service..."
              }
              className="w-full"
              suggestions={activeTab === 'services' 
                ? services.map(s => s.name)
                : serviceRequests.map(r => r.customerName)
              }
              searchKey={`service_${activeTab}_search`}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {activeTab === 'services' ? (
              <>
                <GlassSelect
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'Device Repair', label: 'Device Repair' },
                    { value: 'Diagnostics', label: 'Diagnostics' },
                    { value: 'Software', label: 'Software' },
                    { value: 'Data Recovery', label: 'Data Recovery' },
                    { value: 'Security', label: 'Security' }
                  ]}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder="Filter by Category"
                  className="min-w-[150px]"
                />
                <GlassSelect
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'draft', label: 'Draft' }
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Filter by Status"
                  className="min-w-[150px]"
                />
              </>
            ) : (
              <GlassSelect
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by Status"
                className="min-w-[150px]"
              />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Services List */}
      {activeTab === 'services' && (
        <GlassCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Popularity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services
                  .filter(service => {
                    const matchesSearch = !searchQuery || 
                      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
                    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
                    return matchesSearch && matchesCategory && matchesStatus;
                  })
                  .map((service) => (
                  <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[300px]">{service.description}</p>
                        <p className="text-xs text-gray-400">Warranty: {service.warrantyDays} days</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {service.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {service.duration >= 60 
                            ? `${Math.floor(service.duration / 60)}h ${service.duration % 60}m`
                            : `${service.duration}m`
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Intl.NumberFormat('en-TZ', {
                            style: 'currency',
                            currency: 'TZS',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(service.price)}
                        </p>
                        <p className="text-xs text-gray-500">Cost: {new Intl.NumberFormat('en-TZ', {
                          style: 'currency',
                          currency: 'TZS',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(service.cost)}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.status === 'active' ? 'bg-green-100 text-green-800' :
                        service.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < service.popularity ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({service.popularity})</span>
                      </div>
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

          {services.filter(service => {
            const matchesSearch = !searchQuery || 
              service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
          }).length === 0 && (
            <div className="text-center py-8">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first service'
                }
              </p>
              {!searchQuery && categoryFilter === 'all' && statusFilter === 'all' && (
                <GlassButton
                  onClick={() => setShowCreateService(true)}
                  icon={<Plus size={18} />}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                  Add Your First Service
                </GlassButton>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {/* Service Requests List */}
      {activeTab === 'requests' && (
        <GlassCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Estimated Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Technician</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests
                  .filter(request => {
                    const matchesSearch = !searchQuery || 
                      request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      request.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
                    return matchesSearch && matchesStatus;
                  })
                  .map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{request.customerName}</p>
                        <p className="text-sm text-gray-500">{request.customerEmail}</p>
                        <p className="text-xs text-gray-400">{request.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{request.serviceName}</p>
                        {request.notes && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{request.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('en-TZ', {
                          style: 'currency',
                          currency: 'TZS',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(request.estimatedCost)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">
                        {request.technicianName || 'Unassigned'}
                      </p>
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

          {serviceRequests.filter(request => {
            const matchesSearch = !searchQuery || 
              request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              request.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).length === 0 && (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first service request'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <GlassButton
                  onClick={() => setShowCreateRequest(true)}
                  icon={<Plus size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                >
                  Create Your First Request
                </GlassButton>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {/* Create Service Modal */}
      {showCreateService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Service</h2>
                <button
                  onClick={() => setShowCreateService(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., iPhone Screen Replacement"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Category</option>
                      <option value="Device Repair">Device Repair</option>
                      <option value="Diagnostics">Diagnostics</option>
                      <option value="Software">Software</option>
                      <option value="Data Recovery">Data Recovery</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the service in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="60"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (TZS)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="80000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost (TZS)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="45000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warranty (days)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="90"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <GlassButton
                onClick={() => setShowCreateService(false)}
                variant="ghost"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={() => {
                  toast.success('Service created successfully!');
                  setShowCreateService(false);
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Create Service
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Create Service Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Service Request</h2>
                <button
                  onClick={() => setShowCreateRequest(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+255 123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Cost (TZS)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="80000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about the service request..."
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <GlassButton
                onClick={() => setShowCreateRequest(false)}
                variant="ghost"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={() => {
                  toast.success('Service request created successfully!');
                  setShowCreateRequest(false);
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                Create Request
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementPage;
