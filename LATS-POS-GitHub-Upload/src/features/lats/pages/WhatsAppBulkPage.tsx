import React from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  Target,
  Play,
  CheckCircle,
  FileText,
  Plus,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Activity,
  TrendingUp
} from 'lucide-react';

interface WhatsAppBulkPageProps {
  campaigns: any[];
  filteredCampaigns: any[];
  searchTerm: string;
  onShowBulkCreator: () => void;
  onNavigateToGreenApi: (section: string) => void;
  isDark: boolean;
}

const WhatsAppBulkPage: React.FC<WhatsAppBulkPageProps> = ({
  campaigns,
  filteredCampaigns,
  searchTerm,
  onShowBulkCreator,
  onNavigateToGreenApi,
  isDark
}) => {
  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <GlassCard className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Campaigns</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{filteredCampaigns.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Campaigns</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{filteredCampaigns.filter(c => c.status === 'sending').length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Play size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-purple-100 text-sm font-medium">Completed</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{filteredCampaigns.filter(c => c.status === 'completed').length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-orange-100 text-sm font-medium">Draft Campaigns</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{filteredCampaigns.filter(c => c.status === 'draft').length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={28} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Campaign Management */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Campaign Management</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToGreenApi('campaigns')}
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight size={14} />
            </button>
            <button
              onClick={onShowBulkCreator}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              New Campaign
            </button>
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Target size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No campaigns found' : 'No campaigns yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first bulk messaging campaign'}
            </p>
            {!searchTerm && (
              <button
                onClick={onShowBulkCreator}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.slice(0, 10).map((campaign) => (
              <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      campaign.status === 'completed' ? 'bg-green-500' :
                      campaign.status === 'sending' ? 'bg-blue-500' :
                      campaign.status === 'failed' ? 'bg-red-500' :
                      campaign.status === 'paused' ? 'bg-orange-500' :
                      'bg-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Recipients</p>
                    <p className="font-medium">{campaign.total_recipients}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sent</p>
                    <p className="font-medium text-green-600">{campaign.sent_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivered</p>
                    <p className="font-medium text-blue-600">{campaign.delivered_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Failed</p>
                    <p className="font-medium text-red-600">{campaign.failed_count}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(campaign.created_at).toLocaleDateString()}
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

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Campaign */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Plus size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Campaign</h3>
                <p className="text-sm text-gray-600">Start a new bulk messaging campaign</p>
              </div>
            </div>
            <button
              onClick={onShowBulkCreator}
              className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Create Campaign
            </button>
          </div>

          {/* Manage Campaigns */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Campaigns</h3>
                <p className="text-sm text-gray-600">View and manage all campaigns</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToGreenApi('campaigns')}
              className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              View All
            </button>
          </div>

          {/* Campaign Analytics */}
          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Campaign Analytics</h3>
                <p className="text-sm text-gray-600">Monitor performance metrics</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToGreenApi('analytics')}
              className="w-full py-3 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              View Analytics
            </button>
          </div>

          {/* Recipient Management */}
          <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recipient Management</h3>
                <p className="text-sm text-gray-600">Manage your contact lists</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToGreenApi('contacts')}
              className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Manage Contacts
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default WhatsAppBulkPage;
