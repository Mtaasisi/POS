import React, { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw, FiTrash2, FiEdit3, FiPhone, FiWifi, FiWifiOff, FiSettings, FiQrCode } from 'react-icons/fi';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface WhatsAppInstance {
  id: string;
  instance_id: string;
  api_token: string;
  instance_name?: string;
  description?: string;
  green_api_host: string;
  green_api_url?: string;
  state_instance: string;
  status: string;
  phone_number?: string;
  wid?: string;
  country_instance?: string;
  type_account?: string;
  is_active: boolean;
  last_connected_at?: string;
  last_activity_at?: string;
  profile_name?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface ConnectionSettings {
  id?: string;
  instance_id: string;
  webhook_url?: string;
  webhook_url_token?: string;
  mark_incoming_messages_readed: string;
  mark_incoming_messages_readed_on_reply: string;
  delay_send_messages_milliseconds: number;
  incoming_webhook: string;
  outgoing_webhook: string;
  outgoing_message_webhook: string;
  outgoing_api_message_webhook: string;
  state_webhook: string;
  device_webhook: string;
  incoming_call_webhook: string;
  poll_message_webhook: string;
  edited_message_webhook: string;
  deleted_message_webhook: string;
  incoming_block_webhook: string;
  keep_online_status: string;
}

const WhatsAppConnectionManager: React.FC = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [settings, setSettings] = useState<{ [key: string]: ConnectionSettings }>({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [editingInstance, setEditingInstance] = useState<WhatsAppInstance | null>(null);

  // New instance form state
  const [newInstance, setNewInstance] = useState({
    instance_id: '',
    api_token: '',
    instance_name: '',
    description: '',
    green_api_host: 'https://api.green-api.com'
  });

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching WhatsApp instances...');
      
      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching instances:', error);
        toast.error(`Failed to fetch instances: ${error.message}`);
        return;
      }

      console.log(`✅ Fetched ${data?.length || 0} instances`);
      setInstances(data || []);
    } catch (error: any) {
      console.error('❌ Exception fetching instances:', error);
      toast.error('Failed to load WhatsApp instances');
    } finally {
      setLoading(false);
    }
  };

  const addInstance = async () => {
    try {
      if (!newInstance.instance_id || !newInstance.api_token) {
        toast.error('Instance ID and API Token are required');
        return;
      }

      setLoading(true);
      console.log('🔧 Creating new WhatsApp instance...');

      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .insert({
          instance_id: newInstance.instance_id,
          api_token: newInstance.api_token,
          instance_name: newInstance.instance_name || newInstance.instance_id,
          description: newInstance.description,
          green_api_host: newInstance.green_api_host,
          green_api_url: `${newInstance.green_api_host}/waInstance${newInstance.instance_id}`,
          state_instance: 'notAuthorized',
          status: 'disconnected',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating instance:', error);
        toast.error(`Failed to create instance: ${error.message}`);
        return;
      }

      console.log('✅ Instance created successfully');
      toast.success('WhatsApp instance created successfully!');
      
      // Reset form
      setNewInstance({
        instance_id: '',
        api_token: '',
        instance_name: '',
        description: '',
        green_api_host: 'https://api.green-api.com'
      });
      
      setShowAddModal(false);
      fetchInstances();
    } catch (error: any) {
      console.error('❌ Exception creating instance:', error);
      toast.error('Failed to create instance');
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!confirm('Are you sure you want to delete this WhatsApp instance? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      console.log(`🗑️ Deleting instance: ${instanceId}`);

      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .delete()
        .eq('instance_id', instanceId);

      if (error) {
        console.error('❌ Error deleting instance:', error);
        toast.error(`Failed to delete instance: ${error.message}`);
        return;
      }

      console.log('✅ Instance deleted successfully');
      toast.success('Instance deleted successfully');
      fetchInstances();
    } catch (error: any) {
      console.error('❌ Exception deleting instance:', error);
      toast.error('Failed to delete instance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'authorized':
        return 'text-green-600 bg-green-100';
      case 'notAuthorized':
        return 'text-red-600 bg-red-100';
      case 'starting':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Connection Manager</h1>
              <p className="text-gray-600 mt-1">Manage your WhatsApp instances and connections</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchInstances}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Instance
              </button>
            </div>
          </div>
        </div>

        {/* Instances List */}
        <div className="p-6">
          {loading && instances.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading instances...</p>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8">
              <FiWifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No WhatsApp Instances</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first WhatsApp instance</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Instance
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance) => (
                <div key={instance.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  {/* Instance Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {instance.instance_name || instance.instance_id}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">ID: {instance.instance_id}</p>
                        {instance.phone_number && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <FiPhone className="w-3 h-3 mr-1" />
                            {instance.phone_number}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedInstanceId(instance.instance_id);
                            setShowSettingsModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Settings"
                        >
                          <FiSettings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteInstance(instance.instance_id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Instance Status */}
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                          {instance.status === 'connected' ? <FiWifi className="w-3 h-3 mr-1" /> : <FiWifiOff className="w-3 h-3 mr-1" />}
                          {instance.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">State:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(instance.state_instance)}`}>
                          {instance.state_instance}
                        </span>
                      </div>

                      {instance.description && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-700 mb-1">Description:</p>
                          <p className="text-xs">{instance.description}</p>
                        </div>
                      )}

                      {instance.last_connected_at && (
                        <div className="text-xs text-gray-500">
                          Last connected: {new Date(instance.last_connected_at).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
                        title="Get QR Code"
                      >
                        <FiQrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </button>
                      <button
                        onClick={() => setEditingInstance(instance)}
                        className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
                        title="Edit Instance"
                      >
                        <FiEdit3 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Instance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add WhatsApp Instance</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instance ID *
                </label>
                <input
                  type="text"
                  value={newInstance.instance_id}
                  onChange={(e) => setNewInstance({ ...newInstance, instance_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1101123456"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Token *
                </label>
                <input
                  type="password"
                  value={newInstance.api_token}
                  onChange={(e) => setNewInstance({ ...newInstance, api_token: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Green API token"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instance Name
                </label>
                <input
                  type="text"
                  value={newInstance.instance_name}
                  onChange={(e) => setNewInstance({ ...newInstance, instance_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Display name for this instance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newInstance.description}
                  onChange={(e) => setNewInstance({ ...newInstance, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Green API Host
                </label>
                <input
                  type="url"
                  value={newInstance.green_api_host}
                  onChange={(e) => setNewInstance({ ...newInstance, green_api_host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://api.green-api.com"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={addInstance}
                disabled={loading || !newInstance.instance_id || !newInstance.api_token}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Instance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnectionManager;