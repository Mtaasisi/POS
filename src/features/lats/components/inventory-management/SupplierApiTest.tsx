import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  getAllSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  searchSuppliers,
  type Supplier,
  type CreateSupplierData
} from '../../../../lib/supplierApi';

const SupplierApiTest: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testGetAllSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      addTestResult('Testing getAllSuppliers...');
      
      const data = await getAllSuppliers();
      setSuppliers(data);
      addTestResult(`✅ getAllSuppliers successful: ${data.length} suppliers found`);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addTestResult(`❌ getAllSuppliers failed: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testCreateSupplier = async () => {
    try {
      setLoading(true);
      addTestResult('Testing createSupplier...');
      
      const testData: CreateSupplierData = {
        name: `Test Supplier ${Date.now()}`,
        company_name: 'Test Company Ltd',
        description: 'This is a test supplier for API testing',
        contact_person: 'Test Contact',
        email: `test${Date.now()}@example.com`,
        phone: '+1234567890',
        city: 'Test City',
        country: 'US',
        is_active: true
      };
      
      const newSupplier = await createSupplier(testData);
      addTestResult(`✅ createSupplier successful: ${newSupplier.name} created with ID ${newSupplier.id}`);
      
      // Refresh the list
      await testGetAllSuppliers();
      
      return newSupplier;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult(`❌ createSupplier failed: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testUpdateSupplier = async (supplier: Supplier) => {
    try {
      setLoading(true);
      addTestResult(`Testing updateSupplier for ${supplier.name}...`);
      
      const updateData = {
        description: `Updated description at ${new Date().toLocaleTimeString()}`,
        city: 'Updated City'
      };
      
      const updatedSupplier = await updateSupplier(supplier.id, updateData);
      addTestResult(`✅ updateSupplier successful: ${updatedSupplier.name} updated`);
      
      // Refresh the list
      await testGetAllSuppliers();
      
      return updatedSupplier;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult(`❌ updateSupplier failed: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testDeleteSupplier = async (supplier: Supplier) => {
    try {
      setLoading(true);
      addTestResult(`Testing deleteSupplier for ${supplier.name}...`);
      
      await deleteSupplier(supplier.id);
      addTestResult(`✅ deleteSupplier successful: ${supplier.name} deleted`);
      
      // Refresh the list
      await testGetAllSuppliers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult(`❌ deleteSupplier failed: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testSearchSuppliers = async () => {
    try {
      setLoading(true);
      addTestResult('Testing searchSuppliers...');
      
      const searchResults = await searchSuppliers('test');
      addTestResult(`✅ searchSuppliers successful: ${searchResults.length} results found for "test"`);
      
      return searchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult(`❌ searchSuppliers failed: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addTestResult('🚀 Starting supplier API tests...');
    
    try {
      // Test 1: Get all suppliers
      await testGetAllSuppliers();
      
      // Test 2: Create a new supplier
      const newSupplier = await testCreateSupplier();
      
      // Test 3: Update the supplier
      if (newSupplier) {
        await testUpdateSupplier(newSupplier);
      }
      
      // Test 4: Search suppliers
      await testSearchSuppliers();
      
      // Test 5: Delete the test supplier
      if (newSupplier) {
        await testDeleteSupplier(newSupplier);
      }
      
      addTestResult('🎉 All tests completed successfully!');
    } catch (err) {
      addTestResult(`💥 Test suite failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    testGetAllSuppliers();
  }, []);

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Supplier API Test</h2>
        <p className="text-gray-600 mb-4">
          Test the supplier management API functionality with real database operations.
        </p>
        
        <div className="flex gap-2 mb-4">
          <GlassButton
            onClick={runAllTests}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            disabled={loading}
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </GlassButton>
          
          <GlassButton
            onClick={testGetAllSuppliers}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            disabled={loading}
          >
            Test Get All
          </GlassButton>
          
          <GlassButton
            onClick={testCreateSupplier}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            disabled={loading}
          >
            Test Create
          </GlassButton>
          
          <GlassButton
            onClick={testSearchSuppliers}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            disabled={loading}
          >
            Test Search
          </GlassButton>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-700">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Suppliers */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Current Suppliers ({suppliers.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{supplier.name}</p>
                      <p className="text-sm text-gray-600">{supplier.company_name || 'No company'}</p>
                      <p className="text-xs text-gray-500">{supplier.city}, {supplier.country}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => testUpdateSupplier(supplier)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        disabled={loading}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => testDeleteSupplier(supplier)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Test Results</h3>
            <div className="bg-gray-50 p-3 rounded-lg border max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-sm">No tests run yet. Click "Run All Tests" to start.</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SupplierApiTest;
