import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, Settings, Save, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&crop=center',
  brand: 'Dell'
};

// Default images for different product types
const getDefaultImage = (productName: string, brand: string): string => {
  const name = productName.toLowerCase();
  const brandLower = brand.toLowerCase();
  
  if (name.includes('iphone') || name.includes('phone')) {
    return 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&crop=center';
  } else if (name.includes('laptop') || name.includes('computer') || brandLower.includes('dell') || brandLower.includes('hp') || brandLower.includes('lenovo')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&crop=center';
  } else if (name.includes('tablet') || name.includes('ipad')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop&crop=center';
  } else if (name.includes('headphone') || name.includes('earphone') || name.includes('airpod')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center';
  } else if (name.includes('watch') || name.includes('smartwatch')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&crop=center';
  } else {
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center';
  }
};

const ProductAdGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const [productData, setProductData] = useState<ProductData>(initialProductData);
  const [previewMode, setPreviewMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleInputChange = (field: keyof ProductData, value: string) => {
    setProductData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Auto-set image when name or brand changes (only if no custom image is set)
      if ((field === 'name' || field === 'brand') && !prev.image) {
        const newName = field === 'name' ? value : prev.name;
        const newBrand = field === 'brand' ? value : prev.brand;
        updated.image = getDefaultImage(newName, newBrand);
      }
      
      return updated;
    });
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

  const handleExportPDF = async () => {
    if (!templateRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1350
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1080, 1350] // 4:5 aspect ratio for social media
      });
      
      // Add image to fit the full page (1080x1350)
      pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1350);
      
      pdf.save(`${productData.name.replace(/\s+/g, '_')}_advertisement.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    if (!templateRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1350
      });
      
      const link = document.createElement('a');
      link.download = `${productData.name.replace(/\s+/g, '_')}_advertisement.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveTemplate = () => {
    // TODO: Implement template saving
    console.log('Saving template...');
  };

  const productPresets = [
    {
      name: 'Dell Latitude 1030',
      price: 'Tsh 400,000/-',
      specifications: 'Dell Latitude 1030 | 13 inch | Core i7 8th | Ram 16GB | Storage 256GB',
      brand: 'Dell',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&crop=center'
    },
    {
      name: 'iPhone 14 Pro',
      price: 'Tsh 1,200,000/-',
      specifications: 'iPhone 14 Pro | 6.1 inch | A16 Bionic | 128GB | 48MP Camera',
      brand: 'Apple',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&crop=center'
    },
    {
      name: 'Samsung Galaxy S23',
      price: 'Tsh 800,000/-',
      specifications: 'Samsung Galaxy S23 | 6.1 inch | Snapdragon 8 Gen 2 | 128GB | 50MP Camera',
      brand: 'Samsung',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&crop=center'
    },
    {
      name: 'MacBook Air M2',
      price: 'Tsh 1,800,000/-',
      specifications: 'MacBook Air M2 | 13 inch | M2 Chip | 8GB RAM | 256GB SSD',
      brand: 'Apple',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&crop=center'
    }
  ];

  const handlePresetSelect = (preset: typeof productPresets[0]) => {
    setProductData(preset);
  };

  const handleReset = () => {
    setProductData(initialProductData);
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
            {/* Product Presets */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Templates</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {productPresets.map((preset, index) => (
                  <GlassButton
                    key={index}
                    onClick={() => handlePresetSelect(preset)}
                    className="text-left p-3 text-sm"
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-600">{preset.brand}</div>
                  </GlassButton>
                ))}
              </div>
            </GlassCard>

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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Reset
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
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </GlassButton>
                
                <GlassButton
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export PNG'}
                </GlassButton>
              </div>
            </GlassCard>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div ref={templateRef} className="relative w-[400px] h-[500px] bg-white overflow-hidden" style={{ aspectRatio: '4/5' }}>
                  <ProductAdTemplate productData={productData} />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAdGeneratorPage;
