import React, { useState } from 'react';
import { Bug, RefreshCw, Database, Image, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { fixTemporaryImages, TemporaryImageFixer } from '../../lib/fixTemporaryImages';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

interface TemporaryImageFixerProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string; // Optional: if provided, only fix this product
}

const TemporaryImageFixerComponent: React.FC<TemporaryImageFixerProps> = ({ 
  isOpen, 
  onClose, 
  productId 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [orphanedFiles, setOrphanedFiles] = useState<string[]>([]);
  const [showOrphaned, setShowOrphaned] = useState(false);

  const runFix = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🔧 Running temporary image fix...');
      const result = await fixTemporaryImages(productId);
      setResults(result);
      console.log('✅ Fix completed:', result);
    } catch (error) {
      console.error('❌ Fix failed:', error);
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const findOrphanedImages = async () => {
    setIsRunning(true);
    setOrphanedFiles([]);
    
    try {
      console.log('🔍 Finding orphaned images...');
      const result = await TemporaryImageFixer.findOrphanedImages();
      
      if (result.success) {
        setOrphanedFiles(result.orphanedFiles);
        setShowOrphaned(true);
      } else {
        console.error('❌ Failed to find orphaned images:', result.message);
      }
    } catch (error) {
      console.error('❌ Error finding orphaned images:', error);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">
                {productId ? 'Fix Product Images' : 'Fix All Temporary Images'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This tool helps fix images that were uploaded to temporary product folders 
              but aren't properly linked in the database. This is a common issue when 
              creating products with images.
            </p>
            
            {productId && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Product ID:</strong> {productId}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-6">
            <GlassButton
              onClick={runFix}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {productId ? 'Fix This Product' : 'Fix All Products'}
            </GlassButton>
            
            <GlassButton
              onClick={findOrphanedImages}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Find Orphaned Images
            </GlassButton>
          </div>

          {isRunning && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p>Running image fix...</p>
            </div>
          )}

          {results && !isRunning && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                results.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {results.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {results.success ? 'Success' : 'Error'}
                  </span>
                </div>
                <p className={results.success ? 'text-green-800' : 'text-red-800'}>
                  {results.message}
                </p>
              </div>

              {results.fixedCount !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Results</h3>
                  <p className="text-sm text-blue-800">
                    <strong>Images Fixed:</strong> {results.fixedCount}
                  </p>
                </div>
              )}

              {results.results && Array.isArray(results.results) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Detailed Results</h3>
                  <div className="max-h-40 overflow-auto">
                    {results.results.map((result: any, index: number) => (
                      <div key={index} className="text-sm py-1 border-b last:border-b-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{result.productName}</span>
                          <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                            {result.fixedCount} images
                          </span>
                        </div>
                        {!result.success && (
                          <p className="text-red-600 text-xs">{result.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showOrphaned && orphanedFiles.length > 0 && (
            <div className="border rounded-lg p-4 mt-4">
              <h3 className="font-semibold mb-2">Orphaned Images Found</h3>
              <p className="text-sm text-gray-600 mb-3">
                These files exist in storage but aren't linked to any product:
              </p>
              <div className="max-h-40 overflow-auto">
                {orphanedFiles.map((file, index) => (
                  <div key={index} className="text-sm py-1 border-b last:border-b-0 font-mono">
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showOrphaned && orphanedFiles.length === 0 && (
            <div className="bg-green-50 p-4 rounded-lg mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">No Orphaned Images</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                All images in storage are properly linked to products.
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default TemporaryImageFixerComponent;
