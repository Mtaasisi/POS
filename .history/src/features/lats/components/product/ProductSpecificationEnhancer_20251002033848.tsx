import React, { useState } from 'react';
import { 
  Database, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';

interface ProductAnalysis {
  totalProducts: number;
  productsWithSpecs: number;
  productsWithoutSpecs: number;
  specCoveragePercentage: number;
  avgSpecCount: number;
  maxSpecCount: number;
  minSpecCount: number;
}

interface CategoryAnalysis {
  categoryName: string;
  productCount: number;
  withSpecs: number;
  specCoverage: number;
}

interface ProductEnhancement {
  id: string;
  name: string;
  category: string;
  currentSpecCount: number;
  enhancedSpecCount: number;
  status: 'pending' | 'enhanced' | 'failed';
}

const ProductSpecificationEnhancer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [products, setProducts] = useState<ProductEnhancement[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Enhanced specification templates
  const specificationTemplates = {
    'smartphone': {
      'device_type': 'Smartphone',
      'screen_size': '6.1 inches',
      'display_type': 'OLED',
      'resolution': '1080x2400',
      'processor': 'Octa-core',
      'ram': '8GB',
      'storage': '128GB',
      'camera_main': '50MP',
      'camera_front': '12MP',
      'battery_capacity': '4000mAh',
      'charging': 'Fast charging',
      'connectivity': '5G',
      'water_resistance': 'IP68',
      'weight': '180g'
    },
    'laptop': {
      'device_type': 'Laptop',
      'screen_size': '13.3 inches',
      'display_type': 'IPS',
      'resolution': '1920x1080',
      'processor': 'Intel Core i7',
      'ram': '16GB',
      'storage': '512GB SSD',
      'graphics': 'Integrated',
      'battery_life': '10 hours',
      'weight': '1.3kg',
      'connectivity': 'WiFi 6, Bluetooth 5.0'
    },
    'audio': {
      'device_type': 'Audio',
      'driver_size': '40mm',
      'frequency_response': '20Hz-20kHz',
      'connectivity': 'Bluetooth 5.0',
      'battery_life': '30 hours',
      'noise_cancellation': 'Active',
      'water_resistance': 'IPX4',
      'weight': '250g'
    },
    'tablet': {
      'device_type': 'Tablet',
      'screen_size': '10.9 inches',
      'display_type': 'LCD',
      'processor': 'A14 Bionic',
      'ram': '4GB',
      'storage': '64GB',
      'battery_life': '10 hours',
      'stylus_support': 'Yes'
    },
    'footwear': {
      'product_type': 'Footwear',
      'material': 'Mesh/Leather',
      'sole_material': 'Rubber',
      'closure_type': 'Lace-up',
      'water_resistance': 'Waterproof',
      'breathability': 'High',
      'weight': '300g'
    }
  };

  // Detect product category based on name
  const detectProductCategory = (productName: string): string => {
    const name = productName.toLowerCase();
    
    if (name.includes('iphone') || name.includes('galaxy') || name.includes('pixel') || name.includes('phone')) {
      return 'smartphone';
    } else if (name.includes('macbook') || name.includes('laptop') || name.includes('notebook')) {
      return 'laptop';
    } else if (name.includes('airpods') || name.includes('headphone') || name.includes('earphone')) {
      return 'audio';
    } else if (name.includes('ipad') || name.includes('tablet')) {
      return 'tablet';
    } else if (name.includes('nike') || name.includes('adidas') || name.includes('shoe')) {
      return 'footwear';
    }
    
    return 'general';
  };

  // Analyze current product specifications
  const analyzeProducts = async () => {
    setIsAnalyzing(true);
    try {
      // Get overall analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('lats_products')
        .select('id, name, attributes, category_id, lats_categories(name)')
        .eq('is_active', true);

      if (analysisError) throw analysisError;

      const totalProducts = analysisData?.length || 0;
      const productsWithSpecs = analysisData?.filter(p => 
        p.attributes && Object.keys(p.attributes).length > 0
      ).length || 0;
      const productsWithoutSpecs = totalProducts - productsWithSpecs;
      const specCoveragePercentage = totalProducts > 0 ? 
        Math.round((productsWithSpecs / totalProducts) * 100) : 0;

      // Calculate spec counts
      const specCounts = analysisData?.map(p => 
        p.attributes ? Object.keys(p.attributes).length : 0
      ) || [];
      const avgSpecCount = specCounts.length > 0 ? 
        Math.round(specCounts.reduce((a, b) => a + b, 0) / specCounts.length) : 0;
      const maxSpecCount = Math.max(...specCounts, 0);
      const minSpecCount = Math.min(...specCounts, 0);

      setAnalysis({
        totalProducts,
        productsWithSpecs,
        productsWithoutSpecs,
        specCoveragePercentage,
        avgSpecCount,
        maxSpecCount,
        minSpecCount
      });

      // Category analysis
      const categoryMap = new Map<string, { total: number; withSpecs: number }>();
      
      analysisData?.forEach(product => {
        const categoryName = product.lats_categories?.name || 'Uncategorized';
        const hasSpecs = product.attributes && Object.keys(product.attributes).length > 0;
        
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { total: 0, withSpecs: 0 });
        }
        
        const category = categoryMap.get(categoryName)!;
        category.total++;
        if (hasSpecs) category.withSpecs++;
      });

      const categoryAnalysisData = Array.from(categoryMap.entries()).map(([name, data]) => ({
        categoryName: name,
        productCount: data.total,
        withSpecs: data.withSpecs,
        specCoverage: Math.round((data.withSpecs / data.total) * 100)
      }));

      setCategoryAnalysis(categoryAnalysisData);

      // Prepare products for enhancement
      const productsData = analysisData?.map(product => {
        const category = detectProductCategory(product.name);
        const currentSpecCount = product.attributes ? Object.keys(product.attributes).length : 0;
        const template = specificationTemplates[category as keyof typeof specificationTemplates] || {};
        const enhancedSpecCount = Object.keys(template).length;

        return {
          id: product.id,
          name: product.name,
          category,
          currentSpecCount,
          enhancedSpecCount,
          status: 'pending' as const
        };
      }) || [];

      setProducts(productsData);
      toast.success('Product analysis completed successfully');

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze products');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Enhance product specifications
  const enhanceSpecifications = async () => {
    setIsEnhancing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const product of products) {
        try {
          // Get current product data
          const { data: productData, error: fetchError } = await supabase
            .from('lats_products')
            .select('attributes')
            .eq('id', product.id)
            .single();

          if (fetchError) throw fetchError;

          // Get template for this product category
          const template = specificationTemplates[product.category as keyof typeof specificationTemplates] || {};
          
          // Merge existing attributes with template
          const existingAttrs = productData?.attributes || {};
          const enhancedAttrs = {
            ...template,
            ...existingAttrs,
            model: product.name,
            category: product.category,
            last_updated: new Date().toISOString()
          };

          // Update product with enhanced specifications
          const { error: updateError } = await supabase
            .from('lats_products')
            .update({
              attributes: enhancedAttrs,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id);

          if (updateError) throw updateError;

          // Update local state
          setProducts(prev => prev.map(p => 
            p.id === product.id 
              ? { ...p, status: 'enhanced' as const }
              : p
          ));

          successCount++;
          toast.success(`Enhanced ${product.name}`);

        } catch (error) {
          console.error(`Error enhancing ${product.name}:`, error);
          setProducts(prev => prev.map(p => 
            p.id === product.id 
              ? { ...p, status: 'failed' as const }
              : p
          ));
          failCount++;
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`Enhancement completed: ${successCount} successful, ${failCount} failed`);

    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance specifications');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Export analysis report
  const exportReport = () => {
    const report = {
      analysis,
      categoryAnalysis,
      products: products.map(p => ({
        name: p.name,
        category: p.category,
        currentSpecs: p.currentSpecCount,
        enhancedSpecs: p.enhancedSpecCount,
        status: p.status
      })),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-specification-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Product Specification Enhancer</h1>
              <p className="text-sm text-gray-600">Analyze and enhance product specifications based on models</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={analyzeProducts}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              <BarChart3 size={16} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Products'}
            </button>
            <button
              onClick={exportReport}
              disabled={!analysis}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysis.totalProducts}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysis.productsWithSpecs}</div>
                <div className="text-sm text-gray-600">With Specifications</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysis.productsWithoutSpecs}</div>
                <div className="text-sm text-gray-600">Without Specifications</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysis.specCoveragePercentage}%</div>
                <div className="text-sm text-gray-600">Coverage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Analysis */}
      {categoryAnalysis.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Products</th>
                  <th className="text-right py-2">With Specs</th>
                  <th className="text-right py-2">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {categoryAnalysis.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{category.categoryName}</td>
                    <td className="py-2 text-right">{category.productCount}</td>
                    <td className="py-2 text-right">{category.withSpecs}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        category.specCoverage >= 80 ? 'bg-green-100 text-green-800' :
                        category.specCoverage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {category.specCoverage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products List */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Products Enhancement</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
              >
                <Eye size={14} />
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
              <button
                onClick={enhanceSpecifications}
                disabled={isEnhancing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                <Zap size={16} />
                {isEnhancing ? 'Enhancing...' : 'Enhance All'}
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      {product.category} • {product.currentSpecCount} → {product.enhancedSpecCount} specs
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.status === 'enhanced' ? 'bg-green-100 text-green-800' :
                      product.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showDetails && (
            <div className="text-center py-8 text-gray-500">
              <Database size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">{products.length} products ready for enhancement</p>
              <p className="text-sm">Click "Show Details" to see individual products or "Enhance All" to start the process</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSpecificationEnhancer;
