import React, { useState, useEffect } from 'react';
import { Bug, Image, X, RefreshCw, Database, Eye } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { usePOSStore } from '../../stores/usePOSStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

interface ImageDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImageDebugPanel: React.FC<ImageDebugPanelProps> = ({ isOpen, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { products, searchProducts } = useInventoryStore();
  const { searchResults } = usePOSStore();

  const runDebugTest = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      console.log('🔍 Running image debug test...');
      
      // Test 1: Check inventory store products
      const inventoryProductsWithImages = products.filter(p => p.images && p.images.length > 0);
      
      // Test 2: Check search results
      const searchResultsWithImages = searchResults.filter(p => p.images && p.images.length > 0);
      
      // Test 3: Run a test search
      const testSearchResult = await searchProducts('test');
      
      const debugData = {
        timestamp: new Date().toISOString(),
        inventory: {
          totalProducts: products.length,
          productsWithImages: inventoryProductsWithImages.length,
          sampleProduct: products[0] ? {
            id: products[0].id,
            name: products[0].name,
            hasImages: !!(products[0].images && products[0].images.length > 0),
            imageCount: products[0].images?.length || 0,
            firstImage: products[0].images?.[0] || null
          } : null
        },
        searchResults: {
          totalResults: searchResults.length,
          resultsWithImages: searchResultsWithImages.length,
          sampleResult: searchResults[0] ? {
            id: searchResults[0].id,
            name: searchResults[0].name,
            hasImages: !!(searchResults[0].images && searchResults[0].images.length > 0),
            imageCount: searchResults[0].images?.length || 0,
            firstImage: searchResults[0].images?.[0] || null
          } : null
        },
        testSearch: {
          success: testSearchResult.ok,
          message: testSearchResult.message,
          resultsCount: testSearchResult.data?.length || 0,
          resultsWithImages: testSearchResult.data?.filter(p => p.images && p.images.length > 0).length || 0
        },
        analysis: {
          inventoryImagePercentage: products.length > 0 ? (inventoryProductsWithImages.length / products.length * 100).toFixed(1) : '0',
          searchImagePercentage: searchResults.length > 0 ? (searchResultsWithImages.length / searchResults.length * 100).toFixed(1) : '0',
          testSearchImagePercentage: testSearchResult.data && testSearchResult.data.length > 0 ? 
            (testSearchResult.data.filter(p => p.images && p.images.length > 0).length / testSearchResult.data.length * 100).toFixed(1) : '0'
        }
      };
      
      setDebugInfo(debugData);
      console.log('✅ Debug test completed:', debugData);
      
    } catch (error) {
      console.error('❌ Debug test failed:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDebugTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Image Debug Panel</h2>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={runDebugTest}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </GlassButton>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p>Running debug tests...</p>
            </div>
          )}

          {debugInfo && !isLoading && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">Inventory Store</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {debugInfo.inventory.productsWithImages}/{debugInfo.inventory.totalProducts}
                  </div>
                  <div className="text-sm text-gray-600">
                    {debugInfo.analysis.inventoryImagePercentage}% with images
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">Search Results</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {debugInfo.searchResults.resultsWithImages}/{debugInfo.searchResults.totalResults}
                  </div>
                  <div className="text-sm text-gray-600">
                    {debugInfo.analysis.searchImagePercentage}% with images
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold">Test Search</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {debugInfo.testSearch.resultsWithImages}/{debugInfo.testSearch.resultsCount}
                  </div>
                  <div className="text-sm text-gray-600">
                    {debugInfo.analysis.testSearchImagePercentage}% with images
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detailed Analysis</h3>
                
                {/* Inventory Store */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Inventory Store Products</h4>
                  {debugInfo.inventory.sampleProduct ? (
                    <div className="text-sm space-y-1">
                      <div><strong>Sample Product:</strong> {debugInfo.inventory.sampleProduct.name}</div>
                      <div><strong>Has Images:</strong> {debugInfo.inventory.sampleProduct.hasImages ? '✅ Yes' : '❌ No'}</div>
                      <div><strong>Image Count:</strong> {debugInfo.inventory.sampleProduct.imageCount}</div>
                      {debugInfo.inventory.sampleProduct.firstImage && (
                        <div><strong>First Image:</strong> {debugInfo.inventory.sampleProduct.firstImage}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No products in inventory store</div>
                  )}
                </div>

                {/* Search Results */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Search Results</h4>
                  {debugInfo.searchResults.sampleResult ? (
                    <div className="text-sm space-y-1">
                      <div><strong>Sample Result:</strong> {debugInfo.searchResults.sampleResult.name}</div>
                      <div><strong>Has Images:</strong> {debugInfo.searchResults.sampleResult.hasImages ? '✅ Yes' : '❌ No'}</div>
                      <div><strong>Image Count:</strong> {debugInfo.searchResults.sampleResult.imageCount}</div>
                      {debugInfo.searchResults.sampleResult.firstImage && (
                        <div><strong>First Image:</strong> {debugInfo.searchResults.sampleResult.firstImage}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No search results</div>
                  )}
                </div>

                {/* Test Search */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Test Search Results</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Success:</strong> {debugInfo.testSearch.success ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Message:</strong> {debugInfo.testSearch.message || 'No message'}</div>
                    <div><strong>Results Count:</strong> {debugInfo.testSearch.resultsCount}</div>
                    <div><strong>Results with Images:</strong> {debugInfo.testSearch.resultsWithImages}</div>
                  </div>
                </div>
              </div>

              {/* Raw Data */}
              <details className="border rounded-lg p-4">
                <summary className="font-medium cursor-pointer">Raw Debug Data</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {debugInfo?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{debugInfo.error}</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ImageDebugPanel;
