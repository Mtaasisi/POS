import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import Modal from '../../shared/components/ui/Modal';
import { toast } from '../../../lib/toastUtils';
import { 
  whatsappTemplateService, 
  WhatsAppTemplate, 
  TEMPLATE_CATEGORIES, 
  TEMPLATE_VARIABLES,
  CreateTemplateData,
  UpdateTemplateData
} from '../../../services/whatsappTemplateService';

interface WhatsAppTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect?: (template: WhatsAppTemplate) => void;
}

const WhatsAppTemplateManager: React.FC<WhatsAppTemplateManagerProps> = ({
  isOpen,
  onClose,
  onTemplateSelect
}) => {
  // State management
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'general',
    template: '',
    language: 'en',
    is_active: true
  });
  const [templateErrors, setTemplateErrors] = useState<string[]>([]);

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await whatsappTemplateService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
    if (showActiveOnly && !template.is_active) return false;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    const cat = TEMPLATE_CATEGORIES.find(c => c.value === category);
    return cat?.icon || '📄';
  };

  const getCategoryLabel = (category: string) => {
    const cat = TEMPLATE_CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  // Template management functions
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      category: 'general',
      template: '',
      language: 'en',
      is_active: true
    });
    setTemplateErrors([]);
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      category: template.category,
      template: template.template,
      language: template.language,
      is_active: template.is_active
    });
    setTemplateErrors([]);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (template: WhatsAppTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await whatsappTemplateService.deleteTemplate(template.id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleToggleStatus = async (template: WhatsAppTemplate) => {
    try {
      await whatsappTemplateService.toggleTemplateStatus(template.id);
      toast.success(`Template ${template.is_active ? 'deactivated' : 'activated'} successfully`);
      loadTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      toast.error('Failed to update template status');
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = whatsappTemplateService.validateTemplate(templateForm.template);
    if (!validation.isValid) {
      setTemplateErrors(validation.errors);
      return;
    }

    const variables = whatsappTemplateService.extractVariables(templateForm.template);

    try {
      if (editingTemplate) {
        await whatsappTemplateService.updateTemplate(editingTemplate.id, {
          name: templateForm.name,
          category: templateForm.category,
          template: templateForm.template,
          variables,
          language: templateForm.language,
          is_active: templateForm.is_active
        });
        toast.success('Template updated successfully');
      } else {
        await whatsappTemplateService.createTemplate({
          name: templateForm.name,
          category: templateForm.category,
          template: templateForm.template,
          variables,
          language: templateForm.language,
          is_active: templateForm.is_active
        });
        toast.success('Template created successfully');
      }

      setShowTemplateModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleTemplateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setTemplateForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    if (templateErrors.length > 0) {
      setTemplateErrors([]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WhatsApp Message Templates" size="xl">
      <div className="space-y-6">
        {/* Filters Section */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {TEMPLATE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                showActiveOnly 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showActiveOnly ? <CheckCircle size={16} /> : <Eye size={16} />}
              Active Only
            </button>
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={16} />
              New Template
            </button>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400" size={48} />
              <p className="text-gray-600 mt-2">No templates found</p>
              <button
                onClick={handleCreateTemplate}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Create your first template
              </button>
            </div>
                      ) : (
              filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 transition-all ${
                    template.is_active 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(template.category)}</span>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {getCategoryLabel(template.category)}
                        </span>
                        {template.is_active ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-800 flex items-center gap-1">
                            <XCircle size={12} />
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.template.substring(0, 150)}
                        {template.template.length > 150 && '...'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Variables: {template.variables.length}</span>
                        <span>Language: {template.language}</span>
                        <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {onTemplateSelect && (
                        <button
                          onClick={() => onTemplateSelect(template)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title="Use this template"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit template"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(template)}
                        className={`p-2 rounded-lg ${
                          template.is_active
                            ? 'text-orange-600 hover:bg-orange-100'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={template.is_active ? 'Deactivate template' : 'Activate template'}
                      >
                        {template.is_active ? <EyeOff size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Delete template"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
        </div>

        {/* Template Form Modal */}
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title={editingTemplate ? 'Edit Template' : 'Create New Template'}
          size="lg"
        >
          <form onSubmit={handleSaveTemplate} className="space-y-6">
            {templateErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-red-600" size={16} />
                  <h4 className="font-semibold text-red-800">Template Errors</h4>
                </div>
                <ul className="text-red-800 text-sm space-y-1">
                  {templateErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                name="name"
                value={templateForm.name}
                onChange={handleTemplateFormChange}
                placeholder="Enter template name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={templateForm.category}
                onChange={handleTemplateFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              >
                {TEMPLATE_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content *
              </label>
              <textarea
                name="template"
                value={templateForm.template}
                onChange={handleTemplateFormChange}
                placeholder="Enter your message template... Use {{variable}} for dynamic content"
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variables like {'{{customerName}}'}, {'{{orderId}}'}, {'{{date}}'} for dynamic content
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                name="language"
                value={templateForm.language}
                onChange={handleTemplateFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="sw">Swahili</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={templateForm.is_active}
                onChange={handleTemplateFormChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Template is active
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Available Variables</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {TEMPLATE_VARIABLES.slice(0, 10).map(variable => (
                  <div key={variable.name} className="bg-white p-2 rounded border">
                    <code className="text-green-600">{'{{' + variable.name + '}}'}</code>
                    <p className="text-gray-600">{variable.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Modal>
  );
};

export default WhatsAppTemplateManager;
