import React, { useState } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { useAuth } from '../context/AuthContext';
import { WhatsAppConnectionStatus } from '../components/WhatsAppConnectionStatus';
import { toast } from 'react-hot-toast';

export const WhatsAppDashboard: React.FC = () => {
  const { instances, loading, error, addInstance, deleteInstance, clearError } = useWhatsApp();
  const { isAuthenticated, currentUser } = useAuth();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    instanceId: '',
    apiToken: '',
    instanceName: '',
    description: ''
  });

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.instanceId || !formData.apiToken) {
      toast.error('Instance ID and API Token are required');
      return;
    }

    try {
      await addInstance({
        instance_id: formData.instanceId,
        api_token: formData.apiToken,
        instance_name: formData.instanceName || formData.instanceId,
        description: formData.description,
        green_api_host: 'https://api.green-api.com',
        state_instance: 'notAuthorized',
        status: 'disconnected',
        is_active: true
      });
      
      toast.success('WhatsApp instance created successfully!');
      setShowCreateForm(false);
      setFormData({ instanceId: '', apiToken: '', instanceName: '', description: '' });
    } catch (error: any) {
      toast.error(`Failed to create instance: ${error.message}`);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (window.confirm('Are you sure you want to delete this WhatsApp instance?')) {
      try {
        await deleteInstance(instanceId);
        toast.success('WhatsApp instance deleted successfully!');
      } catch (error: any) {
        toast.error(`Failed to delete instance: ${error.message}`);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication Required</h3>
            <p className="mt-2 text-sm text-gray-500">
              Please log in to access WhatsApp features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your WhatsApp instances and monitor connections
          </p>
        </div>

        <WhatsAppConnectionStatus />

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">WhatsApp Instances</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {showCreateForm ? 'Cancel' : 'Add Instance'}
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleCreateInstance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Instance ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.instanceId}
                      onChange={(e) => setFormData({ ...formData, instanceId: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter instance ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      API Token *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.apiToken}
                      onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter API token"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Instance Name
                    </label>
                    <input
                      type="text"
                      value={formData.instanceName}
                      onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter instance name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter description"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Instance'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="px-6 py-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading instances...</p>
              </div>
            ) : instances.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No instances</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new WhatsApp instance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {instances.map((instance) => (
                  <div key={instance.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          instance.status === 'connected' ? 'bg-green-400' : 
                          instance.status === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {instance.instance_name || instance.instance_id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {instance.instance_id} • Status: {instance.status}
                          </p>
                          {instance.description && (
                            <p className="text-sm text-gray-400">{instance.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          instance.status === 'connected' ? 'bg-green-100 text-green-800' :
                          instance.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {instance.status}
                        </span>
                        <button
                          onClick={() => handleDeleteInstance(instance.instance_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
