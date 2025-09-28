import React, { useState } from 'react';
import { Package, Hash, FileText, Check, DollarSign } from 'lucide-react';
import CategoryInput from '@/features/shared/components/ui/CategoryInput';
import AIDescriptionGenerator from './AIDescriptionGenerator';
import { 
  formatSpecificationValue, 
  parseSpecification, 
  getSpecificationCount 
} from '../../lib/specificationUtils';

interface ProductInformationFormProps {
  formData: {
    name: string;
    description: string;
    sku: string;
    categoryId: string;
    condition: string;
    specification?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  categories: any[];
  currentErrors: Record<string, string>;
  isCheckingName: boolean;
  nameExists: boolean;
  onNameCheck: (name: string) => void;
  onSpecificationsClick: () => void;
  useVariants?: boolean;
}

const ProductInformationForm: React.FC<ProductInformationFormProps> = ({
  formData,
  setFormData,
  categories,
  currentErrors,
  isCheckingName,
  nameExists,
  onNameCheck,
  onSpecificationsClick,
  useVariants = false
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Package size={20} className="text-blue-600" />
        Product Information
      </h3>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name & Model */}
          <div>
            <label 
              htmlFor="product-name"
              className={`block mb-2 font-medium ${currentErrors.name ? 'text-red-600' : 'text-gray-700'}`}
            >
              Product Name & Model *
            </label>
            <div className="relative">
              <input
                id="product-name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  onNameCheck(e.target.value);
                }}
                className={`w-full py-3 pl-12 pr-12 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                  currentErrors.name 
                    ? 'border-red-500 focus:border-red-600' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="iPhone 14 Pro Max"
                required
              />
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              {isCheckingName && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            {currentErrors.name && (
              <p className="mt-1 text-sm text-red-600">{currentErrors.name}</p>
            )}
            {nameExists && (
              <p className="mt-1 text-sm text-amber-600">⚠️ A product with this name already exists</p>
            )}
          </div>

          {/* SKU */}
          <div>
            <label 
              htmlFor="sku"
              className={`block mb-2 font-medium ${currentErrors.sku ? 'text-red-600' : 'text-gray-700'}`}
            >
              SKU (Stock Keeping Unit) *
            </label>
            <div className="relative">
              <input
                id="sku"
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                  currentErrors.sku 
                    ? 'border-red-500 focus:border-red-600' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="IP14PM-256-GOLD"
                required
              />
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
            {currentErrors.sku && (
              <p className="mt-1 text-sm text-red-600">{currentErrors.sku}</p>
            )}
          </div>



          {/* Category */}
          <div>
            <label 
              htmlFor="category"
              className={`block mb-2 font-medium ${currentErrors.categoryId ? 'text-red-600' : 'text-gray-700'}`}
            >
              Category *
            </label>
            <CategoryInput
              value={formData.categoryId}
              onChange={(categoryId) => setFormData(prev => ({ ...prev, categoryId }))}
              categories={categories}
              placeholder="Select a category"
              required
              error={currentErrors.categoryId}
            />
            {currentErrors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{currentErrors.categoryId}</p>
            )}
          </div>

          {/* Condition */}
          <div>
            <label 
              htmlFor="condition"
              className={`block mb-2 font-medium ${currentErrors.condition ? 'text-red-600' : 'text-gray-700'}`}
            >
              Condition *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'new', label: 'New', color: 'bg-green-500 hover:bg-green-600 border-green-500' },
                { value: 'used', label: 'Used', color: 'bg-blue-500 hover:bg-blue-600 border-blue-500' },
                { value: 'refurbished', label: 'Refurbished', color: 'bg-purple-500 hover:bg-purple-600 border-purple-500' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, condition: option.value }))}
                  className={`py-3 px-4 rounded-lg border-2 transition-all duration-200 font-medium ${
                    formData.condition === option.value
                      ? `${option.color} text-white`
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                  } ${currentErrors.condition ? 'border-red-500' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {currentErrors.condition && (
              <p className="mt-1 text-sm text-red-600">{currentErrors.condition}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label 
            htmlFor="description"
            className={`block mb-2 text-sm font-medium ${currentErrors.description ? 'text-red-600' : 'text-gray-700'}`}
          >
            Description (optional)
          </label>
          <div className="relative">
            {isDescriptionExpanded ? (
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-all duration-200 resize-none ${
                  currentErrors.description 
                    ? 'border-red-500 focus:border-red-600' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Brief description..."
                maxLength={500}
                rows={4}
                onBlur={() => setIsDescriptionExpanded(false)}
                autoFocus
              />
            ) : (
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                  currentErrors.description 
                    ? 'border-red-500 focus:border-red-600' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Brief description..."
                maxLength={200}
                onFocus={() => setIsDescriptionExpanded(true)}
              />
            )}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`lucide lucide-file-text absolute left-3 text-gray-500 transition-all duration-200 ${
                isDescriptionExpanded ? 'top-4' : 'top-1/2 -translate-y-1/2'
              }`}
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
              <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
              <path d="M10 9H8"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
            </svg>
          </div>
          {currentErrors.description && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.description}</p>
          )}
          {isDescriptionExpanded && (
            <p className="mt-1 text-sm text-gray-500">
              {formData.description.length}/500 characters
            </p>
          )}
          
          {/* AI Description Generator */}
          <div className="mt-4">
            <AIDescriptionGenerator
              productName={formData.name}
              categoryName={categories.find(c => c.id === formData.categoryId)?.name}
              currentDescription={formData.description}
              onDescriptionGenerated={(description) => setFormData(prev => ({ ...prev, description }))}
              disabled={!formData.name.trim()}
            />
          </div>
        </div>

        {/* Specification - Only show when not using variants */}
        {!useVariants && (
          <div>
            <label 
              className={`block mb-2 font-medium ${currentErrors.specification ? 'text-red-600' : 'text-gray-700'}`}
            >
              Specification (optional)
            </label>
            <button
              type="button"
              onClick={() => onSpecificationsClick()}
              className="group w-full bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-md border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300 shadow-md group-hover:shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    {formData.specification && formData.specification.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left flex-1">
                    <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                      Product Specifications
                    </h4>
                    {formData.specification && formData.specification.length > 0 ? (
                      <div className="mt-2">
                        <div className="grid grid-cols-2 gap-2 max-h-16 overflow-y-auto">
                          {(() => {
                            const specs = parseSpecification(formData.specification);
                            // Filter out null/undefined/empty values
                            const validSpecs = Object.entries(specs).filter(([key, value]) => 
                              value !== null && value !== undefined && value !== '' && value !== 'null' && value !== 'undefined'
                            );
                            return validSpecs.slice(0, 4).map(([key, value]) => (
                              <div key={key} className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                                <div className="text-xs font-medium text-blue-800 truncate">{key.replace(/_/g, ' ')}</div>
                                <div className="text-xs text-blue-600 truncate">{formatSpecificationValue(key, value)}</div>
                              </div>
                            ));
                          })()}
                        </div>
                        {(() => {
                          const specs = parseSpecification(formData.specification);
                          // Filter out null/undefined/empty values
                          const validSpecs = Object.entries(specs).filter(([key, value]) => 
                            value !== null && value !== undefined && value !== '' && value !== 'null' && value !== 'undefined'
                          );
                          return validSpecs.length > 4 && (
                            <div className="text-xs text-blue-600 mt-1">
                              +{validSpecs.length - 4} more specifications
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        Add detailed product specifications
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {formData.specification && formData.specification.length > 0 && (
                    <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full shadow-md">
                      {getSpecificationCount(formData.specification)}
                    </div>
                  )}
                  
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-all duration-300">
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
            {currentErrors.specification && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {currentErrors.specification}
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductInformationForm;
