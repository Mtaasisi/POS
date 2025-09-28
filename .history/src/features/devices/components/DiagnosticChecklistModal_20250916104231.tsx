import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from '../../../lib/toastUtils';
import Modal from '../../shared/components/ui/Modal';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  result?: 'passed' | 'failed' | 'skipped';
  notes?: string;
  completed?: boolean;
}

interface DiagnosticChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  deviceModel?: string;
  issueDescription?: string;
  onChecklistComplete?: (results: any) => void;
}

const DiagnosticChecklistModal: React.FC<DiagnosticChecklistModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  deviceModel,
  issueDescription,
  onChecklistComplete
}) => {
  const [problemTemplates, setProblemTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(true);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'in_progress' | 'completed' | 'failed'>('pending');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Load problem templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProblemTemplates();
    }
  }, [isOpen]);

  const loadProblemTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnostic_problem_templates')
        .select('*')
        .eq('is_active', true)
        .order('problem_name');

      if (error) throw error;
      setProblemTemplates(data || []);
    } catch (error) {
      console.error('Error loading problem templates:', error);
      toast.error('Failed to load diagnostic templates');
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: any) => {
    setSelectedTemplate(template);
    const items = template.checklist_items.map((item: any) => ({
      ...item,
      result: undefined,
      notes: '',
      completed: false
    }));
    setChecklistItems(items);
    setCurrentItemIndex(0);
    setShowTemplateSelection(false);
    setOverallStatus('in_progress');
  };

  const updateChecklistItem = (itemId: string, result: 'passed' | 'failed' | 'skipped', notes?: string) => {
    setChecklistItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, result, notes: notes || '', completed: true }
        : item
    ));
    
    // Auto-advance to next item after a short delay
    setTimeout(() => {
      setCurrentItemIndex(prev => {
        const nextIndex = prev + 1;
        return nextIndex < checklistItems.length ? nextIndex : prev;
      });
    }, 500);
  };

  const getCompletionStatus = () => {
    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter(item => item.completed).length;
    const requiredItems = checklistItems.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed).length;
    
    return {
      total: totalItems,
      completed: completedItems,
      required: requiredItems.length,
      completedRequired,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    };
  };

  const canComplete = () => {
    const status = getCompletionStatus();
    return status.completedRequired === status.required && status.completedRequired > 0;
  };

  const saveChecklistResults = async () => {
    if (!canComplete()) {
      toast.error('Please complete all required checklist items before saving');
      return;
    }

    try {
      setSaving(true);
      
      const results = {
        device_id: deviceId,
        problem_template_id: selectedTemplate?.id,
        checklist_items: checklistItems,
        overall_status: overallStatus,
        technician_notes: technicianNotes,
        completed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('diagnostic_checklist_results')
        .insert([results]);

      if (error) throw error;

      // Update device diagnostic checklist
      const { error: deviceError } = await supabase
        .from('devices')
        .update({ 
          diagnostic_checklist: results,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (deviceError) throw deviceError;

      toast.success('Diagnostic checklist completed successfully!');
      onChecklistComplete?.(results);
      onClose();
    } catch (error) {
      console.error('Error saving checklist results:', error);
      toast.error('Failed to save diagnostic results');
    } finally {
      setSaving(false);
    }
  };

  const resetChecklist = () => {
    setChecklistItems(prev => prev.map(item => ({
      ...item,
      result: undefined,
      notes: '',
      completed: false
    })));
    setTechnicianNotes('');
    setOverallStatus('in_progress');
  };

  const completionStatus = getCompletionStatus();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Diagnostic Checklist"
      size="lg"
    >
      <div className="space-y-6">
        {/* Template Selection */}
        {showTemplateSelection && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Problem Type
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading templates...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {problemTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{template.problem_name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.problem_description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckSquare size={14} />
                      <span>{template.checklist_items.length} checklist items</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Checklist Items */}
        {!showTemplateSelection && selectedTemplate && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedTemplate.problem_name}
                </h3>
                <p className="text-sm text-gray-600">{selectedTemplate.problem_description}</p>
              </div>
              <button
                onClick={() => setShowTemplateSelection(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Change Template
              </button>
            </div>

            {/* Progress */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {completionStatus.completed}/{completionStatus.total} items
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionStatus.percentage}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Required: {completionStatus.completedRequired}/{completionStatus.required}</span>
                <span>{completionStatus.percentage}% complete</span>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {checklistItems.map((item, index) => (
                <div key={item.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header with Status Indicator */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full border-3 flex items-center justify-center ${
                        item.completed 
                          ? item.result === 'passed' 
                            ? 'bg-green-100 border-green-500 text-green-600'
                            : item.result === 'failed'
                            ? 'bg-red-100 border-red-500 text-red-600'
                            : 'bg-yellow-100 border-yellow-500 text-yellow-600'
                          : 'border-gray-300 bg-gray-50'
                      }`}>
                        {item.completed ? (
                          item.result === 'passed' ? (
                            <CheckCircle size={24} />
                          ) : item.result === 'failed' ? (
                            <X size={24} />
                          ) : (
                            <Clock size={24} />
                          )
                        ) : (
                          <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                        {item.required && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Large Touch-Friendly Action Buttons */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => updateChecklistItem(item.id, 'passed')}
                      className={`flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                        item.result === 'passed'
                          ? 'bg-green-600 text-white shadow-lg scale-105'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <CheckCircle size={20} />
                      Pass
                    </button>
                    <button
                      onClick={() => updateChecklistItem(item.id, 'failed')}
                      className={`flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                        item.result === 'failed'
                          ? 'bg-red-600 text-white shadow-lg scale-105'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <X size={20} />
                      Fail
                    </button>
                    <button
                      onClick={() => updateChecklistItem(item.id, 'skipped')}
                      className={`flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                        item.result === 'skipped'
                          ? 'bg-yellow-600 text-white shadow-lg scale-105'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <Clock size={20} />
                      Skip
                    </button>
                  </div>

                  {/* Notes - Only show for failed or skipped items */}
                  {item.completed && item.result !== 'passed' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {item.result === 'failed' ? 'What went wrong?' : 'Why was this skipped?'}
                      </label>
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) => {
                          const newItems = [...checklistItems];
                          const itemIndex = newItems.findIndex(i => i.id === item.id);
                          if (itemIndex !== -1) {
                            newItems[itemIndex].notes = e.target.value;
                            setChecklistItems(newItems);
                          }
                        }}
                        placeholder={item.result === 'failed' ? "Explain what went wrong..." : "Add notes about why this was skipped..."}
                        className="w-full p-3 border border-gray-300 rounded-lg text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Technician Notes */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {showNotes ? <EyeOff size={16} /> : <Eye size={16} />}
                  Technician Notes
                </button>
              </div>
              {showNotes && (
                <textarea
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Add overall notes about the diagnostic process..."
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                {/* Reset Button */}
                <button
                  onClick={resetChecklist}
                  className="flex items-center justify-center gap-3 py-3 px-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  <RefreshCw size={20} />
                  Reset All Items
                </button>
                
                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-4 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-lg"
                  >
                    <X size={20} />
                    Cancel
                  </button>
                  <button
                    onClick={saveChecklistResults}
                    disabled={!canComplete() || saving}
                    className={`flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                      canComplete() && !saving
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Complete Diagnostic
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DiagnosticChecklistModal;
