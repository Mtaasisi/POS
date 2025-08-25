import React from 'react';
import { DollarSign, Package } from 'lucide-react';
import PriceInput from '../../../../shared/components/ui/PriceInput';

interface PricingAndStockFormProps {
  formData: {
    price: number;
    costPrice: number;
    stockQuantity: number;
    minStockLevel: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  currentErrors: Record<string, string>;
}

const PricingAndStockForm: React.FC<PricingAndStockFormProps> = ({
  formData,
  setFormData,
  currentErrors
}) => {
  const updateStockQuantity = (change: number) => {
    setFormData(prev => ({
      ...prev,
      stockQuantity: Math.max(0, prev.stockQuantity + change)
    }));
  };

  const updateMinStockLevel = (change: number) => {
    setFormData(prev => ({
      ...prev,
      minStockLevel: Math.max(0, prev.minStockLevel + change)
    }));
  };

  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign size={20} className="text-green-600" />
        Pricing & Stock
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost Price */}
        <div>
          <label 
            htmlFor="cost-price"
            className={`block mb-2 font-medium ${currentErrors.costPrice ? 'text-red-600' : 'text-gray-700'}`}
          >
            Cost Price *
          </label>
          <PriceInput
            value={formData.costPrice}
            onChange={(value) => setFormData(prev => ({ ...prev, costPrice: value }))}
            placeholder="Cost price"
            className={`w-full ${currentErrors.costPrice ? 'border-red-500' : ''}`}
            required
          />
          {currentErrors.costPrice && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.costPrice}</p>
          )}
        </div>

        {/* Selling Price */}
        <div>
          <label 
            htmlFor="selling-price"
            className={`block mb-2 font-medium ${currentErrors.price ? 'text-red-600' : 'text-gray-700'}`}
          >
            Selling Price *
          </label>
          <PriceInput
            value={formData.price}
            onChange={(value) => setFormData(prev => ({ ...prev, price: value }))}
            placeholder="Selling price"
            className={`w-full ${currentErrors.price ? 'border-red-500' : ''}`}
            required
          />
          {currentErrors.price && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.price}</p>
          )}
        </div>

        {/* Stock Quantity */}
        <div>
          <label 
            htmlFor="stock-quantity"
            className={`block mb-2 font-medium ${currentErrors.stockQuantity ? 'text-red-600' : 'text-gray-700'}`}
          >
            Stock Quantity *
          </label>
          <div className="relative">
            <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-900">
                {formData.stockQuantity || 0}
              </span>
            </div>
            
            {/* Minus button on the left */}
            <button
              type="button"
              onClick={() => updateStockQuantity(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
              aria-label="Decrease stock quantity"
            >
              −
            </button>
            
            {/* Plus button on the right */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => updateStockQuantity(1)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                aria-label="Increase stock quantity"
              >
                +
              </button>
            </div>
          </div>
          {currentErrors.stockQuantity && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.stockQuantity}</p>
          )}
        </div>

        {/* Min Stock Level */}
        <div>
          <label 
            htmlFor="min-stock-level"
            className={`block mb-2 font-medium ${currentErrors.minStockLevel ? 'text-red-600' : 'text-gray-700'}`}
          >
            Min Stock Level *
          </label>
          <div className="relative">
            <div className="w-full py-3 px-3 pr-20 pl-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-900">
                {formData.minStockLevel || 0}
              </span>
            </div>
            
            {/* Minus button on the left */}
            <button
              type="button"
              onClick={() => updateMinStockLevel(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
              aria-label="Decrease minimum stock level"
            >
              −
            </button>
            
            {/* Plus button on the right */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => updateMinStockLevel(1)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                aria-label="Increase minimum stock level"
              >
                +
              </button>
            </div>
          </div>
          {currentErrors.minStockLevel && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.minStockLevel}</p>
          )}
        </div>
      </div>

      {/* Profit Margin Display */}
      {formData.price > 0 && formData.costPrice > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Profit Margin:</span>
            <span className="font-semibold text-blue-600">
              TZS {(formData.price - formData.costPrice).toLocaleString()} 
              ({(((formData.price - formData.costPrice) / formData.price) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingAndStockForm;
