import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  CheckSquare,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Settings,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

interface ProblemTemplate {
  id: string;
  problem_name: string;
  problem_description: string;
  category: string;
  checklist_items: ChecklistItem[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DiagnosticTemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DiagnosticTemplateManagerModal: React.FC<DiagnosticTemplateManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<ProblemTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProblemTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    problem_name: '',
    problem_description: '',
    category: 'general',
    checklist_items: [] as ChecklistItem[],
    is_active: true
  });

  const categories = [
    'general',
    'power',
    'display',
    'audio',
    'camera',
    'network',
    'hardware',
    'software'
  ];

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadCustomCategories();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnostic_problem_templates')
        .select('*')
        .order('problem_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load problem templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_problem_templates')
        .select('category')
        .not('category', 'in', `(${categories.join(',')})`);

      if (error) throw error;
      
      // Get unique custom categories
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      setCustomCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const addCustomCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    const categoryName = newCategoryName.trim().toLowerCase();
    
    // Check if category already exists
    if (categories.includes(categoryName) || customCategories.includes(categoryName)) {
      toast.error('Category already exists');
      return;
    }

    try {
      setCustomCategories(prev => [...prev, categoryName]);
      setNewCategoryName('');
      setShowCategoryForm(false);
      toast.success(`Category "${categoryName}" added successfully`);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const removeCustomCategory = async (categoryName: string) => {
    // Check if any templates are using this category
    const templatesUsingCategory = templates.filter(t => t.category === categoryName);
    
    if (templatesUsingCategory.length > 0) {
      toast.error(`Cannot delete category "${categoryName}" - it's being used by ${templatesUsingCategory.length} template(s)`);
      return;
    }

    try {
      setCustomCategories(prev => prev.filter(cat => cat !== categoryName));
      toast.success(`Category "${categoryName}" removed successfully`);
    } catch (error) {
      console.error('Error removing category:', error);
      toast.error('Failed to remove category');
    }
  };

  const resetForm = () => {
    setFormData({
      problem_name: '',
      problem_description: '',
      category: 'general',
      checklist_items: [],
      is_active: true
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const startEdit = (template: ProblemTemplate) => {
    setFormData({
      problem_name: template.problem_name,
      problem_description: template.problem_description,
      category: template.category,
      checklist_items: [...template.checklist_items],
      is_active: template.is_active
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const duplicateTemplate = (template: ProblemTemplate) => {
    setFormData({
      problem_name: `${template.problem_name} (Copy)`,
      problem_description: template.problem_description,
      category: template.category,
      checklist_items: [...template.checklist_items],
      is_active: true
    });
    setEditingTemplate(null);
    setShowForm(true);
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      required: true
    };
    setFormData(prev => ({
      ...prev,
      checklist_items: [...prev.checklist_items, newItem]
    }));
  };

  const removeChecklistItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.filter(item => item.id !== itemId)
    }));
  };

  const updateChecklistItem = (itemId: string, field: keyof ChecklistItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const saveTemplate = async () => {
    if (!formData.problem_name.trim()) {
      toast.error('Problem name is required');
      return;
    }

    if (formData.checklist_items.length === 0) {
      toast.error('At least one checklist item is required');
      return;
    }

    if (formData.checklist_items.some(item => !item.title.trim())) {
      toast.error('All checklist items must have a title');
      return;
    }

    try {
      setSaving(true);
      
      const templateData = {
        problem_name: formData.problem_name.trim(),
        problem_description: formData.problem_description.trim(),
        category: formData.category,
        checklist_items: formData.checklist_items,
        updated_at: new Date().toISOString()
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('diagnostic_problem_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Problem template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase
          .from('diagnostic_problem_templates')
          .insert([{
            ...templateData,
            created_by: currentUser?.id,
            is_active: true
          }]);

        if (error) throw error;
        toast.success('Problem template created successfully');
      }

      await loadTemplates();
      await loadCustomCategories();
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save problem template');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (template: ProblemTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.problem_name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('diagnostic_problem_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const toggleTemplateStatus = async (template: ProblemTemplate) => {
    try {
      const { error } = await supabase
        .from('diagnostic_problem_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      toast.success(`Template ${template.is_active ? 'deactivated' : 'activated'} successfully`);
      await loadTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      toast.error('Failed to update template status');
    }
  };

  // Get all available categories (default + custom)
  const allCategories = [...categories, ...customCategories];

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.problem_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.problem_description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Diagnostic Template Manager
              </h2>
              <p className="text-sm text-gray-500">
                Create and manage diagnostic problem templates
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {showForm ? (
            /* Template Form */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem Name *
                    </label>
                    <input
                      type="text"
                      value={formData.problem_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, problem_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Screen Not Working"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="space-y-2">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {allCategories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Add New Category
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem Description
                    </label>
                    <textarea
                      value={formData.problem_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, problem_description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the problem and diagnostic approach..."
                    />
                  </div>
                </div>

                {/* Right Column - Checklist Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Checklist Items *
                    </label>
                    <button
                      onClick={addChecklistItem}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {formData.checklist_items.map((item, index) => (
                      <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">
                            Item {index + 1}
                          </span>
                          <button
                            onClick={() => removeChecklistItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateChecklistItem(item.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Checklist item title..."
                            />
                          </div>

                          <div>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateChecklistItem(item.id, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Description or instructions..."
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={(e) => updateChecklistItem(item.id, 'required', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-700">
                              Required item
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.checklist_items.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No checklist items yet</p>
                        <p className="text-xs">Click "Add Item" to create your first checklist item</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Template List */
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              </div>

              {/* Category Management Section */}
              {customCategories.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Custom Categories</h4>
                    <button
                      onClick={() => setShowCategoryForm(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Add Category
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customCategories.map(category => (
                      <div key={category} className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700 capitalize">{category}</span>
                        <button
                          onClick={() => removeCustomCategory(category)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove category"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
                  ))}
                </div>
              ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {template.problem_name}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {template.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleTemplateStatus(template)}
                            className={`p-1 rounded transition-colors ${
                              template.is_active 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={template.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {template.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => duplicateTemplate(template)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEdit(template)}
                            className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(template)}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.problem_description || 'No description provided'}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.checklist_items.length} items</span>
                        <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery || categoryFilter !== 'all' ? 'No templates found' : 'No templates yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || categoryFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first diagnostic template to get started'
                    }
                  </p>
                  {(!searchQuery && categoryFilter === 'all') && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Template
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="text-sm text-gray-500">
            {templates.length} template{templates.length !== 1 ? 's' : ''} total
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowCategoryForm(false);
              setNewCategoryName('');
            }}
          />
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategoryName('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Water Damage, Performance"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomCategory();
                      }
                    }}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> Category names will be automatically converted to lowercase and used as identifiers.
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomCategory}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticTemplateManagerModal;
