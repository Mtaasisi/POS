import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, Settings, Save, Package, FileText, Users, Zap, FileSpreadsheet } from 'lucide-react';
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
  description?: string;
  features?: string[];
}

interface TemplateSettings {
  layout: 'portrait' | 'landscape' | 'square';
  theme: 'light' | 'dark' | 'minimal' | 'bold';
  priceSize: number;
  specSize: number;
  textColor: string;
  backgroundColor: string;
  pricePosition: { x: number; y: number };
  specPosition: { x: number; y: number };
  imageSettings: {
    brightness: number;
    contrast: number;
    saturation: number;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
  };
}

interface SavedTemplate {
  id: string;
  name: string;
  productData: ProductData;
  templateSettings: TemplateSettings;
  createdAt: string;
  thumbnail: string;
}

interface BatchProduct {
  name: string;
  price: string;
  specifications: string;
  brand: string;
  image?: string;
  description?: string;
}

interface ExportSettings {
  format: 'PNG' | 'PDF' | 'JPG' | 'SVG';
  quality: number;
  size: {
    width: number;
    height: number;
    name: string;
  };
  filename: string;
  includeMetadata: boolean;
}

const initialProductData: ProductData = {
  name: 'Dell Latitude 1030',
  price: 'Tsh 400,000/-',
  specifications: 'Dell Latitude 1030 | 13 inch | Core i7 8th | Ram 16GB | Storage 256GB',
  image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&crop=center',
  brand: 'Dell',
  description: 'Professional laptop for business and productivity',
  features: ['High Performance', 'Long Battery Life', 'Premium Build']
};

