import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  getIntegrations, 
  testIntegration, 
  getAllIntegrationStatuses,
  initializeDefaultIntegrations 
} from '../../../lib/integrationService';
import { 
  Smartphone, 
  MessageSquare, 
  Zap, 
  CreditCard, 
  Database, 
  TestTube, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Settings,
  Wifi,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  provider: string;
  config: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationStatus {
  isConnected: boolean;
  lastCheck: string;
  error?: string;
  balance?: string;
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: string;
}

const IntegrationTestingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const fetchedIntegrations = await getIntegrations();
      setIntegrations(fetchedIntegrations);
      
      const fetchedStatuses = await getAllIntegrationStatuses();
      setStatuses(fetchedStatuses);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeIntegrations = async () => {
    try {
      await initializeDefaultIntegrations();
      await loadIntegrations();
      toast.success('Default integrations initialized');
    } catch (error) {
      console.error('Error initializing integrations:', error);
      toast.error('Failed to initialize integrations');
    }
  };

  const handleTestIntegration = async (integration: IntegrationConfig) => {
    try {
      setTesting(integration.id);
      
      const result: TestResult = {
        name: integration.name,
        status: 'pending',
        message: 'Testing...',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      const status = await testIntegration(integration);
      
      const updatedResult: TestResult = {
        name: integration.name,
        status: status.isConnected ? 'success' : 'error',
        message: status.isConnected ? 'Connection successful' : (status.error || 'Connection failed'),
        details: status,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [updatedResult, ...prev.slice(1)]);
      
      // Update statuses
      setStatuses(prev => ({
        ...prev,
        [integration.name]: status
      }));
      
      if (status.isConnected) {
        toast.success(`${integration.name} test successful`);
      } else {
        toast.error(`${integration.name} test failed: ${status.error}`);
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      
      const errorResult: TestResult = {
        name: integration.name,
        status: 'error',
        message: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [errorResult, ...prev.slice(1)]);
      toast.error(`Failed to test ${integration.name}`);
    } finally {
      setTesting(null);
    }
  };

  const handleTestAll = async () => {
    try {
      setTesting('all');
      
      for (const integration of integrations) {
        await handleTestIntegration(integration);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast.success('All integration tests completed');
    } catch (error) {
      console.error('Error testing all integrations:', error);
      toast.error('Failed to test all integrations');
    } finally {
      setTesting(null);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'sms': return <Smartphone className="w-5 h-5" />;
      case 'whatsapp': return <MessageSquare className="w-5 h-5" />;
      case 'ai': return <Zap className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      case 'storage': return <Database className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    if (status.isConnected) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (status.error) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: IntegrationStatus) => {
    if (status.isConnected) return 'text-green-600 bg-green-50';
    if (status.error) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getTestResultIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'pending': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Integration Testing Center
              </h1>
              <p className="text-gray-600">
                Test and monitor all your app integrations in one place
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleInitializeIntegrations}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Initialize Defaults
              </button>
              <button
                onClick={handleTestAll}
                disabled={testing === 'all' || integrations.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4" />
                {testing === 'all' ? 'Testing All...' : 'Test All'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Integrations List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Active Integrations
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading integrations...</span>
                </div>
              ) : integrations.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Integrations Found</h3>
                  <p className="text-gray-600 mb-4">Initialize default integrations to get started.</p>
                  <button
                    onClick={handleInitializeIntegrations}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Initialize Defaults
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => {
                    const status = statuses[integration.name];
                    const isTesting = testing === integration.id;
                    
                    return (
                      <div
                        key={integration.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getIntegrationIcon(integration.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                              <p className="text-sm text-gray-600">
                                {integration.type} • {integration.provider}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {status ? getStatusIcon(status) : <AlertCircle className="w-4 h-4 text-gray-400" />}
                                <span className={`text-xs px-2 py-1 rounded-full ${status ? getStatusColor(status) : 'text-gray-500 bg-gray-100'}`}>
                                  {status?.isConnected ? 'Connected' : status?.error ? 'Error' : 'Unknown'}
                                </span>
                                {integration.isActive && (
                                  <span className="text-xs px-2 py-1 rounded-full text-green-600 bg-green-100">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTestIntegration(integration)}
                              disabled={isTesting}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {isTesting ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              {isTesting ? 'Testing...' : 'Test'}
                            </button>
                          </div>
                        </div>
                        
                        {status?.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{status.error}</p>
                          </div>
                        )}
                        
                        {status?.balance && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">
                              Balance: {status.balance}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Test Results */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Recent Test Results
              </h2>
              
              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No test results yet</p>
                  <p className="text-sm text-gray-500">Run tests to see results here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getTestResultIcon(result.status)}
                        <span className="font-medium text-sm">{result.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{result.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Connection Status
              </h2>
              
              <div className="space-y-3">
                {Object.entries(statuses).map(([name, status]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                        {status.isConnected ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {Object.keys(statuses).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No status data available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationTestingPage;
