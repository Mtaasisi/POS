import React, { useState, useEffect } from 'react';
import { Database, Image, CheckCircle, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

interface ImageTestComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImageTestComponent: React.FC<ImageTestComponentProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runImageTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      console.log('🧪 Running image fetch test...');

      // Test 1: Check if product_images table has data
      const { data: imageCount, error: countError } = await supabase
        .from('product_images')
        .select('id', { count: 'exact' });

      if (countError) {
        throw new Error(`Failed to count images: ${countError.message}`);
      }

      // Test 2: Get a sample of images
      const { data: sampleImages, error: sampleError } = await supabase
        .from('product_images')
        .select('id, product_id, image_url, file_name, is_primary')
        .limit(5);

      if (sampleError) {
        throw new Error(`Failed to get sample images: ${sampleError.message}`);
      }

      // Test 3: Get products with their images
      const { data: productsWithImages, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          images
        `)
        .limit(3);

      if (productsError) {
        throw new Error(`Failed to get products with images: ${productsError.message}`);
      }

      // Test 4: Test the searchProducts function (simulate what we fixed)
      const testSearchQuery = 'test';
      const { data: searchResults, error: searchError } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(name),
          lats_brands(name),
          lats_product_variants(*)
        `)
        .or(`name.ilike.%${testSearchQuery}%,description.ilike.%${testSearchQuery}%`)
        .eq('is_active', true)
        .limit(3);

      if (searchError) {
        throw new Error(`Failed to search products: ${searchError.message}`);
      }

      // Test 5: Manually fetch images for search results (like our fix does)
      const searchResultsWithImages = await Promise.all(
        (searchResults || []).map(async (product: any) => {
          const { data: images, error: imagesError } = await supabase
            .from('product_images')
            .select('image_url, thumbnail_url, is_primary')
            .eq('product_id', product.id)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });

          if (imagesError) {
            console.error('Error fetching images for product:', product.id, imagesError);
          }

          const imageUrls = (images || []).map(img => img.image_url || img.thumbnail_url).filter(Boolean);

          return {
            id: product.id,
            name: product.name,
            images: imageUrls,
            imageCount: imageUrls.length
          };
        })
      );

      const results = {
        timestamp: new Date().toISOString(),
        totalImages: imageCount?.length || 0,
        sampleImages: sampleImages || [],
        productsWithImages: productsWithImages || [],
        searchResults: searchResultsWithImages,
        analysis: {
          productsWithImagesCount: (productsWithImages || []).filter(p => p.product_images && p.product_images.length > 0).length,
          searchResultsWithImagesCount: searchResultsWithImages.filter(p => p.imageCount > 0).length,
          averageImagesPerProduct: productsWithImages && productsWithImages.length > 0 
            ? (productsWithImages.reduce((sum, p) => sum + (p.product_images?.length || 0), 0) / productsWithImages.length).toFixed(1)
            : '0'
        }
      };

      setTestResults(results);
      console.log('✅ Image test completed:', results);

    } catch (error) {
      console.error('❌ Image test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runImageTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Image Fetch Test</h2>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={runImageTest}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Retest
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
              <p>Running image fetch test...</p>
            </div>
          )}

          {testResults && !isLoading && (
            <div className="space-y-6">
              {testResults.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">Test Failed</span>
                  </div>
                  <p className="text-red-700">{testResults.error}</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Image className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Total Images</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {testResults.totalImages}
                      </div>
                      <div className="text-sm text-gray-600">
                        In database
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">Products with Images</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {testResults.analysis.productsWithImagesCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        Out of {testResults.productsWithImages?.length || 0} tested
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold">Avg Images/Product</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {testResults.analysis.averageImagesPerProduct}
                      </div>
                      <div className="text-sm text-gray-600">
                        Average
                      </div>
                    </div>
                  </div>

                  {/* Sample Images */}
                  {testResults.sampleImages.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Sample Images from Database</h3>
                      <div className="space-y-2">
                        {testResults.sampleImages.map((img: any, index: number) => (
                          <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                            <div><strong>ID:</strong> {img.id}</div>
                            <div><strong>Product ID:</strong> {img.product_id}</div>
                            <div><strong>File:</strong> {img.file_name}</div>
                            <div><strong>Primary:</strong> {img.is_primary ? 'Yes' : 'No'}</div>
                            <div><strong>URL:</strong> 
                              <a href={img.image_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline ml-1">
                                View Image
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results Test */}
                  {testResults.searchResults.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Search Results Test (Fixed Function)</h3>
                      <div className="space-y-2">
                        {testResults.searchResults.map((product: any, index: number) => (
                          <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                            <div><strong>Product:</strong> {product.name}</div>
                            <div><strong>Images Found:</strong> {product.imageCount}</div>
                            {product.images.length > 0 && (
                              <div><strong>Image URLs:</strong> {product.images.join(', ')}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Data */}
                  <details className="border rounded-lg p-4">
                    <summary className="font-medium cursor-pointer">Raw Test Data</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </details>
                </>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ImageTestComponent;
