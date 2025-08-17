import React, { useState, useEffect } from 'react';
import { POSSettingsAPI } from '../lib/posSettingsApi';
import { toast } from 'react-hot-toast';

const POSSettingsTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const testSettingsTable = async (tableKey: string) => {
    try {
      console.log(`🧪 Testing ${tableKey} settings...`);
      
      // Test loading settings
      const settings = await POSSettingsAPI.loadSettings(tableKey as any);
      console.log(`${tableKey} settings loaded:`, settings);
      
      // Test saving default settings
      const savedSettings = await POSSettingsAPI.saveSettings(tableKey as any, {});
      console.log(`${tableKey} settings saved:`, savedSettings);
      
      return {
        success: true,
        loaded: !!settings,
        saved: !!savedSettings,
        data: savedSettings
      };
    } catch (error) {
      console.error(`❌ Error testing ${tableKey}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    const results: Record<string, any> = {};
    
    const tablesToTest = [
      'general',
      'receipt', 
      'delivery',
      'advanced'
    ];
    
    for (const tableKey of tablesToTest) {
      results[tableKey] = await testSettingsTable(tableKey);
    }
    
    setTestResults(results);
    setIsLoading(false);
    
    // Show summary
    const successCount = Object.values(results).filter((r: any) => r.success).length;
    const totalCount = tablesToTest.length;
    
    if (successCount === totalCount) {
      toast.success(`✅ All ${totalCount} POS settings tables working correctly!`);
    } else {
      toast.error(`❌ ${totalCount - successCount} out of ${totalCount} tables have issues`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">POS Settings Test</h2>
      
      <button
        onClick={runAllTests}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Run Tests'}
      </button>
      
      {Object.keys(testResults).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Test Results:</h3>
          <div className="space-y-3">
            {Object.entries(testResults).map(([tableKey, result]) => (
              <div
                key={tableKey}
                className={`p-3 rounded border ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="font-medium">
                  {tableKey.charAt(0).toUpperCase() + tableKey.slice(1)} Settings
                </div>
                <div className="text-sm text-gray-600">
                  {result.success ? (
                    <>
                      ✅ Loaded: {result.loaded ? 'Yes' : 'No'} | 
                      Saved: {result.saved ? 'Yes' : 'No'}
                    </>
                  ) : (
                    <>❌ Error: {result.error}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">Instructions:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Click "Run Tests" to test all POS settings tables</li>
          <li>2. Check the results to see which tables are working</li>
          <li>3. If any tests fail, run the migration script</li>
          <li>4. Restart your application after fixing issues</li>
        </ol>
      </div>
    </div>
  );
};

export default POSSettingsTest;
