import React from 'react';
import { BackButton } from '../../shared/components/ui/BackButton';
import ProductSpecificationEnhancer from '../components/product/ProductSpecificationEnhancer';

const ProductSpecificationEnhancerPage: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 h-full overflow-y-auto pt-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/lats/unified-inventory" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Product Specification Enhancer</h1>
              <p className="text-sm text-gray-600">Analyze and enhance product specifications based on models</p>
            </div>
          </div>
        </div>

        {/* Enhancer Component */}
        <ProductSpecificationEnhancer />
      </div>
    </div>
  );
};

export default ProductSpecificationEnhancerPage;
