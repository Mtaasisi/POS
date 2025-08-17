import React from 'react';
import { useGeneralSettingsContext } from '../context/GeneralSettingsContext';

const GeneralSettingsDemo: React.FC = () => {
  const {
    settings,
    formatCurrency,
    formatDate,
    formatTime,
    showProductImages,
    showStockLevels,
    showPrices,
    showBarcodes,
    productsPerPage,
    autoCompleteSearch,
    confirmDelete,
    showConfirmations,
    enableSoundEffects,
    enableAnimations
  } = useGeneralSettingsContext();

  if (!settings) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Loading general settings...</p>
      </div>
    );
  }

  const sampleProduct = {
    id: '1',
    name: 'iPhone 14 Pro',
    price: 2500000,
    stock: 15,
    barcode: '1234567890123',
    image: 'https://via.placeholder.com/150'
  };

  const sampleDate = new Date();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">General Settings Demo</h2>
      
      {/* Current Settings Display */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Current Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Theme:</span> {settings.theme}
          </div>
          <div>
            <span className="font-medium">Language:</span> {settings.language}
          </div>
          <div>
            <span className="font-medium">Currency:</span> {settings.currency}
          </div>
          <div>
            <span className="font-medium">Timezone:</span> {settings.timezone}
          </div>
        </div>
      </div>

      {/* Formatting Examples */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Formatting Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-800">Currency Formatting</div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(sampleProduct.price)}
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-green-800">Date Formatting</div>
            <div className="text-lg font-bold text-green-600">
              {formatDate(sampleDate)}
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-800">Time Formatting</div>
            <div className="text-lg font-bold text-purple-600">
              {formatTime(sampleDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Product Display Demo */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Product Display Demo</h3>
        <div className="product-card p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Image */}
            {showProductImages && (
              <div className="product-image">
                <img 
                  src={sampleProduct.image} 
                  alt={sampleProduct.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            
            {/* Product Details */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">{sampleProduct.name}</h4>
              
              {showPrices && (
                <div className="price price-display">
                  {formatCurrency(sampleProduct.price)}
                </div>
              )}
              
              {showStockLevels && (
                <div className="stock-level">
                  <span className="font-medium">Stock:</span>
                  <span className={`ml-2 ${
                    sampleProduct.stock > 10 ? 'stock-level-high' : 
                    sampleProduct.stock > 5 ? 'stock-level-medium' : 'stock-level-low'
                  }`}>
                    {sampleProduct.stock} units
                  </span>
                </div>
              )}
              
              {showBarcodes && (
                <div className="barcode barcode-display">
                  {sampleProduct.barcode}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Settings Demo */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Behavior Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="font-medium">Auto Complete</div>
            <div className={`text-lg ${autoCompleteSearch ? 'text-green-600' : 'text-red-600'}`}>
              {autoCompleteSearch ? '✅ Enabled' : '❌ Disabled'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="font-medium">Confirm Delete</div>
            <div className={`text-lg ${confirmDelete ? 'text-green-600' : 'text-red-600'}`}>
              {confirmDelete ? '✅ Enabled' : '❌ Disabled'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="font-medium">Sound Effects</div>
            <div className={`text-lg ${enableSoundEffects ? 'text-green-600' : 'text-red-600'}`}>
              {enableSoundEffects ? '✅ Enabled' : '❌ Disabled'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="font-medium">Animations</div>
            <div className={`text-lg ${enableAnimations ? 'text-green-600' : 'text-red-600'}`}>
              {enableAnimations ? '✅ Enabled' : '❌ Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Performance Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium">Products per Page</div>
            <div className="text-lg font-bold text-blue-600">{productsPerPage}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium">Cache Duration</div>
            <div className="text-lg font-bold text-blue-600">{settings.cache_duration}s</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium">Max Search Results</div>
            <div className="text-lg font-bold text-blue-600">{settings.max_search_results}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsDemo;
