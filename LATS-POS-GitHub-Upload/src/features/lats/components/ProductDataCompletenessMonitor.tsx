import React, { useState, useEffect } from 'react';
import { 
  validateProductCompleteness, 
  calculateProductCompleteness,
  autoFixProductData,
  ProductValidationResult,
  ProductCompletenessCheck 
} from '../lib/data/productValidation';
import { Product } from '../types/inventory';
import { useInventoryStore } from '../stores/useInventoryStore';

interface ProductDataCompletenessMonitorProps {
  productId?: string;
  showAutoFix?: boolean;
  onDataFixed?: (product: Product) => void;
}

export const ProductDataCompletenessMonitor: React.FC<ProductDataCompletenessMonitorProps> = ({
  productId,
  showAutoFix = true,
  onDataFixed
}) => {
  const [validationResult, setValidationResult] = useState<ProductValidationResult | null>(null);
  const [completenessCheck, setCompletenessCheck] = useState<ProductCompletenessCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { getProductById, updateProduct } = useInventoryStore();

  useEffect(() => {
    if (productId) {
      validateProduct(productId);
    }
  }, [productId]);

  const validateProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const product = getProductById(id);
      if (product) {
        const validation = validateProductCompleteness(product);
        const completeness = calculateProductCompleteness(product);
        
        setValidationResult(validation);
        setCompletenessCheck(completeness);
      }
    } catch (error) {
      console.error('Error validating product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFix = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const product = getProductById(productId);
      if (product) {
        const fixedProduct = autoFixProductData(product);
        
        // Update the product in the store
        const response = await updateProduct(productId, fixedProduct);
        
        if (response.ok) {
          // Re-validate after fix
          await validateProduct(productId);
          onDataFixed?.(fixedProduct);
        }
      }
    } catch (error) {
      console.error('Error auto-fixing product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletenessIcon = (percentage: number) => {
    if (percentage >= 90) return '✅';
    if (percentage >= 70) return '⚠️';
    return '❌';
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!validationResult || !completenessCheck) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No product data to validate</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Data Completeness</span>
          <span className={`text-2xl ${getCompletenessColor(completenessCheck.completionPercentage)}`}>
            {getCompletenessIcon(completenessCheck.completionPercentage)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-lg font-bold ${getCompletenessColor(completenessCheck.completionPercentage)}`}>
            {completenessCheck.completionPercentage}%
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            completenessCheck.completionPercentage >= 90 ? 'bg-green-500' :
            completenessCheck.completionPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${completenessCheck.completionPercentage}%` }}
        ></div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {validationResult.errors.length}
          </div>
          <div className="text-sm text-gray-600">Critical Issues</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {validationResult.warnings.length}
          </div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
      </div>

      {/* Auto Fix Button */}
      {showAutoFix && validationResult.errors.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleAutoFix}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Fixing...' : 'Auto-Fix Issues'}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            This will automatically fix common data issues
          </p>
        </div>
      )}

      {/* Detailed Issues */}
      {showDetails && (
        <div className="space-y-4">
          {/* Critical Errors */}
          {validationResult.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-600 mb-2">Critical Issues</h4>
              <ul className="space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-600 mb-2">Warnings</h4>
              <ul className="space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Fields Summary */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Missing Fields</h4>
            
            {/* Product Level */}
            {validationResult.missingFields.product.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-600 mb-1">Product Level:</h5>
                <div className="flex flex-wrap gap-1">
                  {validationResult.missingFields.product.map((field, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Variant Level */}
            {validationResult.missingFields.variants.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-1">Variant Level:</h5>
                {validationResult.missingFields.variants.map((variant, index) => (
                  <div key={index} className="mb-2">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {variant.sku}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {variant.missingFields.map((field, fieldIndex) => (
                        <span key={fieldIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {completenessCheck.isComplete ? (
            <span className="text-green-600 font-medium">✅ Product data is complete and ready for use</span>
          ) : (
            <span className="text-red-600 font-medium">
              ⚠️ Product data needs attention before it can be used effectively
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDataCompletenessMonitor;
