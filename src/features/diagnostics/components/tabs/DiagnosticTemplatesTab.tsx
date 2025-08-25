import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getDiagnosticTemplates } from '../../../../lib/diagnosticsApi';
import { DiagnosticTemplate } from '../../types/diagnostics';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DiagnosticTemplatesTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DiagnosticTemplate[]>([]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadTemplates();
    }
  }, [currentUser]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getDiagnosticTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load diagnostic templates');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only administrators can manage diagnostic templates.</p>
        </div>
      </GlassCard>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <GlassCard key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diagnostic Templates</h2>
          <p className="text-gray-600">Manage reusable diagnostic templates</p>
        </div>
        <GlassButton
          onClick={() => toast.info('Create template functionality coming soon...')}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </GlassButton>
      </div>

      {templates.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
          <p className="text-gray-500">Create your first diagnostic template to get started.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <GlassCard key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  {template.description && (
                    <p className="text-gray-600 text-sm">{template.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toast.info('Edit template functionality coming soon...')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast.info('Delete template functionality coming soon...')}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Settings className="w-4 h-4 mr-1" />
                <span>Template ID: {template.id}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagnosticTemplatesTab;
