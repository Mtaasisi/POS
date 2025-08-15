import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Plus, Edit, Trash2, MessageSquare, Copy, Eye } from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const WhatsAppTemplatesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    variables: [] as string[]
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    const variables = extractVariables(formData.content);
    
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('whatsapp_templates')
          .update({
            name: formData.name,
            content: formData.content,
            category: formData.category,
            variables,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_templates')
          .insert({
            name: formData.name,
            content: formData.content,
            category: formData.category,
            variables,
            is_active: true,
            created_by: currentUser.id
          });

        if (error) throw error;
      }

      await fetchTemplates();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      variables: template.variables
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const toggleActive = async (template: WhatsAppTemplate) => {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({ name: '', content: '', category: '', variables: [] });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Template copied to clipboard!');
  };

  const previewWithVariables = (template: WhatsAppTemplate) => {
    let preview = template.content;
    template.variables.forEach((variable) => {
      preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), `[${variable.toUpperCase()}]`);
    });
    return preview;
  };

  const categories = ['welcome', 'status_update', 'reminder', 'promotion', 'support', 'other'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="text-gray-600 mt-2">Manage your WhatsApp message templates</p>
        </div>
        <GlassButton
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Template</span>
        </GlassButton>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <GlassCard key={template.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {template.category}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => copyToClipboard(template.content)}
                  className="p-1 text-gray-400 hover:text-green-600"
                  title="Copy"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm line-clamp-3">{template.content}</p>
            </div>

            {template.variables.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {new Date(template.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => toggleActive(template)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  template.is_active
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {template.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-4">Create your first WhatsApp template to get started</p>
          <GlassButton onClick={() => setShowModal(true)}>
            Create Template
          </GlassButton>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your message template. Use {{variable_name}} for dynamic content."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {`{{variable_name}}`} for dynamic content (e.g., {`{{customer_name}}`}, {`{{order_id}}`})
                  </p>
                </div>

                {extractVariables(formData.content).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detected Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {extractVariables(formData.content).map((variable) => (
                        <span
                          key={variable}
                          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <GlassButton type="submit">
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </GlassButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Template Preview</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="whitespace-pre-wrap">{previewWithVariables(previewTemplate)}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplatesPage;