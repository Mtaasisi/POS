import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, AlertTriangle, Clock, CheckSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from '../../../lib/toastUtils';
import { DiagnosticProblem, DiagnosticChecklistItem, DiagnosticChecklistProgress } from '../../../types/diagnostic';

interface DiagnosticChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  onComplete: (completed: boolean) => void;
  selectedProblem?: DiagnosticProblem;
}

const DiagnosticChecklistModal: React.FC<DiagnosticChecklistModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  onComplete,
  selectedProblem
}) => {
  const [checklistItems, setChecklistItems] = useState<DiagnosticChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<DiagnosticChecklistProgress>({
    totalItems: 0,
    completedItems: 0,
    requiredItems: 0,
    completedRequiredItems: 0,
    isComplete: false,
    canProceed: false
  });

  // Load checklist items when modal opens
  useEffect(() => {
    if (isOpen && selectedProblem) {
      loadChecklistItems();
    }
  }, [isOpen, selectedProblem]);

  // Calculate progress when checked items change
  useEffect(() => {
    calculateProgress();
  }, [checkedItems, checklistItems]);

  const loadChecklistItems = async () => {
    if (!selectedProblem) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diagnostic_checklist_items')
        .select('*')
        .eq('problem_id', selectedProblem.id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      setChecklistItems(data || []);
      
      // Load existing checklist data if available
      await loadExistingChecklist();
    } catch (error) {
      console.error('Error loading checklist items:', error);
      toast.error('Failed to load diagnostic checklist');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('device_diagnostic_checklists')
        .select('checklist_data')
        .eq('device_id', deviceId)
        .eq('problem_id', selectedProblem?.id)
        .single();

      if (data && !error) {
        setCheckedItems(data.checklist_data || {});
      }
    } catch (error) {
      // No existing checklist found, that's okay
    }
  };

  const calculateProgress = () => {
    const totalItems = checklistItems.length;
    const completedItems = Object.values(checkedItems).filter(Boolean).length;
    const requiredItems = checklistItems.filter(item => item.isRequired).length;
    const completedRequiredItems = checklistItems
      .filter(item => item.isRequired && checkedItems[item.id])
      .length;

    const isComplete = completedItems === totalItems;
    const canProceed = completedRequiredItems === requiredItems;

    setProgress({
      totalItems,
      completedItems,
      requiredItems,
      completedRequiredItems,
      isComplete,
      canProceed
    });
  };

  const handleItemToggle = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSaveChecklist = async () => {
    if (!selectedProblem) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('device_diagnostic_checklists')
        .upsert({
          device_id: deviceId,
          problem_id: selectedProblem.id,
          checklist_data: checkedItems,
          completed_at: progress.isComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Diagnostic checklist saved successfully');
      onComplete(progress.isComplete);
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save diagnostic checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!progress.canProceed) {
      toast.error('Please complete all required diagnostic steps');
      return;
    }

    await handleSaveChecklist();
    onClose();
  };

  if (!isOpen || !selectedProblem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Diagnostic Checklist
              </h2>
              <p className="text-sm text-gray-600">
                {selectedProblem.name} - {selectedProblem.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {progress.completedItems} of {progress.totalItems} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.totalItems > 0 ? (progress.completedItems / progress.totalItems) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-600">
                {progress.completedRequiredItems}/{progress.requiredItems} Required
              </span>
            </div>
            {progress.isComplete && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Complete!</span>
              </div>
            )}
          </div>
        </div>

        {/* Checklist Items */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600">Loading checklist...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {checklistItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg transition-all ${
                    checkedItems[item.id]
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleItemToggle(item.id)}
                      className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        checkedItems[item.id]
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {checkedItems[item.id] && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {index + 1}. {item.title}
                        </span>
                        {item.isRequired && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Complete all required steps to proceed with diagnosis
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChecklist}
              disabled={saving}
              className="px-4 py-2 text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              onClick={handleComplete}
              disabled={!progress.canProceed || saving}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                progress.canProceed
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {progress.isComplete ? 'Complete Diagnosis' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticChecklistModal;