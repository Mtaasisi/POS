import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckSquare,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

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

const ProblemTemplateManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<ProblemTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProblemTemplate | null>(null);
  const [formData, setFormData] = useState({
    problem_name: '',
    problem_description: '',
    category: 'general',
    checklist_items: [] as ChecklistItem[]
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
    loadTemplates();
  }, []);

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

  const resetForm = () => {
    setFormData({
      problem_name: '',
      problem_description: '',
      category: 'general',
      checklist_items: []
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const startEdit = (template: ProblemTemplate) => {
    setFormData({
      problem_name: template.problem_name,
      problem_description: template.problem_description,
      category: template.category,
      checklist_items: [...template.checklist_items]
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const duplicateTemplate = (template: ProblemTemplate) => {
    setFormData({
      problem_name: `${template.problem_name} (Copy)`,
      problem_description: template.problem_description,
      category: template.category,
      checklist_items: [...template.checklist_items]
    });
    setEditingTemplate(null);
    setShowForm(true);
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}`,
      title: '',
      description: '',
      required: true
    };
    setFormData(prev => ({
      ...prev,
      checklist_items: [...prev.checklist_items, newItem]
    }));
  };

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.filter((_, i) => i !== index)
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
            created_by: currentUser?.id
          }]);

        if (error) throw error;
        toast.success('Problem template created successfully');
      }

      await loadTemplates();
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
      toast.success('Problem template deleted successfully');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete problem template');
    }
  };

  const toggleTemplateStatus = async (template: ProblemTemplate) => {
    try {
      const { error } = await supabase
        .from('diagnostic_problem_templates')
        .update({ 
          is_active: !template.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;
      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'} successfully`);
      await loadTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast.error('Failed to update template status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Problem Templates</h2>
          <p className="text-gray-600">Manage diagnostic checklist templates for different device problems</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{template.problem_name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.problem_description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {template.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CheckSquare size={14} />
                  <span>{template.checklist_items.length} items</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(template)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => duplicateTemplate(template)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                onClick={() => toggleTemplateStatus(template)}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
                  template.is_active
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {template.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                {template.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => deleteTemplate(template)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">Create your first problem template to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Template
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem Name *
                    </label>
                    <input
                      type="text"
                      value={formData.problem_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, problem_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Phone No Power"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Problem Description
                  </label>
                  <textarea
                    value={formData.problem_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, problem_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the problem and what technicians should look for..."
                  />
                </div>

                {/* Checklist Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Checklist Items *
                    </label>
                    <button
                      onClick={addChecklistItem}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.checklist_items.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Title *
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateChecklistItem(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Check Power Button"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={item.description}
                                onChange={(e) => updateChecklistItem(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                                placeholder="Describe what the technician should check..."
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`required-${index}`}
                                checked={item.required}
                                onChange={(e) => updateChecklistItem(index, 'required', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <label htmlFor={`required-${index}`} className="text-sm text-gray-700">
                                Required item
                              </label>
                            </div>
                          </div>
                          <button
                            onClick={() => removeChecklistItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.checklist_items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No checklist items added yet</p>
                      <button
                        onClick={addChecklistItem}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Add your first item
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemTemplateManager;
