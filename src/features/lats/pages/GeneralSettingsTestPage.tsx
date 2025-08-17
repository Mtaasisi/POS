import React, { useState } from 'react';
import { useGeneralSettingsUI } from '../../../hooks/useGeneralSettingsUI';
import GeneralSettingsDemo from '../../../components/GeneralSettingsDemo';

const GeneralSettingsTestPage: React.FC = () => {
  const {
    formatCurrency,
    formatDate,
    formatTime,
    showProductImages,
    showStockLevels,
    showPrices,
    showBarcodes,
    autoCompleteSearch,
    confirmDelete,
    showConfirmations,
    enableSoundEffects,
    enableAnimations,
    productsPerPage,
    getProductImageClass,
    getStockLevelClass,
    getPriceClass,
    getBarcodeClass,
    getAnimationClass,
    getSoundClass,
    isDarkMode,
    isSwahili,
    isFrench,
    isEnglish,
    getCurrencySymbol,
    getStockLevelClass: getStockLevelClassHelper,
    shouldShowConfirmation,
    getSearchConfig,
    getCacheConfig,
    settings,
    loading,
    error
  } = useGeneralSettingsUI();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data
  const sampleProducts = [
    {
      id: '1',
      name: 'iPhone 14 Pro',
      price: 2500000,
      stock: 15,
      barcode: '1234567890123',
      image: 'https://via.placeholder.com/150'
    },
    {
      id: '2',
      name: 'Samsung Galaxy S23',
      price: 1800000,
      stock: 8,
      barcode: '1234567890124',
      image: 'https://via.placeholder.com/150'
    },
    {
      id: '3',
      name: 'MacBook Pro M2',
      price: 4500000,
      stock: 3,
      barcode: '1234567890125',
      image: 'https://via.placeholder.com/150'
    }
  ];

  const sampleDate = new Date();

  const handleDeleteClick = () => {
    if (shouldShowConfirmation('delete')) {
      setShowDeleteConfirmation(true);
    } else {
      // Direct delete without confirmation
      console.log('Deleting item directly...');
    }
  };

  const handleConfirmDelete = () => {
    console.log('Item deleted with confirmation');
    setShowDeleteConfirmation(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading general settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Settings</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">General Settings Test Page</h1>
          <p className="text-gray-600">This page demonstrates how general settings affect the UI</p>
        </div>

        {/* Settings Status */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Settings Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800">Theme</div>
              <div className="text-sm text-blue-600">{settings?.theme || 'light'}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800">Language</div>
              <div className="text-sm text-green-600">{settings?.language || 'en'}</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-800">Currency</div>
              <div className="text-sm text-purple-600">{getCurrencySymbol()}</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="font-medium text-yellow-800">Dark Mode</div>
              <div className="text-sm text-yellow-600">{isDarkMode() ? 'Yes' : 'No'}</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="font-medium text-indigo-800">Animations</div>
              <div className="text-sm text-indigo-600">{enableAnimations ? 'On' : 'Off'}</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="font-medium text-pink-800">Sound Effects</div>
              <div className="text-sm text-pink-600">{enableSoundEffects ? 'On' : 'Off'}</div>
            </div>
          </div>
        </div>

        {/* Formatting Examples */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Formatting Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Currency Formatting</h3>
              <div className="space-y-2">
                <div className="text-lg font-bold">{formatCurrency(2500000)}</div>
                <div className="text-lg font-bold">{formatCurrency(150000)}</div>
                <div className="text-lg font-bold">{formatCurrency(50000)}</div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Date & Time</h3>
              <div className="space-y-2">
                <div className="text-lg font-bold">{formatDate(sampleDate)}</div>
                <div className="text-lg font-bold">{formatTime(sampleDate)}</div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Language Detection</h3>
              <div className="space-y-2">
                <div className="text-sm">English: {isEnglish() ? '✅' : '❌'}</div>
                <div className="text-sm">Swahili: {isSwahili() ? '✅' : '❌'}</div>
                <div className="text-sm">French: {isFrench() ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid Demo */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Product Grid Demo</h2>
          <div className={`product-grid ${getAnimationClass()}`}>
            {sampleProducts.map((product) => (
              <div key={product.id} className={`product-card ${getAnimationClass()}`}>
                {/* Product Image */}
                <div className={getProductImageClass()}>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                </div>
                
                {/* Product Details */}
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                
                {/* Price */}
                <div className={getPriceClass()}>
                  {formatCurrency(product.price)}
                </div>
                
                {/* Stock Level */}
                <div className={getStockLevelClassHelper(product.stock)}>
                  Stock: {product.stock} units
                </div>
                
                {/* Barcode */}
                <div className={getBarcodeClass()}>
                  {product.barcode}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Behavior Settings Demo */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Behavior Settings Demo</h2>
          
          {/* Search Demo */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Search with Auto-complete</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-600 mt-1">
              Auto-complete: {autoCompleteSearch ? 'Enabled' : 'Disabled'} | 
              Max Results: {getSearchConfig().maxResults}
            </div>
          </div>

          {/* Delete Confirmation Demo */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Delete Confirmation</h3>
            <button
              onClick={handleDeleteClick}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Item
            </button>
            <div className="text-sm text-gray-600 mt-1">
              Confirm Delete: {confirmDelete ? 'Enabled' : 'Disabled'} | 
              Show Confirmations: {showConfirmations ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {/* Confirmation Dialog */}
          {showDeleteConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="confirmation-dialog p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to delete this item?</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Settings */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Performance Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="font-medium">Products per Page</div>
              <div className="text-2xl font-bold text-blue-600">{productsPerPage}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="font-medium">Cache Duration</div>
              <div className="text-2xl font-bold text-blue-600">{getCacheConfig().duration}s</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="font-medium">Max Search Results</div>
              <div className="text-2xl font-bold text-blue-600">{getSearchConfig().maxResults}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="font-medium">Lazy Loading</div>
              <div className="text-2xl font-bold text-blue-600">{getCacheConfig().lazyLoading ? 'On' : 'Off'}</div>
            </div>
          </div>
        </div>

        {/* Display Settings Summary */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Display Settings Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800">Product Images</div>
              <div className={`text-lg ${showProductImages ? 'text-green-600' : 'text-red-600'}`}>
                {showProductImages ? '✅' : '❌'}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800">Stock Levels</div>
              <div className={`text-lg ${showStockLevels ? 'text-green-600' : 'text-red-600'}`}>
                {showStockLevels ? '✅' : '❌'}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-800">Prices</div>
              <div className={`text-lg ${showPrices ? 'text-green-600' : 'text-red-600'}`}>
                {showPrices ? '✅' : '❌'}
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="font-medium text-yellow-800">Barcodes</div>
              <div className={`text-lg ${showBarcodes ? 'text-green-600' : 'text-red-600'}`}>
                {showBarcodes ? '✅' : '❌'}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Component */}
        <div className="mb-8">
          <GeneralSettingsDemo />
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsTestPage;
