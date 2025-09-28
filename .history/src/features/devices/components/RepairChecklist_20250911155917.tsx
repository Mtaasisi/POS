import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertTriangle, Wrench, PackageCheck, TestTube, CheckSquare, Square } from 'lucide-react';
import { DeviceStatus, Device } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface RepairChecklistProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (newStatus: DeviceStatus) => void;
}

interface ChecklistItem {
  id: string;
  step: number;
  title: string;
  description: string;
  category: 'diagnosis' | 'repair' | 'testing' | 'completion';
  required: boolean;
  completed: boolean;
  notes?: string;
}

const RepairChecklist: React.FC<RepairChecklistProps> = ({
  device,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Standard repair checklist based on device status
  const getStandardChecklist = (status: DeviceStatus): ChecklistItem[] => {
    const baseChecklist: ChecklistItem[] = [
      // Diagnosis Phase
      {
        id: 'diagnosis-1',
        step: 1,
        title: 'Initial Assessment',
        description: 'Examine device for physical damage and power issues',
        category: 'diagnosis',
        required: true,
        completed: false
      },
      {
        id: 'diagnosis-2',
        step: 2,
        title: 'Power Testing',
        description: 'Test device power supply and battery functionality',
        category: 'diagnosis',
        required: true,
        completed: false
      },
      {
        id: 'diagnosis-3',
        step: 3,
        title: 'Functionality Test',
        description: 'Test all major functions and identify specific issues',
        category: 'diagnosis',
        required: true,
        completed: false
      },
      {
        id: 'diagnosis-4',
        step: 4,
        title: 'Parts Assessment',
        description: 'Identify required parts and check availability',
        category: 'diagnosis',
        required: true,
        completed: false
      }
    ];

    // Add repair phase if device is in repair
    if (['in-repair', 'awaiting-parts'].includes(status)) {
      baseChecklist.push(
        {
          id: 'repair-1',
          step: 5,
          title: 'Parts Installation',
          description: 'Install required replacement parts',
          category: 'repair',
          required: true,
          completed: false
        },
        {
          id: 'repair-2',
          step: 6,
          title: 'Component Testing',
          description: 'Test individual components after repair',
          category: 'repair',
          required: true,
          completed: false
        }
      );
    }

    // Add testing phase if device is ready for testing
    if (['reassembled-testing'].includes(status)) {
      baseChecklist.push(
        {
          id: 'testing-1',
          step: 7,
          title: 'Full System Test',
          description: 'Test all device functions after repair',
          category: 'testing',
          required: true,
          completed: false
        },
        {
          id: 'testing-2',
          step: 8,
          title: 'Performance Test',
          description: 'Verify device performance meets standards',
          category: 'testing',
          required: true,
          completed: false
        },
        {
          id: 'testing-3',
          step: 9,
          title: 'Quality Check',
          description: 'Final quality assurance check',
          category: 'testing',
          required: true,
          completed: false
        }
      );
    }

    // Add completion phase
    baseChecklist.push(
      {
        id: 'completion-1',
        step: baseChecklist.length + 1,
        title: 'Documentation',
        description: 'Complete repair documentation and notes',
        category: 'completion',
        required: true,
        completed: false
      },
      {
        id: 'completion-2',
        step: baseChecklist.length + 2,
        title: 'Final Inspection',
        description: 'Final device inspection before completion',
        category: 'completion',
        required: true,
        completed: false
      }
    );

    return baseChecklist;
  };

  useEffect(() => {
    if (isOpen && device) {
      // Try to load existing checklist from device
      if (device.repair_checklist && device.repair_checklist.items) {
        setChecklist(device.repair_checklist.items);
        setNotes(device.repair_checklist.notes || {});
      } else {
        // Create new standard checklist
        const standardChecklist = getStandardChecklist(device.status);
        setChecklist(standardChecklist);
        setNotes({});
      }
      setCurrentStep(0);
    }
  }, [isOpen, device]);

  const toggleItem = async (itemId: string) => {
    console.log('[RepairChecklist] Toggling item:', itemId);
    
    const updatedChecklist = checklist.map(item => 
      item.id === itemId 
        ? { ...item, completed: !item.completed }
        : item
    );
    
    setChecklist(updatedChecklist);
    console.log('[RepairChecklist] Updated checklist:', updatedChecklist);

    // Auto-save individual item change
    try {
      const repairData = {
        repair_checklist: {
          items: updatedChecklist,
          notes: notes,
          last_updated: new Date().toISOString()
        }
      };

      console.log('[RepairChecklist] Auto-saving repair data:', repairData);

      const { error } = await supabase
        .from('devices')
        .update(repairData)
        .eq('id', device.id);

      if (error) {
        console.error('[RepairChecklist] Auto-save failed:', error);
        toast.error('Failed to save changes');
      } else {
        console.log('[RepairChecklist] ✅ Auto-save successful for item:', itemId);
        toast.success('Changes saved automatically');
      }
    } catch (error) {
      console.error('[RepairChecklist] Auto-save error:', error);
      toast.error('Failed to save changes');
    }

    // Auto-advance to next step
    const currentItemIndex = checklist.findIndex(item => item.id === itemId);
    if (currentItemIndex < checklist.length - 1) {
      setCurrentStep(currentItemIndex + 1);
    }
  };

  const updateNotes = async (itemId: string, note: string) => {
    console.log('[RepairChecklist] Updating notes for item:', itemId, 'note:', note);
    
    const updatedNotes = { ...notes, [itemId]: note };
    setNotes(updatedNotes);

    // Auto-save notes change
    try {
      const repairData = {
        repair_checklist: {
          items: checklist,
          notes: updatedNotes,
          last_updated: new Date().toISOString()
        }
      };

      console.log('[RepairChecklist] Auto-saving notes:', repairData);

      const { error } = await supabase
        .from('devices')
        .update(repairData)
        .eq('id', device.id);

      if (error) {
        console.error('[RepairChecklist] Auto-save notes failed:', error);
        toast.error('Failed to save notes');
      } else {
        console.log('[RepairChecklist] ✅ Auto-save notes successful for item:', itemId);
      }
    } catch (error) {
      console.error('[RepairChecklist] Auto-save notes error:', error);
      toast.error('Failed to save notes');
    }
  };

  const getStatusFromChecklist = (): DeviceStatus | null => {
    const diagnosisItems = checklist.filter(item => item.category === 'diagnosis');
    const repairItems = checklist.filter(item => item.category === 'repair');
    const testingItems = checklist.filter(item => item.category === 'testing');
    
    const diagnosisCompleted = diagnosisItems.length > 0 && diagnosisItems.every(item => item.completed);
    const repairCompleted = repairItems.length > 0 && repairItems.every(item => item.completed);
    const testingCompleted = testingItems.length > 0 && testingItems.every(item => item.completed);

    if (!diagnosisCompleted) return 'diagnosis-started';
    if (diagnosisCompleted && repairItems.length > 0 && !repairCompleted) return 'in-repair';
    if (repairCompleted && testingItems.length > 0 && !testingCompleted) return 'reassembled-testing';
    if (testingCompleted) return 'repair-complete';
    
    return null;
  };

  const handleSaveChecklist = async () => {
    console.log('[RepairChecklist] Starting repair checklist save...');
    setLoading(true);
    
    try {
      const repairData = {
        repair_checklist: {
          items: checklist,
          notes: notes,
          last_updated: new Date().toISOString()
        }
      };

      console.log('[RepairChecklist] Repair checklist data:', repairData);
      console.log('[RepairChecklist] Device ID:', device.id);
      console.log('[RepairChecklist] Current device status:', device.status);

      // Save checklist progress to device
      const { data, error } = await supabase
        .from('devices')
        .update(repairData)
        .eq('id', device.id)
        .select();

      if (error) {
        console.error('[RepairChecklist] ❌ Database update failed:', error);
        console.error('[RepairChecklist] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('[RepairChecklist] ✅ Database update successful:', data);

      // Update device status if checklist suggests a change
      const newStatus = getStatusFromChecklist();
      console.log('[RepairChecklist] Status update logic:', {
        currentStatus: device.status,
        newStatus: newStatus,
        willUpdate: newStatus && newStatus !== device.status
      });

      if (newStatus && newStatus !== device.status) {
        console.log('[RepairChecklist] Updating device status to:', newStatus);
        onStatusUpdate(newStatus);
      }

      console.log('[RepairChecklist] ✅ Repair checklist save completed successfully');
      toast.success('Repair checklist saved successfully');
      onClose();
    } catch (error) {
      console.error('[RepairChecklist] ❌ Error saving checklist:', error);
      toast.error('Failed to save checklist');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diagnosis': return <Wrench className="h-4 w-4" />;
      case 'repair': return <PackageCheck className="h-4 w-4" />;
      case 'testing': return <TestTube className="h-4 w-4" />;
      case 'completion': return <CheckSquare className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diagnosis': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'repair': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'testing': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'completion': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Repair Checklist</h2>
              <p className="text-blue-100">{device.brand} {device.model} - {device.id}</p>
              <p className="text-blue-200 text-sm">Current Status: {device.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {checklist.filter(item => item.completed).length} / {checklist.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((checklist.filter(item => item.completed).length / checklist.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(checklist.filter(item => item.completed).length / checklist.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Checklist Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {checklist.map((item, index) => (
              <div 
                key={item.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  item.completed 
                    ? 'bg-green-50 border-green-200' 
                    : index === currentStep
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`mt-1 p-1 rounded-full transition-colors ${
                      item.completed 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {item.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                        {getCategoryIcon(item.category)}
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">Step {item.step}</span>
                      {item.required && (
                        <span className="text-xs text-red-600 font-medium">Required</span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    
                    {/* Notes Input */}
                    <div className="mt-3">
                      <textarea
                        placeholder="Add notes for this step..."
                        value={notes[item.id] || ''}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {checklist.filter(item => item.completed).length} of {checklist.length} steps completed
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChecklist}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Update Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairChecklist; 