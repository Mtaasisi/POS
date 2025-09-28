import React, { useState, useEffect } from 'react';
import { Device } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Wrench,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  Headphones,
  Camera,
  Battery,
  Wifi,
  HardDrive,
  Cpu,
  Speaker,
  Square,
  CheckSquare,
  X,
  Eye,
  FileText,
  Settings
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';

interface DiagnosticTemplate {
  id: string;
  problem_name: string;
  problem_description: string;
  category: string;
  checklist_items: Array<{
    id: string;
    title: string;
    description: string;
    required: boolean;
    order_index: number;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DiagnosticTemplateManagerProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected: (template: DiagnosticTemplate) => void;
}

const DiagnosticTemplateManager: React.FC<DiagnosticTemplateManagerProps> = ({
  device,
  isOpen,
  onClose,
  onTemplateSelected
}) => {
  const [templates, setTemplates] = useState<DiagnosticTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DiagnosticTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<DiagnosticTemplate | null>(null);
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(template =>
        template.problem_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.problem_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnostic_problem_templates')
        .select('*')
        .eq('is_active', true)
        .order('problem_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading diagnostic templates:', error);
      toast.error('Failed to load diagnostic templates');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Power Issues': <Battery className="w-5 h-5" />,
      'Display Issues': <Monitor className="w-5 h-5" />,
      'Audio Issues': <Speaker className="w-5 h-5" />,
      'Camera Issues': <Camera className="w-5 h-5" />,
      'Connectivity Issues': <Wifi className="w-5 h-5" />,
      'Performance Issues': <Cpu className="w-5 h-5" />,
      'Storage Issues': <HardDrive className="w-5 h-5" />,
      'Hardware Issues': <Wrench className="w-5 h-5" />,
      'Software Issues': <Settings className="w-5 h-5" />,
      'General': <CheckSquare className="w-5 h-5" />
    };
    return iconMap[category] || <CheckSquare className="w-5 h-5" />;
  };

  const getDeviceTypeIcon = (deviceType: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'phone': <Smartphone className="w-5 h-5" />,
      'mobile': <Smartphone className="w-5 h-5" />,
      'laptop': <Laptop className="w-5 h-5" />,
      'desktop': <Monitor className="w-5 h-5" />,
      'tablet': <Tablet className="w-5 h-5" />,
      'headphones': <Headphones className="w-5 h-5" />
    };
    return iconMap[deviceType] || <Smartphone className="w-5 h-5" />;
  };

  const handleTemplateSelect = (template: DiagnosticTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDetails(true);
  };

  const handleStartDiagnostic = () => {
    if (selectedTemplate) {
      onTemplateSelected(selectedTemplate);
      onClose();
    }
  };

  const getCategories = () => {
    const categories = Array.from(new Set(templates.map(t => t.category)));
    return categories.sort();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                {getDeviceTypeIcon(device.device_type || 'phone')}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Diagnostic Template Manager</h2>
                <p className="text-blue-100">
                  Choose a diagnostic template to guide your repair process for {device.brand} {device.model}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Template List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {getCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <FileText className="w-8 h-8 mb-2" />
                  <p>No templates found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getCategoryIcon(template.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {template.problem_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {template.problem_description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {getCategoryIcon(template.category)}
                              {template.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {template.checklist_items.length} steps
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Template Details */}
          <div className="w-1/2 flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Template Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      {getCategoryIcon(selectedTemplate.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedTemplate.problem_name}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {selectedTemplate.problem_description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {getCategoryIcon(selectedTemplate.category)}
                          {selectedTemplate.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {selectedTemplate.checklist_items.length} diagnostic steps
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist Items */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Diagnostic Steps</h4>
                  <div className="space-y-3">
                    {selectedTemplate.checklist_items
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((item, index) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            {item.required && (
                              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <GlassButton
                      onClick={handleStartDiagnostic}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Diagnostic with This Template
                    </GlassButton>
                    <GlassButton
                      onClick={() => setSelectedTemplate(null)}
                      variant="secondary"
                    >
                      Back to Templates
                    </GlassButton>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Select a Template</h3>
                  <p>Choose a diagnostic template from the list to view details and start the diagnostic process.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTemplateManager;
