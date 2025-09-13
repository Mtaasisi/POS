import React from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  MessageCircle, 
  Send, 
  Image,
  FileText,
  MapPin,
  User,
  CheckCircle,
  ChevronRight,
  BarChart3,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';

interface WhatsAppMessagingPageProps {
  instances: any[];
  messages: any[];
  searchTerm: string;
  onShowQuickMessage: () => void;
  onSetQuickMessageData: (data: any) => void;
  isDark: boolean;
}

const WhatsAppMessagingPage: React.FC<WhatsAppMessagingPageProps> = ({
  instances,
  messages,
  searchTerm,
  onShowQuickMessage,
  onSetQuickMessageData,
  isDark
}) => {
  return (
    <div className="space-y-6">
      {/* Messaging Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white min-h-[160px] hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1">
              <p className="text-green-100 text-sm font-medium mb-2">Connected Instances</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{instances.filter(i => i.status === 'connected').length}</p>
              <p className="text-green-100 text-xs opacity-80">
                {instances.filter(i => i.status === 'connected').length > 0 ? 'Ready to send' : 'No instances connected'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all duration-300">
              <MessageCircle size={32} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white min-h-[160px] hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium mb-2">Total Messages</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{messages.length}</p>
              <p className="text-blue-100 text-xs opacity-80">
                {messages.length > 0 ? `${messages.length} sent today` : 'No messages sent'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all duration-300">
              <Send size={32} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white min-h-[160px] hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1">
              <p className="text-purple-100 text-sm font-medium mb-2">Delivered</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{messages.filter(m => m.status === 'delivered').length}</p>
              <p className="text-purple-100 text-xs opacity-80">
                {messages.length > 0 ? `${Math.round((messages.filter(m => m.status === 'delivered').length / messages.length) * 100)}% success rate` : 'No deliveries yet'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all duration-300">
              <CheckCircle size={32} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white min-h-[160px] hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1">
              <p className="text-orange-100 text-sm font-medium mb-2">Failed</p>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{messages.filter(m => m.status === 'failed').length}</p>
              <p className="text-orange-100 text-xs opacity-80">
                {messages.filter(m => m.status === 'failed').length > 0 ? 'Needs attention' : 'All messages successful'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all duration-300">
              <BarChart3 size={32} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Message Types */}
      <GlassCard className="p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Message Types</h2>
            <p className="text-sm text-gray-600">Choose the type of message you want to send</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSetQuickMessageData(prev => ({
                  ...prev,
                  type: 'text',
                  message: 'Advanced testing message with multiple features:\n\n📱 Device: Test Device\n📊 Status: Connected\n🔧 Features: All enabled\n\nThis is a comprehensive test message.'
                }));
                onShowQuickMessage();
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              Quick Send
            </button>
            <button
              onClick={onShowQuickMessage}
              className="px-4 py-2 text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              Advanced Testing
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Text Messages */}
          <button
            onClick={() => {
              onSetQuickMessageData(prev => ({
                ...prev,
                type: 'text'
              }));
              onShowQuickMessage();
            }}
            className="group p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl hover:border-green-400 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left w-full min-h-[200px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
                <MessageCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Text Messages</h3>
                <p className="text-sm text-gray-600">Simple text communication</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                <span>Basic text messages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                <span>Link previews</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                <span>Typing indicators</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
              <span>Click to send text message</span>
              <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Media Messages */}
          <button
            onClick={() => {
              onSetQuickMessageData(prev => ({
                ...prev,
                type: 'image'
              }));
              onShowQuickMessage();
            }}
            className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left w-full min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <Image size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Media Messages</h3>
                <p className="text-sm text-gray-600">Images, documents, files</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-blue-500" />
                <span>Image uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-blue-500" />
                <span>Document sharing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-blue-500" />
                <span>File captions</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
              <span>Click to send media message</span>
              <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Interactive Messages */}
          <button
            onClick={() => {
              onSetQuickMessageData(prev => ({
                ...prev,
                type: 'text',
                message: 'Interactive message with buttons:\n\n1. ✅ Confirm\n2. ❌ Cancel\n3. 📞 Call Us'
              }));
              onShowQuickMessage();
            }}
            className="group p-8 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left w-full min-h-[220px]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
                <BarChart3 size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Interactive Messages</h3>
                <p className="text-sm text-gray-600">Buttons, polls, actions</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-purple-500" />
                <span>Quick reply buttons</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-purple-500" />
                <span>Call-to-action</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-purple-500" />
                <span>User engagement</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-purple-600">
              <span>Click to send interactive message</span>
              <ChevronRight size={12} />
            </div>
          </button>

          {/* Location Messages */}
          <button
            onClick={() => {
              onSetQuickMessageData(prev => ({
                ...prev,
                type: 'location'
              }));
              onShowQuickMessage();
            }}
            className="group p-8 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl hover:border-orange-300 hover:shadow-lg transition-all duration-300 text-left w-full min-h-[220px]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
                <MapPin size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Location Messages</h3>
                <p className="text-sm text-gray-600">Share locations and addresses</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-orange-500" />
                <span>GPS coordinates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-orange-500" />
                <span>Business addresses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-orange-500" />
                <span>Interactive maps</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-orange-600">
              <span>Click to send location</span>
              <ChevronRight size={12} />
            </div>
          </button>

          {/* Contact Messages */}
          <button
            onClick={() => {
              onSetQuickMessageData(prev => ({
                ...prev,
                type: 'contact'
              }));
              onShowQuickMessage();
            }}
            className="group p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300 text-left w-full min-h-[220px]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center">
                <User size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contact Messages</h3>
                <p className="text-sm text-gray-600">Share contact information</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-indigo-500" />
                <span>Contact cards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-indigo-500" />
                <span>Phone numbers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-indigo-500" />
                <span>Email addresses</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600">
              <span>Click to send contact</span>
              <ChevronRight size={12} />
            </div>
          </button>

          {/* Document Messages */}
          <button
            onClick={() => {
              onSetQuickMessageData(prev => ({
                ...prev,
                type: 'document'
              }));
              onShowQuickMessage();
            }}
            className="group p-8 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl hover:border-red-300 hover:shadow-lg transition-all duration-300 text-left w-full min-h-[220px]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center">
                <FileText size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Document Messages</h3>
                <p className="text-sm text-gray-600">Share files and documents</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-red-500" />
                <span>PDF files</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-red-500" />
                <span>Word documents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-red-500" />
                <span>Excel spreadsheets</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-red-600">
              <span>Click to send document</span>
              <ChevronRight size={12} />
            </div>
          </button>
        </div>
      </GlassCard>

      {/* Recent Messages */}
      <GlassCard className="p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Recent Messages</h2>
            <p className="text-sm text-gray-600">Track your message delivery status</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors" title="Search messages">
              <Search size={16} />
            </button>
            <button className="p-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors" title="Filter messages">
              <Filter size={16} />
            </button>
            <button className="p-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onShowQuickMessage}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              New Message
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No messages yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start sending WhatsApp messages to your customers. You can send text, media, documents, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onShowQuickMessage}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 justify-center"
              >
                <Plus size={16} />
                Send Your First Message
              </button>
              <button className="px-6 py-3 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors font-medium">
                View Templates
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.slice(0, 10).map((message, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      message.status === 'delivered' ? 'bg-green-500' :
                      message.status === 'sent' ? 'bg-blue-500' :
                      message.status === 'failed' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">Message #{message.id}</h3>
                      <p className="text-sm text-gray-500 truncate">{message.recipient || 'Unknown recipient'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      message.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {message.status}
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Type</p>
                    <p className="font-medium capitalize text-gray-900">{message.type || 'text'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Recipient</p>
                    <p className="font-medium text-gray-900 truncate">{message.recipient || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Date</p>
                    <p className="font-medium text-green-600">{new Date(message.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Time</p>
                    <p className="font-medium text-blue-600">{new Date(message.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {message.id}
                  </p>
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="View Details">
                      <Eye size={14} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default WhatsAppMessagingPage;
