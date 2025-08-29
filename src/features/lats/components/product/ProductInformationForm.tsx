import React from 'react';
import { Package, Tag, Hash, FileText } from 'lucide-react';
import { Category } from '../../../../lib/categoryApi';

interface ProductInformationFormProps {
  formData: {
    name: string;
    sku: string;
    barcode: string;
    categoryId: string;
    description: string;
    specification: string;
    condition: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  categories: Category[];
  currentErrors: Record<string, string>;
  isCheckingName: boolean;
  nameExists: boolean;
  onNameCheck: (name: string) => void;
  onSpecificationsClick: () => void;
}

const ProductInformationForm: React.FC<ProductInformationFormProps> = ({
  formData,
  setFormData,
  categories,
  currentErrors,
  isCheckingName,
  nameExists,
  onNameCheck,
  onSpecificationsClick
}) => {
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

          {/* Barcode */}
          <div>
            <label 
              htmlFor="barcode"
              className="block mb-2 font-medium text-gray-700"
            >
              Barcode (optional)
            </label>
            <div className="relative">
              <input
                id="barcode"
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors border-gray-300 focus:border-blue-500"
                placeholder="123456789012"
              />
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>

          {/* Category */}
          <div>
            <label 
              htmlFor="category"
              className={`block mb-2 font-medium ${currentErrors.categoryId ? 'text-red-600' : 'text-gray-700'}`}
            >
              Category *
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                currentErrors.categoryId 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
            <select
              id="condition"
              value={formData.condition}
              onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
              className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                currentErrors.condition 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              required
            >
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="refurbished">Refurbished</option>
            </select>
            {currentErrors.condition && (
              <p className="mt-1 text-sm text-red-600">{currentErrors.condition}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label 
            htmlFor="description"
            className={`block mb-2 font-medium ${currentErrors.description ? 'text-red-600' : 'text-gray-700'}`}
          >
            Description (optional)
          </label>
          <div className="relative">
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors resize-none ${
                currentErrors.description 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Product description..."
              rows={4}
              maxLength={500}
            />
            <FileText className="absolute left-4 top-4 text-gray-500" size={18} />
          </div>
          <div className="flex justify-between items-center mt-1">
            {currentErrors.description && (
              <p className="text-sm text-red-600">{currentErrors.description}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.description.length}/500 characters
            </p>
          </div>
        </div>

        {/* Specification */}
        <div>
          <label 
            className={`block mb-2 font-medium ${currentErrors.specification ? 'text-red-600' : 'text-gray-700'}`}
          >
            Specification (optional)
          </label>
          <button
            type="button"
            onClick={() => onSpecificationsClick()}
            className="group w-full bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors duration-200">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                    Product Specifications
                  </h4>
                  <p className="text-xs text-gray-600">
                    {formData.specification && formData.specification.length > 0 
                      ? `${formData.specification.length} characters added`
                      : 'Add product specifications'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {formData.specification && formData.specification.length > 0 && (
                  <div className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md">
                    {Math.ceil(formData.specification.length / 100)}%
                  </div>
                )}
                
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>
          {currentErrors.specification && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.specification}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProductInformationForm;
