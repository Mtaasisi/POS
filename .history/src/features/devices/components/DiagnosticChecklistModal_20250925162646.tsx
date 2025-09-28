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

      if (error) {
        console.error('Database error loading templates:', error);
        throw new Error(`Failed to load templates: ${error.message}`);
      }

      const templates = data || [];
      if (templates.length === 0) {
        toast('No diagnostic templates available. Please contact administrator.');
      }
      
      setProblemTemplates(templates);
    } catch (error) {
      console.error('Error loading problem templates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load diagnostic templates';
      toast.error(errorMessage);
      
      // Set empty array to prevent UI crashes
      setProblemTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: any) => {
    if (!template || !template.id) {
      toast.error('Invalid template selected');
      return;
    }

    if (!template.checklist_items || !Array.isArray(template.checklist_items)) {
      toast.error('Template has no checklist items');
      return;
    }

    if (template.checklist_items.length === 0) {
      toast.error('Template checklist is empty');
      return;
    }

    try {
      setSelectedTemplate(template);
      const items = template.checklist_items.map((item: any, index: number) => ({
        id: item.id || `item_${index}`,
        title: item.title || 'Untitled Item',
        description: item.description || 'No description',
        required: Boolean(item.required),
        result: undefined,
        notes: '',
        completed: false
      }));
      
      setChecklistItems(items);
      setCurrentItemIndex(0);
      setShowTemplateSelection(false);
      setOverallStatus('in_progress');
      
      toast.success(`Selected ${template.problem_name} template with ${items.length} items`);
    } catch (error) {
      console.error('Error selecting template:', error);
      toast.error('Failed to load template');
    }
  };

  const updateChecklistItem = (itemId: string, result: 'passed' | 'failed' | 'skipped', notes?: string) => {
    if (!itemId || !result) {
      toast.error('Invalid checklist item update');
      return;
    }

    if (!['passed', 'failed', 'skipped'].includes(result)) {
      toast.error('Invalid result type');
      return;
    }

    try {
      setChecklistItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === itemId 
            ? { ...item, result, notes: notes || '', completed: true }
            : item
        );
        
        // Verify the item was actually updated
        const updatedItem = updatedItems.find(item => item.id === itemId);
        if (!updatedItem) {
          console.warn('Item not found for update:', itemId);
          toast.error('Failed to update checklist item');
          return prev;
        }
        
        return updatedItems;
      });
      
      // Auto-advance to next item only for passed or skipped items
      // Failed items stay on current step to allow adding notes
      if (result === 'passed' || result === 'skipped') {
        setTimeout(() => {
          setCurrentItemIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex < checklistItems.length ? nextIndex : prev;
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Failed to update checklist item');
    }
  };

  const getCompletionStatus = () => {
    if (!checklistItems || checklistItems.length === 0) {
      return {
        total: 0,
        completed: 0,
        required: 0,
        completedRequired: 0,
        percentage: 0
      };
    }

    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter(item => item && item.completed === true).length;
    const requiredItems = checklistItems.filter(item => item && item.required === true);
    const completedRequired = requiredItems.filter(item => item && item.completed === true).length;
    
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    return {
      total: totalItems,
      completed: completedItems,
      required: requiredItems.length,
      completedRequired,
      percentage: Math.min(Math.max(percentage, 0), 100) // Ensure percentage is between 0-100
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

    if (!selectedTemplate) {
      toast.error('No diagnostic template selected');
      return;
    }

    if (!deviceId) {
      toast.error('Device ID is missing');
      return;
    }

    try {
      setSaving(true);
      
      const results = {
        device_id: deviceId,
        problem_template_id: selectedTemplate.id,
        checklist_items: checklistItems,
        overall_status: overallStatus,
        technician_notes: technicianNotes,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save diagnostic results with better error handling
      const { data: savedResults, error } = await supabase
        .from('diagnostic_checklist_results')
        .insert([results])
        .select()
        .single();

      if (error) {
        console.error('Database error saving checklist results:', error);
        throw new Error(`Failed to save diagnostic results: ${error.message}`);
      }

      // Update device diagnostic checklist with validation
      const { error: deviceError } = await supabase
        .from('devices')
        .update({ 
          diagnostic_checklist: results,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (deviceError) {
        console.error('Database error updating device:', deviceError);
        // Don't throw here - the diagnostic results were saved successfully
        toast('Diagnostic results saved, but device update failed');
      }

      toast.success('Diagnostic checklist completed successfully!');
      onChecklistComplete?.(savedResults || results);
      onClose();
    } catch (error) {
      console.error('Error saving checklist results:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save diagnostic results';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const resetChecklist = () => {
    try {
      if (!checklistItems || checklistItems.length === 0) {
        toast('No checklist items to reset');
        return;
      }

      setChecklistItems(prev => prev.map(item => ({
        ...item,
        result: undefined,
        notes: '',
        completed: false
      })));
      setCurrentItemIndex(0);
      setTechnicianNotes('');
      setOverallStatus('in_progress');
      
      toast.success('Checklist reset successfully');
    } catch (error) {
      console.error('Error resetting checklist:', error);
      toast.error('Failed to reset checklist');
    }
  };

  const goToNextItem = () => {
    if (!checklistItems || checklistItems.length === 0) {
      toast.warning('No checklist items available');
      return;
    }
    
    if (currentItemIndex < checklistItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      toast('Already at the last item');
    }
  };

  const goToPreviousItem = () => {
    if (!checklistItems || checklistItems.length === 0) {
      toast.warning('No checklist items available');
      return;
    }
    
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    } else {
      toast('Already at the first item');
    }
  };

  const goToItem = (index: number) => {
    if (!checklistItems || checklistItems.length === 0) {
      toast.warning('No checklist items available');
      return;
    }
    
    if (typeof index !== 'number' || index < 0 || index >= checklistItems.length) {
      toast.error('Invalid item index');
      return;
    }
    
    setCurrentItemIndex(index);
  };

  const completionStatus = getCompletionStatus();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Diagnostic Checklist"
      maxWidth="lg"
      actions={
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
      }
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

            {/* Single Checklist Item Display */}
            {checklistItems.length > 0 && (
              <div className="space-y-6">
                {/* Progress Indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">
                      Step {currentItemIndex + 1} of {checklistItems.length}
                    </span>
                    <div className="flex gap-1">
                      {checklistItems.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToItem(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentItemIndex
                              ? 'bg-blue-600'
                              : index < currentItemIndex
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {completionStatus.completed}/{completionStatus.total} completed
                  </div>
                </div>

                {/* Current Item */}
                {(() => {
                  const item = checklistItems[currentItemIndex];
                  return (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-sm">
                      {/* Header with Status Indicator */}
                      <div className="flex items-start gap-6 mb-6">
                        <div className="flex-shrink-0">
                          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
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
                                <CheckCircle size={32} />
                              ) : item.result === 'failed' ? (
                                <X size={32} />
                              ) : (
                                <Clock size={32} />
                              )
                            ) : (
                              <span className="text-2xl font-bold text-gray-400">{currentItemIndex + 1}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-2xl font-bold text-gray-900">{item.title}</h4>
                            {item.required && (
                              <span className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-lg text-gray-600 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                      
                      {/* Large Touch-Friendly Action Buttons */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <button
                          onClick={() => updateChecklistItem(item.id, 'passed')}
                          className={`flex items-center justify-center gap-3 py-6 px-6 rounded-xl font-bold text-xl transition-all duration-200 ${
                            item.result === 'passed'
                              ? 'bg-green-600 text-white shadow-lg scale-105'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <CheckCircle size={24} />
                          Pass
                        </button>
                        <button
                          onClick={() => updateChecklistItem(item.id, 'failed')}
                          className={`flex items-center justify-center gap-3 py-6 px-6 rounded-xl font-bold text-xl transition-all duration-200 ${
                            item.result === 'failed'
                              ? 'bg-red-600 text-white shadow-lg scale-105'
                              : 'bg-red-100 text-red-700 hover:bg-red-200 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <X size={24} />
                          Fail
                        </button>
                        <button
                          onClick={() => updateChecklistItem(item.id, 'skipped')}
                          className={`flex items-center justify-center gap-3 py-6 px-6 rounded-xl font-bold text-xl transition-all duration-200 ${
                            item.result === 'skipped'
                              ? 'bg-yellow-600 text-white shadow-lg scale-105'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <Clock size={24} />
                          Skip
                        </button>
                      </div>

                      {/* Notes - Only show for failed items */}
                      {item.completed && item.result === 'failed' && (
                        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                          <label className="block text-lg font-medium text-gray-700 mb-3">
                            What went wrong?
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
                            placeholder="Explain what went wrong..."
                            className="w-full p-4 border border-gray-300 rounded-lg text-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                          />
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={goToPreviousItem}
                          disabled={currentItemIndex === 0}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            currentItemIndex === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          ← Previous
                        </button>
                        
                        <div className="text-center">
                          <div className="text-sm text-gray-500 mb-1">Current Step</div>
                          <div className="text-2xl font-bold text-blue-600">{currentItemIndex + 1}</div>
                        </div>
                        
                        <button
                          onClick={goToNextItem}
                          disabled={currentItemIndex === checklistItems.length - 1}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            currentItemIndex === checklistItems.length - 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

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

          </div>
        )}
      </div>
    </Modal>
  );
};

export default DiagnosticChecklistModal;