const initialTemplateSettings: TemplateSettings = {
  layout: 'portrait',
  theme: 'light',
  priceSize: 36,
  specSize: 18,
  textColor: '#000000',
  backgroundColor: '#ffffff',
  pricePosition: { x: 50, y: 20 },
  specPosition: { x: 50, y: 35 },
  imageSettings: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    position: { x: 0, y: 0 },
    scale: 100,
    rotation: 0
  }
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
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>(initialTemplateSettings);
  const [previewMode, setPreviewMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'export' | 'templates'>('content');
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

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

  const removeBackground = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageData);
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Remove white/light backgrounds
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          
          // Check if pixel is white or very light
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Make transparent
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageData;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        try {
          // Remove background
          const processedImage = await removeBackground(result);
          setProductData(prev => ({
            ...prev,
            image: processedImage
          }));
        } catch (error) {
          console.error('Background removal failed:', error);
          // Fallback to original image
          setProductData(prev => ({
            ...prev,
            image: result
          }));
        }
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
    setShowSaveModal(true);
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    
    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name: templateName,
      productData: { ...productData },
      templateSettings: { ...templateSettings },
      createdAt: new Date().toISOString(),
      thumbnail: productData.image || ''
    };
    
    setSavedTemplates(prev => [...prev, newTemplate]);
    setShowSaveModal(false);
    setTemplateName('');
    
    // Save to localStorage
    localStorage.setItem('savedTemplates', JSON.stringify([...savedTemplates, newTemplate]));
  };

  const loadTemplate = (template: SavedTemplate) => {
    setProductData(template.productData);
    setTemplateSettings(template.templateSettings);
  };

  const deleteTemplate = (templateId: string) => {
    const updated = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updated);
    localStorage.setItem('savedTemplates', JSON.stringify(updated));
  };

  // Load saved templates on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('savedTemplates');
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, []);

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

  const handlePresetSelect = async (preset: typeof productPresets[0]) => {
    try {
      // Process preset image to remove background
      const processedImage = await removeBackground(preset.image);
      setProductData({
        ...preset,
        image: processedImage
      });
    } catch (error) {
      console.error('Background removal failed for preset:', error);
      setProductData(preset);
    }
  };

  const handleReset = () => {
    setProductData(initialProductData);
    setTemplateSettings(initialTemplateSettings);
  };

  const handleTemplateSettingChange = (field: keyof TemplateSettings, value: any) => {
    setTemplateSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getLayoutDimensions = () => {
    switch (templateSettings.layout) {
      case 'landscape':
        return { width: 500, height: 400 };
      case 'square':
        return { width: 400, height: 400 };
      default:
        return { width: 400, height: 500 };
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <SimpleBackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Ad Generator</h1>
            <p className="text-gray-600">Create professional product advertisements</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'content' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'design' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Design
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'templates' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            {activeTab === 'content' && (
              <>
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
                  <p className="text-xs text-gray-500 mb-2">
                    Background will be automatically removed from uploaded images
                  </p>
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
              </>
            )}

            {activeTab === 'design' && (
              <>
                {/* Layout Options */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Layout & Theme</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Layout Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['portrait', 'landscape', 'square'] as const).map((layout) => (
                          <button
                            key={layout}
                            onClick={() => handleTemplateSettingChange('layout', layout)}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              templateSettings.layout === layout
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`mx-auto mb-1 ${
                              layout === 'portrait' ? 'w-3 h-4' : 
                              layout === 'landscape' ? 'w-4 h-3' : 'w-3 h-3'
                            } bg-gray-400 rounded`}></div>
                            <span className="text-xs capitalize">{layout}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['light', 'dark', 'minimal', 'bold'] as const).map((theme) => (
                          <button
                            key={theme}
                            onClick={() => handleTemplateSettingChange('theme', theme)}
                            className={`p-2 rounded-lg border-2 transition-colors capitalize ${
                              templateSettings.theme === theme
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Text Controls */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Text Settings</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Price Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Size: {templateSettings.priceSize}px
                      </label>
                      <input
                        type="range"
                        min="24"
                        max="72"
                        value={templateSettings.priceSize}
                        onChange={(e) => handleTemplateSettingChange('priceSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Spec Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specifications Size: {templateSettings.specSize}px
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="32"
                        value={templateSettings.specSize}
                        onChange={(e) => handleTemplateSettingChange('specSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={templateSettings.textColor}
                          onChange={(e) => handleTemplateSettingChange('textColor', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={templateSettings.textColor}
                          onChange={(e) => handleTemplateSettingChange('textColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={templateSettings.backgroundColor}
                          onChange={(e) => handleTemplateSettingChange('backgroundColor', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={templateSettings.backgroundColor}
                          onChange={(e) => handleTemplateSettingChange('backgroundColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Image Controls */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Image Settings</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Brightness */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brightness: {templateSettings.imageSettings.brightness}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={templateSettings.imageSettings.brightness}
                        onChange={(e) => handleTemplateSettingChange('imageSettings', {
                          ...templateSettings.imageSettings,
                          brightness: parseInt(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contrast: {templateSettings.imageSettings.contrast}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={templateSettings.imageSettings.contrast}
                        onChange={(e) => handleTemplateSettingChange('imageSettings', {
                          ...templateSettings.imageSettings,
                          contrast: parseInt(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Saturation: {templateSettings.imageSettings.saturation}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={templateSettings.imageSettings.saturation}
                        onChange={(e) => handleTemplateSettingChange('imageSettings', {
                          ...templateSettings.imageSettings,
                          saturation: parseInt(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Scale */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Scale: {templateSettings.imageSettings.scale}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={templateSettings.imageSettings.scale}
                        onChange={(e) => handleTemplateSettingChange('imageSettings', {
                          ...templateSettings.imageSettings,
                          scale: parseInt(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Rotation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rotation: {templateSettings.imageSettings.rotation}°
                      </label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={templateSettings.imageSettings.rotation}
                        onChange={(e) => handleTemplateSettingChange('imageSettings', {
                          ...templateSettings.imageSettings,
                          rotation: parseInt(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </GlassCard>
              </>
            )}

            {activeTab === 'templates' && (
              <>
                {/* Saved Templates */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Save className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Saved Templates</h3>
                  </div>
                  
                  {savedTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Save className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No saved templates yet</p>
                      <p className="text-sm">Create and save your first template!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedTemplates.map((template) => (
                        <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(template.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          
                          {template.thumbnail && (
                            <div className="w-full h-20 bg-gray-100 rounded mb-3 overflow-hidden">
                              <img
                                src={template.thumbnail}
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadTemplate(template)}
                              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => {
                                setProductData(template.productData);
                                setTemplateSettings(template.templateSettings);
                                setActiveTab('design');
                              }}
                              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </>
            )}

            {activeTab === 'export' && (
              <>
                {/* Export Options */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Export Settings</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Format Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['PNG', 'PDF', 'JPG', 'SVG'].map((format) => (
                          <button
                            key={format}
                            className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Size Presets</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Instagram', size: '1080x1080' },
                          { name: 'Facebook', size: '1200x630' },
                          { name: 'Twitter', size: '1200x675' },
                          { name: 'LinkedIn', size: '1200x627' }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors text-left"
                          >
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-gray-500">{preset.size}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div 
                ref={templateRef} 
                className="relative overflow-hidden" 
                style={{ 
                  width: getLayoutDimensions().width,
                  height: getLayoutDimensions().height,
                  backgroundColor: templateSettings.backgroundColor
                }}
              >
                <ProductAdTemplate 
                  productData={productData} 
                  templateSettings={templateSettings}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter template name"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAdGeneratorPage;
