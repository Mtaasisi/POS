import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  MessageCircle, 
  Send, 
  Target,
  FileText,
  TrendingUp,
  Settings,
  BarChart3,
  Users,
  Bell
} from 'lucide-react';

const WhatsAppHubPage: React.FC = () => {
  const hubFeatures = [
    {
      title: 'WhatsApp Chat',
      description: 'Send and receive WhatsApp messages',
      icon: MessageCircle,
      path: '/lats/whatsapp-chat',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Connection Manager',
      description: 'Manage WhatsApp instance connections',
      icon: Settings,
      path: '/lats/whatsapp-connection-manager',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Message Templates',
      description: 'Create and manage message templates',
      icon: FileText,
      path: '/lats/whatsapp-templates',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Bulk Messaging',
      description: 'Send messages to multiple recipients',
      icon: Send,
      path: '/lats/whatsapp-bulk',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Analytics',
      description: 'View messaging statistics and reports',
      icon: BarChart3,
      path: '/lats/whatsapp-analytics',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Campaigns',
      description: 'Manage marketing campaigns',
      icon: Target,
      path: '/lats/whatsapp-campaigns',
      color: 'from-pink-500 to-pink-600'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">WhatsApp Hub</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Centralized management for all WhatsApp operations including messaging, 
          templates, analytics, and campaign management.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Connected Instances</p>
              <p className="text-3xl font-bold">3</p>
            </div>
            <MessageCircle size={32} className="text-green-100" />
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Campaigns</p>
              <p className="text-3xl font-bold">2</p>
            </div>
            <Target size={32} className="text-blue-100" />
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Message Templates</p>
              <p className="text-3xl font-bold">15</p>
            </div>
            <FileText size={32} className="text-purple-100" />
          </div>
        </GlassCard>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubFeatures.map((feature, index) => (
          <Link key={index} to={feature.path}>
            <GlassCard className={`p-6 bg-gradient-to-br ${feature.color} text-white hover:shadow-xl transition-all duration-300 cursor-pointer group h-full`}>
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm opacity-90">{feature.description}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all duration-300">
                  <feature.icon size={24} />
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <MessageCircle size={20} />
            Send Quick Message
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Users size={20} />
            New Campaign
          </button>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
            <FileText size={20} />
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppHubPage;
