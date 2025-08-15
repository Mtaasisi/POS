import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoadingOperations } from '../../../hooks/useLoadingOperations';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { BackButton } from '../components/ui/BackButton';
import { 
  Play, Database, Upload, Download, Search, RefreshCw, 
  CheckCircle, XCircle, Clock, Loader2, ArrowLeft
} from 'lucide-react';

const LoadingDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    withLoading, 
    fetchWithLoading, 
    uploadWithLoading, 
    batchWithLoading,
    searchWithLoading 
  } = useLoadingOperations();

  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Demo operations
  const demoSimpleOperation = async () => {
    try {
      await withLoading(
        'Simple Operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          addResult('Simple operation completed successfully');
          return 'Operation result';
        }
      );
    } catch (error) {
      addResult(`Simple operation failed: ${error}`);
    }
  };

  const demoDataFetch = async () => {
    try {
      const data = await fetchWithLoading(
        'Fetching Customer Data',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
          addResult('Customer data fetched successfully');
          return { customers: 150, totalRevenue: 50000 };
        }
      );
      addResult(`Fetched ${data.customers} customers with ${data.totalRevenue} revenue`);
    } catch (error) {
      addResult(`Data fetch failed: ${error}`);
    }
  };

  const demoFileUpload = async () => {
    try {
      const result = await uploadWithLoading(
        'Uploading Files',
        async (onProgress) => {
          for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            onProgress(i);
          }
          addResult('File upload completed successfully');
          return { uploadedFiles: 5, totalSize: '2.5MB' };
        }
      );
      addResult(`Uploaded ${result.uploadedFiles} files (${result.totalSize})`);
    } catch (error) {
      addResult(`File upload failed: ${error}`);
    }
  };

  const demoSearch = async () => {
    try {
      const searchResults = await searchWithLoading(
        'Searching Products',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1800));
          addResult('Product search completed successfully');
          return { products: 25, categories: 8 };
        }
      );
      addResult(`Found ${searchResults.products} products in ${searchResults.categories} categories`);
    } catch (error) {
      addResult(`Search failed: ${error}`);
    }
  };

  const demoBatchOperations = async () => {
    try {
      const results = await batchWithLoading(
        'Batch Processing',
        [
          {
            name: 'Validate Data',
            operation: async () => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              addResult('Data validation completed');
              return 'valid';
            }
          },
          {
            name: 'Process Images',
            operation: async () => {
              await new Promise(resolve => setTimeout(resolve, 1200));
              addResult('Image processing completed');
              return 'processed';
            }
          },
          {
            name: 'Send Notifications',
            operation: async () => {
              await new Promise(resolve => setTimeout(resolve, 800));
              addResult('Notifications sent');
              return 'sent';
            }
          },
          {
            name: 'Update Database',
            operation: async () => {
              await new Promise(resolve => setTimeout(resolve, 1500));
              addResult('Database updated');
              return 'updated';
            }
          }
        ]
      );
      addResult(`Batch processing completed: ${results.join(', ')}`);
    } catch (error) {
      addResult(`Batch processing failed: ${error}`);
    }
  };

  const demoFailedOperation = async () => {
    try {
      await withLoading(
        'Failing Operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          throw new Error('This operation was designed to fail');
        }
      );
    } catch (error) {
      addResult(`Operation failed as expected: ${error}`);
    }
  };

  const demoConcurrentOperations = async () => {
    addResult('Starting concurrent operations...');
    
    // Start multiple operations simultaneously
    const promises = [
      withLoading('Operation 1', () => new Promise(resolve => setTimeout(resolve, 2000))),
      withLoading('Operation 2', () => new Promise(resolve => setTimeout(resolve, 1500))),
      withLoading('Operation 3', () => new Promise(resolve => setTimeout(resolve, 2500))),
      withLoading('Operation 4', () => new Promise(resolve => setTimeout(resolve, 1800)))
    ];

    try {
      await Promise.all(promises);
      addResult('All concurrent operations completed successfully');
    } catch (error) {
      addResult(`Some concurrent operations failed: ${error}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => navigate(-1)} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Global Loading System Demo</h1>
              <p className="text-gray-600">Test different loading operations and see the global progress indicator</p>
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-500" />
                Simple Operations
              </h3>
              <div className="space-y-2">
                <GlassButton
                  onClick={demoSimpleOperation}
                  icon={<Loader2 className="w-4 h-4" />}
                  className="w-full"
                >
                  Simple Operation
                </GlassButton>
                <GlassButton
                  onClick={demoFailedOperation}
                  icon={<XCircle className="w-4 h-4" />}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Failed Operation
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-500" />
                Data Operations
              </h3>
              <div className="space-y-2">
                <GlassButton
                  onClick={demoDataFetch}
                  icon={<Download className="w-4 h-4" />}
                  className="w-full"
                >
                  Fetch Data
                </GlassButton>
                <GlassButton
                  onClick={demoSearch}
                  icon={<Search className="w-4 h-4" />}
                  className="w-full"
                >
                  Search Products
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-500" />
                File Operations
              </h3>
              <div className="space-y-2">
                <GlassButton
                  onClick={demoFileUpload}
                  icon={<Upload className="w-4 h-4" />}
                  className="w-full"
                >
                  Upload Files
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                Batch Operations
              </h3>
              <div className="space-y-2">
                <GlassButton
                  onClick={demoBatchOperations}
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="w-full"
                >
                  Batch Processing
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Concurrent Operations
              </h3>
              <div className="space-y-2">
                <GlassButton
                  onClick={demoConcurrentOperations}
                  icon={<Clock className="w-4 h-4" />}
                  className="w-full"
                >
                  Run Concurrent
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-500" />
                Results
              </h3>
              <div className="space-y-2">
                <GlassButton
                  onClick={clearResults}
                  icon={<CheckCircle className="w-4 h-4" />}
                  className="w-full"
                >
                  Clear Results
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Results */}
        <GlassCard>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">Operation Results</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No operations completed yet. Try running some operations above!
                </p>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm text-gray-700 font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Instructions */}
        <GlassCard className="mt-6">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">How to Use</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Click any operation button to start a loading operation</p>
              <p>• Watch the global loading indicator in the top-right corner</p>
              <p>• Multiple operations can run simultaneously</p>
              <p>• You can cancel pending operations</p>
              <p>• Expand the details view to see individual operation progress</p>
              <p>• Operations automatically clean up after completion</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoadingDemoPage;
