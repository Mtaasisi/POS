import React, { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw, FiTrash2, FiEdit3, FiPhone, FiWifi, FiWifiOff, FiSettings, FiMaximize2, FiX, FiLogOut, FiCamera, FiKey } from 'react-icons/fi';

import { useWhatsApp } from '../../../context/WhatsAppContext';
import { toast } from 'react-hot-toast';
import { WhatsAppApiService, SendMessageResponse } from '../../../services/whatsappApiService';

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
  const { instances, loading, fetchInstances, updateInstance, addInstance: contextAddInstance, deleteInstance: contextDeleteInstance, updateStatusesDebounced } = useWhatsApp();
  const [settings, setSettings] = useState<{ [key: string]: ConnectionSettings }>({});
  const [localLoading, setLocalLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthCodeModal, setShowAuthCodeModal] = useState(false);
  const [showApiTokenModal, setShowApiTokenModal] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [editingInstance, setEditingInstance] = useState<WhatsAppInstance | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedInstanceForQR, setSelectedInstanceForQR] = useState<WhatsAppInstance | null>(null);
  const [selectedInstanceForProfile, setSelectedInstanceForProfile] = useState<WhatsAppInstance | null>(null);
  const [selectedInstanceForAuthCode, setSelectedInstanceForAuthCode] = useState<WhatsAppInstance | null>(null);
  const [selectedInstanceForApiToken, setSelectedInstanceForApiToken] = useState<WhatsAppInstance | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('255746605561');
  const [authCodePhoneNumber, setAuthCodePhoneNumber] = useState<string>('');
  const [authCodeResult, setAuthCodeResult] = useState<string | null>(null);
  const [newApiToken, setNewApiToken] = useState<string>('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // New instance form state
  const [newInstance, setNewInstance] = useState({
    instance_id: '',
    api_token: '',
    instance_name: '',
    description: '',
    green_api_host: 'https://api.green-api.com'
  });

  // Edit instance form state
  const [editInstance, setEditInstance] = useState({
    instance_id: '',
    api_token: '',
    instance_name: '',
    description: '',
    green_api_host: 'https://api.green-api.com'
  });

  useEffect(() => {
    // Context will handle fetching instances
    // Cleanup WebSocket on unmount
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  const addInstance = async () => {
    try {
      if (!newInstance.instance_id || !newInstance.api_token) {
        toast.error('Instance ID and API Token are required');
        return;
      }

      setLocalLoading(true);
      console.log('🔧 Creating new WhatsApp instance...');

      await contextAddInstance({
        instance_id: newInstance.instance_id,
        api_token: newInstance.api_token,
        instance_name: newInstance.instance_name || newInstance.instance_id,
        description: newInstance.description,
        green_api_host: newInstance.green_api_host,
        green_api_url: `${newInstance.green_api_host}/waInstance${newInstance.instance_id}`,
        state_instance: 'notAuthorized',
        status: 'disconnected',
        is_active: true,
        user_id: '', // This will be set by the context
        phone_number: undefined,
        wid: undefined,
        country_instance: undefined,
        type_account: undefined,
        last_connected_at: undefined,
        last_activity_at: undefined,
        profile_name: undefined,
        profile_picture_url: undefined
      });

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
    } catch (error: any) {
      console.error('❌ Exception creating instance:', error);
      toast.error('Failed to create instance');
    } finally {
      setLocalLoading(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!confirm('Are you sure you want to delete this WhatsApp instance? This action cannot be undone.')) {
      return;
    }

    try {
      setLocalLoading(true);
      console.log(`🗑️ Deleting instance: ${instanceId}`);

      await contextDeleteInstance(instanceId);

      console.log('✅ Instance deleted successfully');
      toast.success('Instance deleted successfully');
    } catch (error: any) {
      console.error('❌ Exception deleting instance:', error);
      toast.error('Failed to delete instance');
    } finally {
      setLocalLoading(false);
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
      case 'blocked':
        return 'text-red-800 bg-red-200';
      case 'sleeping':
        return 'text-purple-600 bg-purple-100';
      case 'suspended':
        return 'text-orange-700 bg-orange-200';
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
      case 'blocked':
        return 'text-red-800 bg-red-200';
      case 'sleepMode':
        return 'text-purple-600 bg-purple-100';
      case 'yellowCard':
        return 'text-orange-700 bg-orange-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <FiWifi className="text-green-600" />;
      case 'disconnected':
        return <FiWifiOff className="text-red-600" />;
      case 'connecting':
        return <FiRefreshCw className="text-yellow-600 animate-spin" />;
      default:
        return <FiSettings className="text-gray-600" />;
    }
  };



  // Function to check connection status
  const checkConnectionStatus = async (instance: WhatsAppInstance) => {
    try {
      console.log(`🔍 Checking connection status for instance: ${instance.instance_id}`);
      
      const response = await WhatsAppApiService.checkInstanceState(
        instance.instance_id, 
        instance.api_token, 
        instance.green_api_host
      );

      console.log(`📊 Connection status response:`, response);

      // Update the instance status using context
      await updateInstance(instance.instance_id, {
        state_instance: response.stateInstance,
        status: response.stateInstance === 'authorized' ? 'connected' : 'disconnected',
        last_activity_at: new Date().toISOString()
      }, true); // Skip refresh to avoid triggering fetch

      const newStatus = response.stateInstance === 'authorized' ? 'connected' : 'disconnected';
      console.log(`✅ Updated instance ${instance.instance_id} status to: ${response.stateInstance} (${newStatus})`);
      
      // Show appropriate message based on status
      if (response.error) {
        toast.error(`Failed to check status: ${response.error}`);
      } else if (response.stateInstance === 'authorized') {
        toast.success(`✅ Instance ${instance.instance_name || instance.instance_id} is authorized and connected!`);
      } else {
        toast.error(`⚠️ Instance ${instance.instance_name || instance.instance_id} status: ${response.stateInstance} (${newStatus})`);
      }

    } catch (error: any) {
      console.error('❌ Error checking connection status:', error);
      toast.error(`Failed to check connection: ${error.message}`);
    }
  };

  // Function to send test message
  const sendTestMessage = async (instance: WhatsAppInstance) => {
    try {
      if (!testPhoneNumber.trim()) {
        toast.error('Please enter a phone number to send test message to');
        return;
      }

      console.log(`📱 Sending test message from instance: ${instance.instance_id}`);
      
      const response: SendMessageResponse = await WhatsAppApiService.sendTestMessage(
        instance.instance_id,
        instance.api_token,
        instance.green_api_host,
        testPhoneNumber.trim()
      );

      if (response.success) {
        console.log('✅ Test message sent successfully');
        toast.success(response.message || 'Test message sent successfully!');
      } else {
        console.error('❌ Failed to send test message:', response.error);
        toast.error(response.error || 'Failed to send test message');
      }

    } catch (error: any) {
      console.error('❌ Error sending test message:', error);
      toast.error(`Failed to send test message: ${error.message}`);
    }
  };

  // Function to generate QR code
  const generateQRCode = async (instance: WhatsAppInstance) => {
    try {
      setQrLoading(true);
      setSelectedInstanceForQR(instance);
      console.log(`🔗 Generating QR code for instance: ${instance.instance_id}`);
      
      const qrData = await WhatsAppApiService.generateQRCode(
        instance.instance_id,
        instance.api_token,
        instance.green_api_host
      );

      if (qrData) {
        setQrCodeData(qrData);
        setShowQRModal(true);
        console.log('✅ QR code generated successfully');
        toast.success(`QR code generated for ${instance.instance_name || instance.instance_id}`);
      } else {
        console.error('❌ Failed to generate QR code');
        toast.error('Failed to generate QR code');
      }
    } catch (error: any) {
      console.error('❌ Error generating QR code:', error);
      toast.error(`Failed to generate QR code: ${error.message}`);
    } finally {
      setQrLoading(false);
    }
  };

  // Function to generate QR code using WebSocket
  const generateQRCodeWebSocket = async (instance: WhatsAppInstance) => {
    try {
      setQrLoading(true);
      setSelectedInstanceForQR(instance);
      console.log(`🔗 Generating QR code via WebSocket for instance: ${instance.instance_id}`);
      
      // Attempt WebSocket QR code generation (currently falls back to regular QR code)
      await WhatsAppApiService.generateQRCodeWebSocket(
        instance.instance_id,
        instance.api_token,
        instance.green_api_host
      );

      // Since WebSocket is not implemented yet, fallback to regular QR code generation
      console.log('📱 Falling back to regular QR code generation...');
      const qrData = await WhatsAppApiService.generateQRCode(
        instance.instance_id,
        instance.api_token,
        instance.green_api_host
      );

      if (qrData) {
        setQrCodeData(qrData);
        setShowQRModal(true);
        toast.success('QR code generated successfully (using fallback method)');
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch (error: any) {
      console.error('❌ Error generating QR code via WebSocket:', error);
      toast.error(`Failed to generate QR code via WebSocket: ${error.message}`);
    } finally {
      setQrLoading(false);
    }
  };

  // Function to logout instance
  const logoutInstance = async (instance: WhatsAppInstance) => {
    if (!confirm(`Are you sure you want to logout instance ${instance.instance_name || instance.instance_id}?`)) {
      return;
    }

    try {
      setLocalLoading(true);
      console.log(`🚪 Logging out instance: ${instance.instance_id}`);
      
      await WhatsAppApiService.logout(
        instance.instance_id,
        instance.api_token,
        instance.green_api_host
      );

      console.log('✅ Instance logged out successfully');
      toast.success(`Instance ${instance.instance_name || instance.instance_id} logged out successfully`);
      
      // Trigger status update
      updateStatusesDebounced();
    } catch (error: any) {
      console.error('❌ Error logging out instance:', error);
      toast.error(`Failed to logout instance: ${error.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  // Function to reboot instance
  const rebootInstance = async (instance: WhatsAppInstance) => {
    if (!confirm(`Are you sure you want to reboot instance ${instance.instance_name || instance.instance_id}?`)) {
      return;
    }

    try {
      setLocalLoading(true);
      console.log(`🔄 Rebooting instance: ${instance.instance_id}`);
      
      await WhatsAppApiService.reboot(
        instance.instance_id,
        instance.api_token,
        instance.green_api_host
      );

      console.log('✅ Instance reboot initiated successfully');
      toast.success(`Instance ${instance.instance_name || instance.instance_id} reboot initiated`);
      
      // Trigger status update after a short delay
      setTimeout(() => {
        updateStatusesDebounced();
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error rebooting instance:', error);
      toast.error(`Failed to reboot instance: ${error.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  // Function to handle profile picture upload
  const handleProfilePictureUpload = async () => {
    if (!profileFile || !selectedInstanceForProfile) {
      toast.error('Please select a file and instance');
      return;
    }

    try {
      setLocalLoading(true);
      console.log(`🖼️ Uploading profile picture for instance: ${selectedInstanceForProfile.instance_id}`);
      
      await WhatsAppApiService.setProfilePicture(
        selectedInstanceForProfile.instance_id,
        selectedInstanceForProfile.api_token,
        profileFile
      );

      console.log('✅ Profile picture uploaded successfully');
      toast.success('Profile picture updated successfully');
      
      // Reset form and close modal
      setProfileFile(null);
      setSelectedInstanceForProfile(null);
      setShowProfileModal(false);
      
      // Trigger status update
      updateStatusesDebounced();
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error);
      toast.error(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  // Function to get authorization code
  const getAuthorizationCode = async () => {
    if (!authCodePhoneNumber.trim() || !selectedInstanceForAuthCode) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setLocalLoading(true);
      console.log(`📞 Getting authorization code for instance: ${selectedInstanceForAuthCode.instance_id}`);
      
      const response = await WhatsAppApiService.getAuthorizationCode(
        selectedInstanceForAuthCode.instance_id,
        selectedInstanceForAuthCode.api_token,
        authCodePhoneNumber.trim(),
        selectedInstanceForAuthCode.green_api_host
      );

      console.log('✅ Authorization code retrieved successfully');
      setAuthCodeResult(response.code || 'Authorization code retrieved');
      toast.success('Authorization code retrieved successfully');
    } catch (error: any) {
      console.error('❌ Error getting authorization code:', error);
      toast.error(`Failed to get authorization code: ${error.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  // Function to update API token
  const updateApiToken = async () => {
    if (!newApiToken.trim() || !selectedInstanceForApiToken) {
      toast.error('Please enter a new API token');
      return;
    }

    try {
      setLocalLoading(true);
      console.log(`🔐 Updating API token for instance: ${selectedInstanceForApiToken.instance_id}`);
      
      await WhatsAppApiService.updateApiToken(
        selectedInstanceForApiToken.instance_id,
        selectedInstanceForApiToken.api_token,
        newApiToken.trim(),
        selectedInstanceForApiToken.green_api_host
      );

      console.log('✅ API token updated successfully');
      toast.success('API token updated successfully');
      
      // Reset form and close modal
      setNewApiToken('');
      setSelectedInstanceForApiToken(null);
      setShowApiTokenModal(false);
      
      // Trigger status update
      updateStatusesDebounced();
    } catch (error: any) {
      console.error('❌ Error updating API token:', error);
      toast.error(`Failed to update API token: ${error.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  // Function to load and save instance settings
  const loadInstanceSettings = async (instanceId: string) => {
    try {
      console.log(`📋 Loading settings for instance: ${instanceId}`);
      
      const instance = instances.find(inst => inst.instance_id === instanceId);
      if (!instance) return;
      
      const response = await WhatsAppApiService.getSettings(
        instanceId,
        instance.api_token,
        instance.green_api_host
      );

      console.log('✅ Settings loaded successfully');
      setSettings(prev => ({ ...prev, [instanceId]: response }));
    } catch (error: any) {
      console.error('❌ Error loading settings:', error);
      toast.error(`Failed to load settings: ${error.message}`);
    }
  };

  const saveInstanceSettings = async (instanceId: string) => {
    try {
      console.log(`💾 Saving settings for instance: ${instanceId}`);
      
      const instance = instances.find(inst => inst.instance_id === instanceId);
      if (!instance || !settings[instanceId]) {
        toast.error('Instance or settings not found');
        return;
      }
      
      await WhatsAppApiService.setSettings(
        instanceId,
        instance.api_token,
        settings[instanceId],
        instance.green_api_host
      );

      console.log('✅ Settings saved successfully');
      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      toast.error(`Failed to save settings: ${error.message}`);
    }
  };

  // Function to open settings modal
  const openSettingsModal = async (instance: WhatsAppInstance) => {
    setSelectedInstanceId(instance.instance_id);
    setShowSettingsModal(true);
    await loadInstanceSettings(instance.instance_id);
  };

  // Function to handle edit instance
  const handleEditInstance = (instance: WhatsAppInstance) => {
    setEditingInstance(instance);
    setEditInstance({
      instance_id: instance.instance_id,
      api_token: instance.api_token,
      instance_name: instance.instance_name || '',
      description: instance.description || '',
      green_api_host: instance.green_api_host || 'https://api.green-api.com'
    });
    setShowEditModal(true);
  };

  // Function to update instance
  const updateInstanceLocal = async () => {
    try {
      if (!editingInstance || !editInstance.api_token) {
        toast.error('API Token is required');
        return;
      }

      setLocalLoading(true);

      await updateInstance(editingInstance.instance_id, {
        api_token: editInstance.api_token,
        instance_name: editInstance.instance_name,
        description: editInstance.description,
        green_api_host: editInstance.green_api_host,
        green_api_url: `${editInstance.green_api_host}/waInstance${editInstance.instance_id}`,
      }, false); // Allow refresh for this update

      toast.success('✅ Instance updated successfully!');
      setShowEditModal(false);
      setEditingInstance(null);
      
      // Reset form
      setEditInstance({
        instance_id: '',
        api_token: '',
        instance_name: '',
        description: '',
        green_api_host: 'https://api.green-api.com'
      });

    } catch (error: any) {
      console.error('❌ Error updating instance:', error);
      toast.error(`Failed to update instance: ${error.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100 to-transparent opacity-50 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-green-100 to-transparent opacity-50 rounded-full translate-y-36 -translate-x-36"></div>
          
          <div className="relative px-6 sm:px-8 py-6">
            <div className="flex flex-col space-y-6">
              {/* Title Section */}
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <FiPhone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">WhatsApp Hub</h1>
                    <p className="text-gray-600 mt-1">Manage your WhatsApp instances and connections</p>
                  </div>
                </div>
                
                {/* Stats Overview */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{instances.length}</div>
                    <div className="text-sm text-gray-500">Total Instances</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {instances.filter(i => i.status === 'connected').length}
                    </div>
                    <div className="text-sm text-gray-500">Connected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {instances.filter(i => i.state_instance === 'authorized').length}
                    </div>
                    <div className="text-sm text-gray-500">Authorized</div>
                  </div>
                </div>
              </div>
              
              {/* Action Controls */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Primary Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    title="Add a new WhatsApp instance to your account"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 transform hover:scale-105 transition-all duration-200"
                  >
                    <FiPlus className="w-5 h-5 mr-2" />
                    Add
                  </button>
                  <button
                    onClick={fetchInstances}
                    disabled={loading}
                    title="Refresh instances list and reload data from server"
                    className="inline-flex items-center px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 transition-all duration-200"
                  >
                    <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                
                {/* Quick Test Control */}
                <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1 lg:ml-auto">
                  <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="Phone number for testing"
                    title="Enter phone number to send test messages to (format: 255746605561)"
                    className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none min-w-0"
                  />
                  <button
                    onClick={() => {
                      if (instances.length > 0) {
                        sendTestMessage(instances[0]);
                      } else {
                        toast.error('No instances available to send test message');
                      }
                    }}
                    disabled={loading || instances.length === 0}
                    title="Send a quick test message using the first available instance"
                    className="ml-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50 transition-all duration-200"
                  >
                    <FiPhone className="w-4 h-4 mr-1" />
                    Quick Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instances Grid */}
        <div className="space-y-6">
          {loading && instances.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading WhatsApp Instances</h3>
              <p className="text-gray-500">Please wait while we fetch your instances...</p>
            </div>
          ) : instances.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiWifiOff className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No WhatsApp Instances Yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Get started by creating your first WhatsApp instance to begin managing your connections
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 transform hover:scale-105 transition-all duration-200"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Create Your First Instance
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {instances.map((instance) => (
                <div key={instance.id} className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Card Header with Status Indicator */}
                  <div className="relative p-6 pb-4">
                    <div className="absolute top-4 right-4">
                      <div className={`w-3 h-3 rounded-full ${instance.status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${instance.status === 'connected' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}>
                        <FiPhone className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {instance.instance_name || instance.instance_id}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">ID: {instance.instance_id}</p>
                        {instance.phone_number && (
                          <div className="flex items-center mt-2 text-sm text-gray-600">
                            <FiPhone className="w-3 h-3 mr-1" />
                            {instance.phone_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Cards */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl ${getStatusColor(instance.status)}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Connection</span>
                          {getStatusIcon(instance.status)}
                        </div>
                        <div className={`text-sm font-bold mt-1 capitalize`}>
                          {instance.status}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-xl ${getStateColor(instance.state_instance)}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">State</span>
                          <div className={`w-2 h-2 rounded-full ${instance.state_instance === 'authorized' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        </div>
                        <div className={`text-sm font-bold mt-1 capitalize`}>
                          {instance.state_instance}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {instance.description && (
                    <div className="px-6 pb-4">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 line-clamp-2">{instance.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-6 pt-0 space-y-3">
                    {/* Primary Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => checkConnectionStatus(instance)}
                        title="Check connection status and verify instance authorization"
                        className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-200 flex items-center justify-center shadow-lg"
                      >
                        <FiWifi className="w-4 h-4 mr-2" />
                        Status
                      </button>
                      <button
                        onClick={() => sendTestMessage(instance)}
                        title="Send a test message to verify WhatsApp functionality"
                        className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-200 flex items-center justify-center shadow-lg"
                      >
                        <FiPhone className="w-4 h-4 mr-2" />
                        Test
                      </button>
                    </div>
                    
                    {/* QR Code Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => generateQRCode(instance)}
                        title="Generate QR code for WhatsApp authorization"
                        className="px-4 py-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-all duration-200 flex items-center justify-center border border-blue-200"
                      >
                        <FiMaximize2 className="w-4 h-4 mr-2" />
                        QR
                      </button>
                      <button
                        onClick={() => generateQRCodeWebSocket(instance)}
                        title="Generate live QR code using WebSocket connection"
                        className="px-4 py-3 bg-purple-50 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-100 transition-all duration-200 flex items-center justify-center border border-purple-200"
                      >
                        <FiWifi className="w-4 h-4 mr-2" />
                        Live
                      </button>
                    </div>

                    {/* Management Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleEditInstance(instance)}
                        title="Edit instance details, API token, and configuration"
                        className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-all duration-200 flex items-center justify-center border border-blue-200"
                      >
                        <FiEdit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => openSettingsModal(instance)}
                        title="Open advanced settings and management options"
                        className="px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center justify-center border border-gray-200"
                      >
                        <FiSettings className="w-4 h-4 mr-2" />
                        Settings
                      </button>
                    </div>
                  </div>

                  {/* Delete Button - Hidden by default, shown on hover */}
                  <button
                    onClick={() => deleteInstance(instance.instance_id)}
                    className="absolute top-4 left-4 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                    title="Delete this WhatsApp instance permanently (cannot be undone)"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>

                  {/* Last Activity */}
                  {instance.last_connected_at && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        Last: {new Date(instance.last_connected_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Instance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="relative flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Add Instance</h2>
                  <p className="text-blue-100 mt-1">Create new WhatsApp instance</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Instance ID *
                  </label>
                  <input
                    type="text"
                    value={newInstance.instance_id}
                    onChange={(e) => setNewInstance({ ...newInstance, instance_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., 1101123456"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    API Token *
                  </label>
                  <input
                    type="password"
                    value={newInstance.api_token}
                    onChange={(e) => setNewInstance({ ...newInstance, api_token: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="Your Green API token"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Instance Name
                  </label>
                  <input
                    type="text"
                    value={newInstance.instance_name}
                    onChange={(e) => setNewInstance({ ...newInstance, instance_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="Display name for this instance"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    value={newInstance.description}
                    onChange={(e) => setNewInstance({ ...newInstance, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Optional description for this instance"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Green API Host
                  </label>
                  <input
                    type="url"
                    value={newInstance.green_api_host}
                    onChange={(e) => setNewInstance({ ...newInstance, green_api_host: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="https://api.green-api.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={addInstance}
                disabled={localLoading || !newInstance.instance_id || !newInstance.api_token}
                className="px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {localLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Instance Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="relative flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <FiEdit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Instance</h2>
                  <p className="text-blue-100 mt-1">Update WhatsApp instance details</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Instance ID
                  </label>
                  <input
                    type="text"
                    value={editInstance.instance_id}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl shadow-sm text-gray-600 cursor-not-allowed"
                    placeholder="Instance ID (cannot be changed)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Instance ID cannot be modified</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    API Token *
                  </label>
                  <input
                    type="password"
                    value={editInstance.api_token}
                    onChange={(e) => setEditInstance({ ...editInstance, api_token: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="Your Green API token"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Instance Name
                  </label>
                  <input
                    type="text"
                    value={editInstance.instance_name}
                    onChange={(e) => setEditInstance({ ...editInstance, instance_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="Display name for this instance"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    value={editInstance.description}
                    onChange={(e) => setEditInstance({ ...editInstance, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Optional description for this instance"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Green API Host
                  </label>
                  <input
                    type="url"
                    value={editInstance.green_api_host}
                    onChange={(e) => setEditInstance({ ...editInstance, green_api_host: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="https://api.green-api.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={updateInstanceLocal}
                disabled={localLoading || !editInstance.api_token}
                className="px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {localLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedInstanceForQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">QR Code: {selectedInstanceForQR.instance_name || selectedInstanceForQR.instance_id}</h2>
            </div>
            <div className="p-6 text-center">
              {qrLoading ? (
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              ) : (
                qrCodeData && <img src={qrCodeData} alt="WhatsApp QR Code" className="mx-auto max-w-full h-auto" />
              )}
              <p className="text-sm text-gray-500 mt-4">Scan this QR code to authorize your WhatsApp instance.</p>
              {wsConnection && (
                <p className="text-xs text-green-600 mt-2">Live connection active - QR will update automatically</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSelectedInstanceForQR(null);
                  if (wsConnection) {
                    wsConnection.close();
                    setWsConnection(null);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Modal */}
      {showProfileModal && selectedInstanceForProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Update Profile Picture: {selectedInstanceForProfile.instance_name || selectedInstanceForProfile.instance_id}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Image File
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {profileFile && (
                  <div className="text-sm text-gray-600">
                    Selected: {profileFile.name}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedInstanceForProfile(null);
                  setProfileFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProfilePictureUpload}
                disabled={localLoading || !profileFile}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {localLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorization Code Modal */}
      {showAuthCodeModal && selectedInstanceForAuthCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Get Authorization Code: {selectedInstanceForAuthCode.instance_name || selectedInstanceForAuthCode.instance_id}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={authCodePhoneNumber}
                    onChange={(e) => setAuthCodePhoneNumber(e.target.value)}
                    placeholder="e.g., 255746605561"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {authCodeResult && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm font-medium text-green-800">Authorization Code:</p>
                    <p className="text-sm text-green-700 font-mono">{authCodeResult}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAuthCodeModal(false);
                  setSelectedInstanceForAuthCode(null);
                  setAuthCodePhoneNumber('');
                  setAuthCodeResult(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={getAuthorizationCode}
                disabled={localLoading || !authCodePhoneNumber.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {localLoading ? 'Getting...' : 'Get Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Token Update Modal */}
      {showApiTokenModal && selectedInstanceForApiToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Update API Token: {selectedInstanceForApiToken.instance_name || selectedInstanceForApiToken.instance_id}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New API Token
                  </label>
                  <input
                    type="password"
                    value={newApiToken}
                    onChange={(e) => setNewApiToken(e.target.value)}
                    placeholder="Enter new API token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApiTokenModal(false);
                  setSelectedInstanceForApiToken(null);
                  setNewApiToken('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateApiToken}
                disabled={localLoading || !newApiToken.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {localLoading ? 'Updating...' : 'Update Token'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedInstanceId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 flex-shrink-0">
              <div className="relative flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <FiSettings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Settings</h2>
                  <p className="text-purple-100 mt-1">Configure {selectedInstanceId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Message Settings */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <FiPhone className="w-4 h-4 text-white" />
                  </div>
                  Message Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mark Messages as Read</label>
                    <select
                      value={settings[selectedInstanceId]?.mark_incoming_messages_readed || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, [selectedInstanceId]: { ...prev[selectedInstanceId], mark_incoming_messages_readed: e.target.value } }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Choose option</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Send Delay (ms)</label>
                    <input
                      type="number"
                      value={settings[selectedInstanceId]?.delay_send_messages_milliseconds || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, [selectedInstanceId]: { ...prev[selectedInstanceId], delay_send_messages_milliseconds: parseInt(e.target.value, 10) || 0 } }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-200"
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Instance Management Actions */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <FiSettings className="w-4 h-4 text-white" />
                  </div>
                  Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      const instance = instances.find(i => i.instance_id === selectedInstanceId);
                      if (instance) {
                        setSelectedInstanceForProfile(instance);
                        setShowProfileModal(true);
                        setShowSettingsModal(false);
                      }
                    }}
                    title="Upload and set a new profile picture for this WhatsApp instance"
                    className="p-4 bg-white rounded-xl border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <FiCamera className="w-5 h-5 text-indigo-600 mr-2" />
                      <span className="font-semibold text-indigo-800">Profile</span>
                    </div>
                    <p className="text-sm text-gray-600">Update profile picture</p>
                  </button>

                  <button
                    onClick={() => {
                      const instance = instances.find(i => i.instance_id === selectedInstanceId);
                      if (instance) {
                        setSelectedInstanceForAuthCode(instance);
                        setShowAuthCodeModal(true);
                        setShowSettingsModal(false);
                      }
                    }}
                    title="Get authorization code for this WhatsApp instance from a phone number"
                    className="p-4 bg-white rounded-xl border border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <FiKey className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-semibold text-yellow-800">Auth Code</span>
                    </div>
                    <p className="text-sm text-gray-600">Get authorization code</p>
                  </button>

                  <button
                    onClick={() => {
                      const instance = instances.find(i => i.instance_id === selectedInstanceId);
                      if (instance) {
                        setSelectedInstanceForApiToken(instance);
                        setShowApiTokenModal(true);
                        setShowSettingsModal(false);
                      }
                    }}
                    title="Update the API token for this WhatsApp instance"
                    className="p-4 bg-white rounded-xl border border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <FiKey className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-800">Token</span>
                    </div>
                    <p className="text-sm text-gray-600">Update API token</p>
                  </button>

                  <button
                    onClick={() => {
                      const instance = instances.find(i => i.instance_id === selectedInstanceId);
                      if (instance) {
                        setShowSettingsModal(false);
                        rebootInstance(instance);
                      }
                    }}
                    title="Restart this WhatsApp instance to refresh connection"
                    className="p-4 bg-white rounded-xl border border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <FiRefreshCw className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="font-semibold text-orange-800">Reboot</span>
                    </div>
                    <p className="text-sm text-gray-600">Restart instance</p>
                  </button>

                  <button
                    onClick={() => {
                      const instance = instances.find(i => i.instance_id === selectedInstanceId);
                      if (instance) {
                        setShowSettingsModal(false);
                        logoutInstance(instance);
                      }
                    }}
                    title="Logout this WhatsApp instance and disconnect from WhatsApp"
                    className="p-4 bg-white rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <FiLogOut className="w-5 h-5 text-red-600 mr-2" />
                      <span className="font-semibold text-red-800">Logout</span>
                    </div>
                    <p className="text-sm text-gray-600">Logout from WhatsApp</p>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveInstanceSettings(selectedInstanceId);
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnectionManager;