import React, { useState } from 'react';
import { greenApiService } from '../services/greenApiService';
import { toast } from '../lib/toastUtils';

interface DiagnosticResult {
  timestamp: string;
  countQuery: { success: boolean; error?: string; count: number };
  instanceQuery: { success: boolean; error?: string; hasData: boolean };
  specificInstanceQuery?: { success: boolean; error?: string; found: boolean; instanceData?: any };
  recommendations: string[];
}

export const WhatsAppDiagnostic: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [instances, setInstances] = useState<any[]>([]);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running WhatsApp diagnostic...');
      const result = await greenApiService.diagnoseRLSIssues();
      setDiagnosticResult(result);
      
      // Also fetch all instances
      const allInstances = await greenApiService.getInstances();
      setInstances(allInstances);
      
      toast.success('Diagnostic completed successfully');
    } catch (error: any) {
      console.error('❌ Diagnostic failed:', error);
      toast.error(`Diagnostic failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestInstance = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Creating test instance...');
      const instance = await greenApiService.createTestInstance();
      if (instance) {
        toast.success('Test instance created successfully');
        // Refresh instances
        const allInstances = await greenApiService.getInstances();
        setInstances(allInstances);
      } else {
        toast.error('Failed to create test instance');
      }
    } catch (error: any) {
      console.error('❌ Failed to create test instance:', error);
      toast.error(`Failed to create test instance: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificInstance = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Testing specific instance...');
      
      // First try to get the instance
      let instance = await greenApiService.getInstance('aa8e52c6-b7b3-4eac-b9ab-a4ada6044664');
      
      // If not found, create it first
      if (!instance) {
        console.log('⚠️ Instance not found, creating test instance first...');
        instance = await greenApiService.createTestInstance();
      }
      
      if (instance) {
        toast.success('Specific instance found/created successfully!');
        console.log('✅ Instance found/created:', instance);
      } else {
        toast.error('Failed to create or find specific instance');
        console.log('❌ Instance not found and creation failed');
      }
    } catch (error: any) {
      console.error('❌ Error testing specific instance:', error);
      toast.error(`Error testing instance: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">WhatsApp Diagnostic Tool</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={runDiagnostic}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Run Diagnostic'}
          </button>
          
          <button
            onClick={createTestInstance}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Test Instance'}
          </button>
          
          <button
            onClick={testSpecificInstance}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Specific Instance'}
          </button>
        </div>

        {diagnosticResult && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Diagnostic Results</h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Count Query</h4>
                  <p className="text-sm">
                    Status: {diagnosticResult.countQuery.success ? '✅ Success' : '❌ Failed'}
                  </p>
                  <p className="text-sm">Count: {diagnosticResult.countQuery.count}</p>
                  {diagnosticResult.countQuery.error && (
                    <p className="text-sm text-red-600">Error: {diagnosticResult.countQuery.error}</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium">Instance Query</h4>
                  <p className="text-sm">
                    Status: {diagnosticResult.instanceQuery.success ? '✅ Success' : '❌ Failed'}
                  </p>
                  <p className="text-sm">Has Data: {diagnosticResult.instanceQuery.hasData ? 'Yes' : 'No'}</p>
                  {diagnosticResult.instanceQuery.error && (
                    <p className="text-sm text-red-600">Error: {diagnosticResult.instanceQuery.error}</p>
                  )}
                </div>
              </div>
              
              {diagnosticResult.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium">Recommendations</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {diagnosticResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-blue-600">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {instances && instances.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Available WhatsApp Instances</h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="space-y-2">
                {instances.map((instance, index) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">Instance {index + 1}</p>
                      <p className="text-sm text-gray-600">ID: {instance.instance_id}</p>
                      <p className="text-sm text-gray-600">Phone: {instance.phone_number}</p>
                      <p className="text-sm text-gray-600">Status: 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          instance.status === 'connected' ? 'bg-green-100 text-green-800' :
                          instance.status === 'disconnected' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {instance.status}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const instance = await greenApiService.getInstance(instance.instance_id);
                          if (instance) {
                            toast.success(`Instance ${instance.instance_id} found!`);
                          } else {
                            toast.error(`Instance ${instance.instance_id} not found`);
                          }
                        } catch (error: any) {
                          toast.error(`Error testing instance: ${error.message}`);
                        }
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {instances && instances.length === 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">No WhatsApp Instances Found</h3>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <p className="text-yellow-800">
                No WhatsApp instances are currently configured. Click "Create Test Instance" to add a test instance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppDiagnostic;
