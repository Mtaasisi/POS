import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getDiagnosticTemplates, updateDiagnosticTemplate, createDiagnosticTemplate, deleteDiagnosticTemplate } from '../../../lib/diagnosticsApi';
import { DiagnosticTemplate, ChecklistItem } from '../types/diagnostics';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Monitor,
  Printer,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DiagnosticTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<DiagnosticTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<DiagnosticTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    device_type: '',
    checklist_items: [] as ChecklistItem[]
  });

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getDiagnosticTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load diagnostic templates');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'laptop':
        return <Laptop className="h-5 w-5" />;
      case 'printer':
        return <Printer className="h-5 w-5" />;
      case 'monitor':
        return <Monitor className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      case 'phone':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const handleEditTemplate = (template: DiagnosticTemplate) => {
    setEditingTemplate(template);
  };

  const handleSaveTemplate = async (template: DiagnosticTemplate) => {
    try {
      await updateDiagnosticTemplate(template.id, {
        device_type: template.device_type,
        checklist_items: template.checklist_items
      });
      toast.success('Template updated successfully');
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteDiagnosticTemplate(templateId);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.device_type.trim()) {
      toast.error('Please enter a device type');
      return;
    }
    if (newTemplate.checklist_items.length === 0) {
      toast.error('Please add at least one checklist item');
      return;
    }

    try {
      await createDiagnosticTemplate(newTemplate);
      toast.success('Template created successfully');
      setShowCreateForm(false);
      setNewTemplate({ device_type: '', checklist_items: [] });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const addChecklistItem = (template: DiagnosticTemplate) => {
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}`,
      name: '',
      description: ''
    };
    
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        checklist_items: [...editingTemplate.checklist_items, newItem]
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        checklist_items: [...newTemplate.checklist_items, newItem]
      });
    }
  };

  const removeChecklistItem = (template: DiagnosticTemplate, itemId: string) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        checklist_items: editingTemplate.checklist_items.filter(item => item.id !== itemId)
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        checklist_items: newTemplate.checklist_items.filter(item => item.id !== itemId)
      });
    }
  };

  const updateChecklistItem = (template: DiagnosticTemplate, itemId: string, field: keyof ChecklistItem, value: string) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        checklist_items: editingTemplate.checklist_items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        checklist_items: newTemplate.checklist_items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      });
    }
  };

  // Check if user has admin permissions
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">This page is only available for administrators.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <GlassButton
              onClick={() => navigate('/diagnostics/reports')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back
            </GlassButton>
            <h1 className="text-2xl font-bold text-gray-900">Diagnostic Templates</h1>
          </div>
          <GlassButton
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus size={20} />
            New Template
          </GlassButton>
        </div>
        <p className="text-gray-600">
          Customize diagnostic checklists for different device types. These templates will be used when creating new diagnostic requests.
        </p>
      </div>

      {/* Create New Template Form */}
      {showCreateForm && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create New Template</h2>
            <GlassButton
              onClick={() => setShowCreateForm(false)}
              className="flex items-center gap-2"
            >
              <X size={20} />
              Cancel
            </GlassButton>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Type
              </label>
              <input
                type="text"
                value={newTemplate.device_type}
                onChange={(e) => setNewTemplate({ ...newTemplate, device_type: e.target.value })}
                placeholder="e.g., laptop, printer, monitor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Checklist Items
                </label>
                <GlassButton
                  onClick={() => addChecklistItem(newTemplate)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Item
                </GlassButton>
              </div>

              <div className="space-y-3">
                {newTemplate.checklist_items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                      <GlassButton
                        onClick={() => removeChecklistItem(newTemplate, item.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                        Remove
                      </GlassButton>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateChecklistItem(newTemplate, item.id, 'name', e.target.value)}
                          placeholder="e.g., Power Supply"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID
                        </label>
                        <input
                          type="text"
                          value={item.id}
                          onChange={(e) => updateChecklistItem(newTemplate, item.id, 'id', e.target.value)}
                          placeholder="e.g., power_supply"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateChecklistItem(newTemplate, item.id, 'description', e.target.value)}
                        placeholder="Describe what to check for this item..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <GlassButton
                onClick={handleCreateTemplate}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
              >
                <Save size={16} />
                Create Template
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <GlassCard key={template.id} className="p-6">
              {editingTemplate?.id === template.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(template.device_type)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.device_type.charAt(0).toUpperCase() + template.device_type.slice(1)}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => handleSaveTemplate(editingTemplate)}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Save size={16} />
                        Save
                      </GlassButton>
                      <GlassButton
                        onClick={() => setEditingTemplate(null)}
                        className="flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </GlassButton>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Checklist Items
                      </label>
                      <GlassButton
                        onClick={() => addChecklistItem(editingTemplate)}
                        className="flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add Item
                      </GlassButton>
                    </div>

                    <div className="space-y-3">
                      {editingTemplate.checklist_items.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                            <GlassButton
                              onClick={() => removeChecklistItem(editingTemplate, item.id)}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                              Remove
                            </GlassButton>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateChecklistItem(editingTemplate, item.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ID
                              </label>
                              <input
                                type="text"
                                value={item.id}
                                onChange={(e) => updateChecklistItem(editingTemplate, item.id, 'id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateChecklistItem(editingTemplate, item.id, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(template.device_type)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.device_type.charAt(0).toUpperCase() + template.device_type.slice(1)}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => handleEditTemplate(template)}
                        className="flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                        Delete
                      </GlassButton>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {template.checklist_items.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagnosticTemplatesPage; 