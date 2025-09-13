import React, { useState } from 'react';
import { fixProductImagesTable, checkProductImagesTable } from '../lib/fixProductImagesTable';

export const DatabaseFixer: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tableInfo, setTableInfo] = useState<{ success: boolean; columns: string[]; message: string } | null>(null);

  const handleCheckTable = async () => {
    setIsFixing(true);
    try {
      const info = await checkProductImagesTable();
      setTableInfo(info);
    } catch (error) {
      setTableInfo({ success: false, columns: [], message: 'Failed to check table' });
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixTable = async () => {
    setIsFixing(true);
    try {
      const fixResult = await fixProductImagesTable();
      setResult(fixResult);
      
      // Also check the table after fixing
      const info = await checkProductImagesTable();
      setTableInfo(info);
    } catch (error) {
      setResult({ success: false, message: 'Failed to fix table' });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Fixer</h2>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={handleCheckTable}
            disabled={isFixing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isFixing ? 'Checking...' : 'Check Table Structure'}
          </button>
        </div>

        {tableInfo && (
          <div className={`p-4 rounded-lg ${tableInfo.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-medium text-gray-900 mb-2">Table Structure</h3>
            <p className="text-sm text-gray-600 mb-2">{tableInfo.message}</p>
            {tableInfo.columns.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Columns:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {tableInfo.columns.map((column, index) => (
                    <li key={index}>{column}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div>
          <button
            onClick={handleFixTable}
            disabled={isFixing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isFixing ? 'Fixing...' : 'Fix Product Images Table'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-medium text-gray-900 mb-2">Fix Result</h3>
            <p className="text-sm text-gray-600">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};
