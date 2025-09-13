import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Users, Search, Plus, Edit, Trash2, Shield, UserCheck, UserX, 
  Mail, Phone, Calendar, Eye, EyeOff, Lock, Unlock, Settings,
  Filter, Download, Upload, RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'technician' | 'customer-care' | 'user';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  phone?: string;
  department?: string;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const UserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Mock users data
        const mockUsers: User[] = [
          {
            id: '1',
            email: 'admin@company.com',
            firstName: 'John',
            lastName: 'Admin',
            role: 'admin',
            status: 'active',
            lastLogin: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            phone: '+255 123 456 789',
            department: 'IT',
            permissions: ['all']
          },
          {
            id: '2',
            email: 'manager@company.com',
            firstName: 'Sarah',
            lastName: 'Manager',
            role: 'manager',
            status: 'active',
            lastLogin: '2024-01-14T15:45:00Z',
            createdAt: '2024-01-02T00:00:00Z',
            phone: '+255 987 654 321',
            department: 'Sales',
            permissions: ['inventory', 'customers', 'reports']
          },
          {
            id: '3',
            email: 'tech@company.com',
            firstName: 'Mike',
            lastName: 'Technician',
            role: 'technician',
            status: 'active',
            lastLogin: '2024-01-13T09:15:00Z',
            createdAt: '2024-01-03T00:00:00Z',
            phone: '+255 555 123 456',
            department: 'Service',
            permissions: ['devices', 'diagnostics']
          },
          {
            id: '4',
            email: 'care@company.com',
            firstName: 'Lisa',
            lastName: 'CustomerCare',
            role: 'customer-care',
            status: 'active',
            lastLogin: '2024-01-12T14:20:00Z',
            createdAt: '2024-01-04T00:00:00Z',
            phone: '+255 777 888 999',
            department: 'Support',
            permissions: ['customers', 'diagnostics']
          },
          {
            id: '5',
            email: 'newuser@company.com',
            firstName: 'Alex',
            lastName: 'NewUser',
            role: 'user',
            status: 'pending',
            createdAt: '2024-01-15T00:00:00Z',
            phone: '+255 111 222 333',
            department: 'Marketing',
            permissions: ['basic']
          }
        ];

        // Mock roles data
        const mockRoles: Role[] = [
          {
            id: 'admin',
            name: 'Administrator',
            description: 'Full system access and control',
            permissions: ['all'],
            userCount: 1
          },
          {
            id: 'manager',
            name: 'Manager',
            description: 'Department management and reporting',
            permissions: ['inventory', 'customers', 'reports', 'employees'],
            userCount: 1
          },
          {
            id: 'technician',
            name: 'Technician',
            description: 'Device diagnostics and repair',
            permissions: ['devices', 'diagnostics', 'spare-parts'],
            userCount: 1
          },
          {
            id: 'customer-care',
            name: 'Customer Care',
            description: 'Customer support and service',
            permissions: ['customers', 'diagnostics', 'appointments'],
            userCount: 1
          },
          {
            id: 'user',
            name: 'User',
            description: 'Basic system access',
            permissions: ['basic'],
            userCount: 1
          }
        ];

        setUsers(mockUsers);
        setRoles(mockRoles);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate metrics
  const metrics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length
  };

  // Handle user actions
  const handleCreateUser = () => {
    setShowCreateUser(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUser(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // API call to delete user
        setUsers(users.filter(u => u.id !== userId));
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    switch (action) {
      case 'activate':
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, status: 'active' } : u
        ));
        toast.success(`${selectedUsers.length} users activated`);
        break;
      case 'deactivate':
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, status: 'inactive' } : u
        ));
        toast.success(`${selectedUsers.length} users deactivated`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
          setUsers(users.filter(u => !selectedUsers.includes(u.id)));
          toast.success(`${selectedUsers.length} users deleted`);
        }
        break;
      default:
        toast.error('Unknown action');
    }
    setSelectedUsers([]);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      case 'customer-care': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => setShowRoleManagement(true)}
            variant="secondary"
            icon={<Shield size={18} />}
          >
            Manage Roles
          </GlassButton>
          <GlassButton
            onClick={handleCreateUser}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
          >
            Add User
          </GlassButton>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Users</p>
              <p className="text-2xl font-bold text-green-900">{metrics.activeUsers}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending Users</p>
              <p className="text-2xl font-bold text-yellow-900">{metrics.pendingUsers}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Inactive Users</p>
              <p className="text-2xl font-bold text-red-900">{metrics.inactiveUsers}</p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search users by name, email, or department..."
              className="w-full"
              suggestions={users.map(u => `${u.firstName} ${u.lastName}`)}
              searchKey="user_management_search"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <GlassSelect
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'admin', label: 'Administrator' },
                { value: 'manager', label: 'Manager' },
                { value: 'technician', label: 'Technician' },
                { value: 'customer-care', label: 'Customer Care' },
                { value: 'user', label: 'User' }
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Filter by Role"
              className="min-w-[150px]"
            />

            <GlassSelect
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by Status"
              className="min-w-[150px]"
            />
          </div>
        </div>
      </GlassCard>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <GlassCard className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <GlassButton
                onClick={() => handleBulkAction('activate')}
                variant="secondary"
                size="sm"
                icon={<UserCheck size={16} />}
              >
                Activate
              </GlassButton>
              <GlassButton
                onClick={() => handleBulkAction('deactivate')}
                variant="secondary"
                size="sm"
                icon={<UserX size={16} />}
              >
                Deactivate
              </GlassButton>
              <GlassButton
                onClick={() => handleBulkAction('delete')}
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
              >
                Delete
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Users Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Login</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-gray-400">{user.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.department || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => handleEditUser(user)}
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                      >
                        Edit
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleToggleUserStatus(user.id)}
                        variant="ghost"
                        size="sm"
                        icon={user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleDeleteUser(user.id)}
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first user'
              }
            </p>
            {!searchQuery && roleFilter === 'all' && statusFilter === 'all' && (
              <GlassButton
                onClick={handleCreateUser}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Add Your First User
              </GlassButton>
            )}
          </div>
        )}
      </GlassCard>

      {/* Modals would go here */}
      {/* CreateUserModal, EditUserModal, RoleManagementModal */}
    </div>
  );
};

export default UserManagementPage;
