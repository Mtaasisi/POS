import React from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  FileText,
  CheckCircle,
  Database,
  Plus,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Smile,
  Star,
  Bell,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface WhatsAppTemplatesPageProps {
  templates: any[];
  filteredTemplates: any[];
  searchTerm: string;
  onShowTemplateManager: () => void;
  onOpenAddTemplate: () => void;
  onSetSearchTerm: (term: string) => void;
  isDark: boolean;
}

const WhatsAppTemplatesPage: React.FC<WhatsAppTemplatesPageProps> = ({
  templates,
  filteredTemplates,
  searchTerm,
  onShowTemplateManager,
  onOpenAddTemplate,
  onSetSearchTerm,
  isDark
}) => {
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

  return (
    <div className="space-y-6">
      {/* Templates Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Templates</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{filteredTemplates.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Templates</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{filteredTemplates.filter(t => t.is_active).length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-blue-100 text-sm font-medium">Categories</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{new Set(filteredTemplates.map(t => t.category)).size}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Database size={28} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Template Management */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Message Templates</h2>
          <button
            onClick={onOpenAddTemplate}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>

        {/* Template Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => onSetSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={searchTerm}
              onChange={(e) => onSetSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="pos">POS/Orders</option>
              <option value="customer">Customer Service</option>
              <option value="support">Support</option>
              <option value="marketing">Marketing</option>
              <option value="appointment">Appointments</option>
              <option value="reminder">Reminders</option>
              <option value="promotional">Promotional</option>
            </select>
            <button
              onClick={() => onSetSearchTerm('')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Create message templates for quick access'}
            </p>
            {!searchTerm && (
              <button
                onClick={onOpenAddTemplate}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template, index) => (
              <div key={template.id || index} className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getTemplateColorClasses(template.category || 'general')} rounded-lg flex items-center justify-center`}>
                      <FileText size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{template.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye size={14} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600" title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Template Categories */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Template Categories</h2>
          <button
            onClick={onShowTemplateManager}
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

export default WhatsAppTemplatesPage;
