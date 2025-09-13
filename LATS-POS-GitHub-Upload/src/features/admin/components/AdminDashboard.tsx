import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Users, 
  Settings, 
  MapPin, 
  Wifi, 
  Clock, 
  Shield, 
  BarChart3,
  Database,
  Server,
  Globe
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      id: 'attendance',
      title: 'Attendance Settings',
      description: 'Configure office locations, WiFi networks, and attendance requirements',
      icon: Users,
      color: 'blue',
      path: '/admin/settings?section=attendance'
    },
    {
      id: 'system',
      title: 'System Settings',
      description: 'Manage database, backend, integrations, and security settings',
      icon: Settings,
      color: 'green',
      path: '/admin/settings'
    },
    {
      id: 'offices',
      title: 'Office Management',
      description: 'Add, edit, and manage office locations and WiFi networks',
      icon: MapPin,
      color: 'purple',
      path: '/admin/offices'
    },
    {
      id: 'reports',
      title: 'Attendance Reports',
      description: 'View attendance reports, analytics, and employee statistics',
      icon: BarChart3,
      color: 'orange',
      path: '/admin/reports'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your system settings and configurations</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Offices</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">18</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </GlassCard>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <GlassCard 
                key={feature.id}
                className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${getColorClasses(feature.color)}`}
                onClick={() => navigate(feature.path)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg bg-white/50`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm opacity-80 mb-4">{feature.description}</p>
                <GlassButton
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(feature.path);
                  }}
                  className="w-full bg-white/50 hover:bg-white/70 text-gray-800"
                >
                  Manage
                </GlassButton>
              </GlassCard>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassButton
              onClick={() => navigate('/admin/settings?section=attendance')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Configure Attendance
            </GlassButton>
            
            <GlassButton
              onClick={() => navigate('/admin/offices')}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Manage Offices
            </GlassButton>
            
            <GlassButton
              onClick={() => navigate('/admin/reports')}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </GlassButton>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <Database className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Database</span>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <Server className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Backend</span>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">API</span>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
