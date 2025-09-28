import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, Settings, Save } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { SimpleBackButton } from '../components/ui/SimpleBackButton';
import ProductAdTemplate from '../components/ProductAdTemplate';

interface ProductData {
  name: string;
  price: string;
  specifications: string;
  image: string | null;
  brand: string;
}

const initialProductData: ProductData = {
  name: 'Dell Latitude 1030',
  price: 'Tsh 400,000/-',
  specifications: 'Dell Latitude 1030 | 13 inch | Core i7 8th | Ram 16GB | Storage 256GB',
  image: null,
  brand: 'Dell'
};

const ProductAdGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productData, setProductData] = useState<ProductData>(initialProductData);
  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = (field: keyof ProductData, value: string) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProductData(prev => ({
          ...prev,
          image: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting to PDF...');
  };

  const handleExportPNG = () => {
    // TODO: Implement PNG export
    console.log('Exporting to PNG...');
  };

  const handleSaveTemplate = () => {
    // TODO: Implement template saving
    console.log('Saving template...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <SimpleBackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Ad Generator</h1>
            <p className="text-gray-600">Create professional product advertisements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
              </div>

              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={productData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter brand name"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (TSH)
                  </label>
                  <input
                    type="text"
                    value={productData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tsh 400,000/-"
                  />
                </div>

                {/* Specifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specifications
                  </label>
                  <textarea
                    value={productData.specifications}
                    onChange={(e) => handleInputChange('specifications', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product specifications separated by |"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {productData.image ? (
                      <div className="space-y-3">
                        <img
                          src={productData.image}
                          alt="Product preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                        />
                        <p className="text-sm text-gray-600">Image uploaded successfully</p>
                        <GlassButton
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Change Image
                        </GlassButton>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-gray-600">Click to upload product image</p>
                          <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                        </div>
                        <GlassButton
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </GlassButton>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Save className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <GlassButton
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {previewMode ? 'Edit Mode' : 'Preview'}
                </GlassButton>
                
                <GlassButton
                  onClick={handleSaveTemplate}
                  className="flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </GlassButton>
                
                <GlassButton
                  onClick={handleExportPDF}
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </GlassButton>
                
                <GlassButton
                  onClick={handleExportPNG}
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PNG
                </GlassButton>
              </div>
            </GlassCard>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
              </div>
              
              <div className="flex justify-center">
                <ProductAdTemplate productData={productData} />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAdGeneratorPage;
