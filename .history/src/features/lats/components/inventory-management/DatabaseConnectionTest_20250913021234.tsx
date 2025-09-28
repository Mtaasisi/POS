import React, { useState, useEffect } from 'react';
import { testSupabaseConnection, checkConnectionHealth } from '../../../../lib/supabaseClient';
import { storageRoomApi } from '../../../../features/settings/utils/storageRoomApi';
import { storeShelfApi } from '../../../../features/settings/utils/storeShelfApi';
import { storeLocationApi } from '../../../../features/settings/utils/storeLocationApi';

const DatabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [storageRooms, setStorageRooms] = useState<any[]>([]);
  const [storeShelves, setStoreShelves] = useState<any[]>([]);
  const [storeLocations, setStoreLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus(result);
      console.log('🔍 Connection test result:', result);
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setConnectionStatus({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const health = await checkConnectionHealth();
      setHealthStatus(health);
      console.log('🏥 Health check result:', health);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setHealthStatus({ healthy: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  const testStorageRoomApi = async () => {
    setIsLoading(true);
    try {
      const rooms = await storageRoomApi.getAll();
      setStorageRooms(rooms);
      console.log('🏠 Storage rooms fetched:', rooms.length);
    } catch (error) {
      console.error('❌ Storage room API test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testStoreShelfApi = async () => {
    setIsLoading(true);
    try {
      const shelves = await storeShelfApi.getAll();
      setStoreShelves(shelves);
      console.log('📦 Store shelves fetched:', shelves.length);
    } catch (error) {
      console.error('❌ Store shelf API test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testStoreLocationApi = async () => {
    setIsLoading(true);
    try {
      const locations = await storeLocationApi.getAll();
      setStoreLocations(locations);
      console.log('📍 Store locations fetched:', locations.length);
    } catch (error) {
      console.error('❌ Store location API test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    await testConnection();
    await checkHealth();
    await testStorageRoomApi();
    await testStoreShelfApi();
    await testStoreLocationApi();
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔍 Database Connection Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🌐 Connection Status</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {connectionStatus ? (
                <span className={`px-2 py-1 rounded text-sm ${
                  connectionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus.success ? '✅ Connected' : '❌ Failed'}
                </span>
              ) : (
                <span className="text-gray-500">Loading...</span>
              )}
            </div>
            {connectionStatus?.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                Error: {connectionStatus.error.message || connectionStatus.error}
              </div>
            )}
            <button
              onClick={testConnection}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-3">🏥 Health Check</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Health:</span>
              {healthStatus ? (
                <span className={`px-2 py-1 rounded text-sm ${
                  healthStatus.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {healthStatus.healthy ? '✅ Healthy' : '❌ Unhealthy'}
                </span>
              ) : (
                <span className="text-gray-500">Loading...</span>
              )}
            </div>
            {healthStatus?.responseTime && (
              <div className="text-sm text-gray-600">
                Response Time: {healthStatus.responseTime}ms
              </div>
            )}
            {healthStatus?.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                Error: {healthStatus.error}
              </div>
            )}
            <button
              onClick={checkHealth}
              disabled={isLoading}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Check Health'}
            </button>
          </div>
        </div>

        {/* API Tests */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">🧪 API Tests</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Storage Rooms:</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                {storageRooms.length} found
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Store Shelves:</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                {storeShelves.length} found
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Store Locations:</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                {storeLocations.length} found
              </span>
            </div>
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Running...' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800 mb-3">📊 Database Info</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">URL:</span> jxhzveborezjhsmzsgbc.supabase.co</div>
            <div><span className="font-medium">Tables:</span> lats_storage_rooms, lats_store_shelves</div>
            <div><span className="font-medium">Schema:</span> public</div>
            <div><span className="font-medium">Status:</span> {connectionStatus?.success ? 'Active' : 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* Recent Data */}
      {storageRooms.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🏠 Recent Storage Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {storageRooms.slice(0, 6).map((room) => (
              <div key={room.id} className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-800">{room.name}</div>
                <div className="text-sm text-gray-600">Code: {room.code}</div>
                <div className="text-sm text-gray-600">Floor: {room.floor_level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {storeShelves.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📦 Recent Store Shelves</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {storeShelves.slice(0, 6).map((shelf) => (
              <div key={shelf.id} className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-800">{shelf.name}</div>
                <div className="text-sm text-gray-600">Code: {shelf.code}</div>
                <div className="text-sm text-gray-600">Type: {shelf.shelf_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionTest;
