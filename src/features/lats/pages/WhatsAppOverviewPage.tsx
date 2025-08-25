import React from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  MessageCircle, 
  Send, 
  Target,
  FileText,
  TrendingUp,
  ChevronRight,
  Plus,
  BarChart3,
  Settings,
  Smile,
  Star,
  Bell,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface WhatsAppOverviewPageProps {
  instances: any[];
  campaigns: any[];
  templates: any[];
  filteredTemplates: any[];
  filteredCampaigns: any[];
  searchTerm: string;
  lastUpdate: Date;
  settings: any;
  silentRefreshing: boolean;
  nextRefresh: Date;
  onShowQuickMessage: () => void;
  onShowBulkCreator: () => void;
  onShowTemplateManager: () => void;
  onShowSettings: () => void;
  onLoadData: (refresh?: boolean) => void;
  onSetActiveSection: (section: string) => void;
  isDark: boolean;
}

const WhatsAppOverviewPage: React.FC<WhatsAppOverviewPageProps> = ({
  instances,
  campaigns,
  templates,
  filteredTemplates,
  filteredCampaigns,
  searchTerm,
  lastUpdate,
  settings,
  silentRefreshing,
  nextRefresh,
  onShowQuickMessage,
  onShowBulkCreator,
  onShowTemplateManager,
  onShowSettings,
  onLoadData,
  onSetActiveSection,
  isDark
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <GlassCard className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-green-100 text-sm font-medium">Connected Instances</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{instances.filter(i => i.status === 'connected').length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Campaigns</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{campaigns.filter(c => c.status === 'sending').length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-purple-100 text-sm font-medium">Message Templates</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{filteredTemplates.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Campaigns</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{campaigns.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={28} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <button
            onClick={() => onSetActiveSection('messaging')}
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Send Quick Message */}
          <button
            onClick={onShowQuickMessage}
            className="group p-8 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-300 text-left min-h-[180px]"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Send Quick Message</h3>
                <p className="text-sm text-gray-600">Send a single message</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Perfect for urgent notifications or quick responses</p>
          </button>

          {/* Create Bulk Campaign */}
          <button
            onClick={onShowBulkCreator}
            className="group p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-left min-h-[180px]"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Bulk Campaign</h3>
                <p className="text-sm text-gray-600">Send to multiple recipients</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Reach your entire audience with one campaign</p>
          </button>

          {/* Manage Templates */}
          <button
            onClick={onShowTemplateManager}
            className="group p-8 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left min-h-[180px]"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Message Templates</h3>
                <p className="text-sm text-gray-600">Manage your templates</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Create and organize message templates</p>
          </button>

          {/* View Analytics */}
          <button
            onClick={() => onSetActiveSection('analytics')}
            className="group p-8 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl hover:border-orange-300 hover:shadow-lg transition-all duration-300 text-left min-h-[180px]"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600">Check performance metrics</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Monitor delivery rates and campaign success</p>
          </button>

          {/* Manage Instances */}
          <button
            onClick={onShowSettings}
            className="group p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300 text-left min-h-[180px]"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Instances</h3>
                <p className="text-sm text-gray-600">Configure WhatsApp instances</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Add, edit, or remove WhatsApp connections</p>
          </button>
        </div>
      </GlassCard>

      {/* Campaign Templates */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Campaign Templates</h2>
          <button
            onClick={() => onSetActiveSection('templates')}
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
          >
            Manage Templates
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[
            { 
              name: 'Welcome Campaign', 
              description: 'Welcome new customers with a personalized message',
              icon: Smile,
              color: 'green',
              template: {
                id: 'welcome-campaign',
                name: 'Welcome Campaign',
                content: 'Welcome to our service! We\'re excited to have you on board. Here\'s what you can expect from us...',
                category: 'welcome',
                is_active: true
              }
            },
            { 
              name: 'Promotional Campaign', 
              description: 'Announce special offers and promotions',
              icon: Star,
              color: 'orange',
              template: {
                id: 'promotional-campaign',
                name: 'Promotional Campaign',
                content: '🎉 Special offer just for you! Get 20% off on your next purchase. Use code: SAVE20. Limited time only!',
                category: 'promotional',
                is_active: true
              }
            },
            { 
              name: 'Support Campaign', 
              description: 'Provide customer support and updates',
              icon: Bell,
              color: 'blue',
              template: {
                id: 'support-campaign',
                name: 'Support Campaign',
                content: 'We\'re here to help! If you have any questions or need assistance, please don\'t hesitate to contact us.',
                category: 'support',
                is_active: true
              }
            },
            { 
              name: 'Reminder Campaign', 
              description: 'Send appointment and event reminders',
              icon: Calendar,
              color: 'purple',
              template: {
                id: 'reminder-campaign',
                name: 'Reminder Campaign',
                content: 'Reminder: You have an upcoming appointment on {{date}} at {{time}}. Please confirm your attendance.',
                category: 'reminder',
                is_active: true
              }
            },
            { 
              name: 'Newsletter Campaign', 
              description: 'Share updates and news with subscribers',
              icon: FileText,
              color: 'indigo',
              template: {
                id: 'newsletter-campaign',
                name: 'Newsletter Campaign',
                content: '📰 Latest updates from our team: {{news}}. Stay tuned for more exciting announcements!',
                category: 'newsletter',
                is_active: true
              }
            },
            { 
              name: 'Emergency Campaign', 
              description: 'Send urgent notifications and alerts',
              icon: AlertTriangle,
              color: 'red',
              template: {
                id: 'emergency-campaign',
                name: 'Emergency Campaign',
                content: '🚨 Important: {{emergency_message}}. Please take necessary action immediately.',
                category: 'emergency',
                is_active: true
              }
            }
          ].map((template, index) => (
            <button
              key={index}
              onClick={() => {
                // Handle template selection
                console.log('Template selected:', template);
              }}
              className="group p-8 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-left min-h-[220px]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 ${getTemplateColorClasses(template.color)} rounded-xl flex items-center justify-center`}>
                  <template.icon size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Pre-built message</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Target audience</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Easy customization</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span>Click to use template</span>
                <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// Helper function for template colors
const getTemplateColorClasses = (color: string) => {
  switch (color) {
    case 'green': return 'bg-green-500';
    case 'blue': return 'bg-blue-500';
    case 'purple': return 'bg-purple-500';
    case 'orange': return 'bg-orange-500';
    case 'indigo': return 'bg-indigo-500';
    case 'red': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export default WhatsAppOverviewPage;
