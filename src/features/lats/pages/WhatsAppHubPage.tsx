import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  MessageCircle, 
  Send, 
  Wifi,
  Settings,
  Users,
  BarChart3,
  Plus,
  Target,
  FileText,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const WhatsAppHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(false);

  const handleNavigate = (path: string) => {
    setLoading(true);
    navigate(path);
  };

  const hubFeatures = [
    {
      title: 'Connection Manager',
      description: 'Manage WhatsApp instances and connections',
      icon: <Wifi size={24} />,
      path: '/lats/whatsapp-connection-manager',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'WhatsApp Chat',
      description: 'Send and receive WhatsApp messages',
      icon: <MessageCircle size={24} />,
      path: '/lats/whatsapp-chat',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Message Templates',
      description: 'Create and manage message templates',
      icon: <FileText size={24} />,
      path: '/lats/whatsapp-templates',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Bulk Messaging',
      description: 'Send messages to multiple recipients',
      icon: <Send size={24} />,
      path: '/lats/whatsapp-bulk',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Analytics',
      description: 'View messaging statistics and reports',
      icon: <BarChart3 size={24} />,
      path: '/lats/whatsapp-analytics',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
    {
      title: 'Settings',
      description: 'Configure WhatsApp integration settings',
      icon: <Settings size={24} />,
      path: '/lats/whatsapp-settings',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              WhatsApp Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your WhatsApp integration and messaging features
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Connected</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard 
          className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => handleNavigate('/lats/whatsapp-connection-manager')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Instances</p>
              <p className="text-2xl font-bold mt-1">3</p>
              <p className="text-green-100 text-xs mt-2 opacity-80">Click to manage →</p>
            </div>
            <Wifi size={32} className="text-green-100" />
          </div>
        </GlassCard>

        <GlassCard 
          className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => handleNavigate('/lats/whatsapp-analytics')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Messages Sent</p>
              <p className="text-2xl font-bold mt-1">1,247</p>
              <p className="text-blue-100 text-xs mt-2 opacity-80">Click to view analytics →</p>
            </div>
            <Send size={32} className="text-blue-100" />
          </div>
        </GlassCard>

        <GlassCard 
          className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => handleNavigate('/lats/whatsapp-templates')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Templates</p>
              <p className="text-2xl font-bold mt-1">12</p>
              <p className="text-purple-100 text-xs mt-2 opacity-80">Click to manage →</p>
            </div>
            <FileText size={32} className="text-purple-100" />
          </div>
        </GlassCard>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubFeatures.map((feature, index) => (
          <GlassCard 
            key={index}
            className={`p-6 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${feature.bgColor} dark:bg-gray-800`}
            onClick={() => handleNavigate(feature.path)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} text-white`}>
                {feature.icon}
              </div>
              <ChevronRight size={20} className={`${feature.textColor} dark:text-gray-400`} />
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 ${feature.textColor} dark:text-white`}>
              {feature.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {feature.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Click to access
              </span>
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleNavigate('/lats/whatsapp-connection-manager')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add New Instance</span>
          </button>
          
          <button
            onClick={() => handleNavigate('/lats/whatsapp-chat')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Send Message</span>
          </button>
          
          <button
            onClick={() => handleNavigate('/lats/whatsapp-templates')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <FileText size={16} />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important Notice
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Make sure your WhatsApp instances are properly authorized before sending messages. 
              Use the Connection Manager to check and manage your instance status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppHubPage;
