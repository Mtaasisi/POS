import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Camera, Battery, Monitor, Wifi, Speaker, Microphone, HardDrive, Cpu, Memory, CheckSquare, Square, FileText, Send } from 'lucide-react';
import { DeviceStatus, Device } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface DiagnosticChecklistProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (newStatus: DeviceStatus) => void;
}

interface DiagnosticItem {
  id: string;
  title: string;
  description: string;
  category: 'hardware' | 'software' | 'connectivity' | 'performance';
  icon: React.ReactNode;
  required: boolean;
  status: 'pending' | 'pass' | 'fail';
  notes?: string;
  adminNotes?: string;
}

const DiagnosticChecklist: React.FC<DiagnosticChecklistProps> = ({
  device,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticItem[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Standard diagnostic checklist for office devices
  const getDiagnosticChecklist = (deviceType: string): DiagnosticItem[] => {
    const baseDiagnostics: DiagnosticItem[] = [
      // Hardware Tests
      {
        id: 'power-test',
        title: 'Power Test',
        description: 'Check if device powers on and boots properly',
        category: 'hardware',
        icon: <Battery className="h-5 w-5" />,
        required: true,
        status: 'pending'
      },
      {
        id: 'display-test',
        title: 'Display Test',
        description: 'Check screen for dead pixels, brightness, and touch response',
        category: 'hardware',
        icon: <Monitor className="h-5 w-5" />,
        required: true,
        status: 'pending'
      },
      {
        id: 'camera-test',
        title: 'Camera Test',
        description: 'Test front and back cameras for functionality and quality',
        category: 'hardware',
        icon: <Camera className="h-5 w-5" />,
        required: true,
        status: 'pending'
      },
      {
        id: 'audio-test',
        title: 'Audio Test',
        description: 'Test speakers, microphone, and headphone jack',
        category: 'hardware',
        icon: <Speaker className="h-5 w-5" />,
        required: true,
        status: 'pending'
      },
      {
        id: 'storage-test',
        title: 'Storage Test',
        description: 'Check internal storage and SD card functionality',
        category: 'hardware',
        icon: <HardDrive className="h-5 w-5" />,
        required: true,
        status: 'pending'
      },
      {
        id: 'performance-test',
        title: 'Performance Test',
        description: 'Test CPU, RAM, and overall system performance',
        category: 'performance',
        icon: <Cpu className="h-5 w-5" />,
        required: true,
        status: 'pending'
      },
      {
        id: 'wifi-test',
        title: 'WiFi Test',
        description: 'Test WiFi connectivity and signal strength',
        category: 'connectivity',
        icon: <Wifi className="h-5 w-5" />,
        required: true,
        status: 'pending'
      },
      {
        id: 'software-test',
        title: 'Software Test',
        description: 'Check operating system and installed applications',
        category: 'software',
        icon: <CheckSquare className="h-5 w-5" />,
        required: true,
        status: 'pending'
      }
    ];

    // Add device-specific tests
    if (deviceType.toLowerCase().includes('laptop')) {
      baseDiagnostics.push(
        {
          id: 'keyboard-test',
          title: 'Keyboard Test',
          description: 'Test all keys and keyboard backlight',
          category: 'hardware',
          icon: <Square className="h-5 w-5" />,
          required: true,
          status: 'pending'
        },
        {
          id: 'touchpad-test',
          title: 'Touchpad Test',
          description: 'Test touchpad sensitivity and gestures',
          category: 'hardware',
          icon: <Square className="h-5 w-5" />,
          required: true,
          status: 'pending'
        }
      );
    }

    if (deviceType.toLowerCase().includes('phone') || deviceType.toLowerCase().includes('mobile')) {
      baseDiagnostics.push(
        {
          id: 'touch-test',
          title: 'Touch Screen Test',
          description: 'Test touch screen responsiveness and accuracy',
          category: 'hardware',
          icon: <Monitor className="h-5 w-5" />,
          required: true,
          status: 'pending'
        },
        {
          id: 'sim-test',
          title: 'SIM Card Test',
          description: 'Test SIM card detection and cellular connectivity',
          category: 'connectivity',
          icon: <Square className="h-5 w-5" />,
          required: true,
          status: 'pending'
        }
      );
    }

    return baseDiagnostics;
  };

  useEffect(() => {
    if (isOpen && device) {
      // Try to load existing diagnostic from device
      if (device.diagnostic_checklist && device.diagnostic_checklist.items) {
        setDiagnosticItems(device.diagnostic_checklist.items);
        setNotes(device.diagnostic_checklist.notes || {});
        setAdminNotes(device.diagnostic_checklist.adminNotes || '');
      } else {
        // Create new diagnostic checklist
        const newDiagnostics = getDiagnosticChecklist(device.model);
        setDiagnosticItems(newDiagnostics);
        setNotes({});
        setAdminNotes('');
      }
      setCurrentStep(0);
    }
  }, [isOpen, device]);

  const updateDiagnosticStatus = (itemId: string, status: 'pass' | 'fail') => {
    setDiagnosticItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, status }
          : item
      )
    );

    // Auto-advance to next step
    const currentItemIndex = diagnosticItems.findIndex(item => item.id === itemId);
    if (currentItemIndex < diagnosticItems.length - 1) {
      setCurrentStep(currentItemIndex + 1);
    }
  };

  const updateNotes = (itemId: string, note: string) => {
    setNotes(prev => ({ ...prev, [itemId]: note }));
  };

  const getDiagnosticSummary = () => {
    const total = diagnosticItems.length;
    const passed = diagnosticItems.filter(item => item.status === 'pass').length;
    const failed = diagnosticItems.filter(item => item.status === 'fail').length;
    const pending = diagnosticItems.filter(item => item.status === 'pending').length;

    return { total, passed, failed, pending };
  };

  const getOverallStatus = () => {
    const { failed, pending } = getDiagnosticSummary();
    if (pending > 0) return 'in-progress';
    if (failed > 0) return 'issues-found';
    return 'all-passed';
  };

  const handleSaveDiagnostic = async () => {
    console.log('[DiagnosticChecklist] Starting diagnostic save...');
    setLoading(true);
    
    try {
      const summary = getDiagnosticSummary();
      const overallStatus = getOverallStatus();

      console.log('[DiagnosticChecklist] Diagnostic summary:', summary);
      console.log('[DiagnosticChecklist] Overall status:', overallStatus);
      console.log('[DiagnosticChecklist] Device ID:', device.id);
      console.log('[DiagnosticChecklist] Current device status:', device.status);

      const diagnosticData = {
        diagnostic_checklist: {
          items: diagnosticItems,
          notes: notes,
          adminNotes: adminNotes,
          summary: summary,
          overallStatus: overallStatus,
          last_updated: new Date().toISOString()
        }
      };

      console.log('[DiagnosticChecklist] Saving diagnostic data:', diagnosticData);

      // Save diagnostic results to device
      const { data, error } = await supabase
        .from('devices')
        .update(diagnosticData)
        .eq('id', device.id)
        .select();

      if (error) {
        console.error('[DiagnosticChecklist] ❌ Database update failed:', error);
        console.error('[DiagnosticChecklist] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('[DiagnosticChecklist] ✅ Database update successful:', data);

      // Update device status based on diagnostic results
      let newStatus: DeviceStatus = device.status;
      if (overallStatus === 'all-passed') {
        newStatus = 'diagnosis-complete';
      } else if (overallStatus === 'issues-found') {
        newStatus = 'diagnosis-issues';
      } else {
        newStatus = 'diagnosis-started';
      }

      console.log('[DiagnosticChecklist] Status update logic:', {
        currentStatus: device.status,
        newStatus: newStatus,
        willUpdate: newStatus !== device.status
      });

      if (newStatus !== device.status) {
        console.log('[DiagnosticChecklist] Updating device status to:', newStatus);
        onStatusUpdate(newStatus);
      }

      console.log('[DiagnosticChecklist] ✅ Diagnostic save completed successfully');
      toast.success('Diagnostic results saved successfully');
      onClose();
    } catch (error) {
      console.error('[DiagnosticChecklist] ❌ Error saving diagnostic:', error);
      toast.error('Failed to save diagnostic results');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToAdmin = async () => {
    console.log('[DiagnosticChecklist] Starting admin submission...');
    setLoading(true);
    
    try {
      const summary = getDiagnosticSummary();
      const overallStatus = getOverallStatus();

      console.log('[DiagnosticChecklist] Admin submission data:', {
        summary,
        overallStatus,
        deviceId: device.id,
        currentStatus: device.status
      });

      const adminSubmissionData = {
        diagnostic_checklist: {
          items: diagnosticItems,
          notes: notes,
          adminNotes: adminNotes,
          summary: summary,
          overallStatus: overallStatus,
          submittedToAdmin: true,
          submittedAt: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        status: 'awaiting-admin-review'
      };

      console.log('[DiagnosticChecklist] Saving admin submission data:', adminSubmissionData);

      // Save diagnostic with admin submission
      const { data, error } = await supabase
        .from('devices')
        .update(adminSubmissionData)
        .eq('id', device.id)
        .select();

      if (error) {
        console.error('[DiagnosticChecklist] ❌ Admin submission failed:', error);
        console.error('[DiagnosticChecklist] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('[DiagnosticChecklist] ✅ Admin submission successful:', data);

      // Create admin notification
      const notificationData = {
        device_id: device.id,
        type: 'diagnostic_report',
        title: `Diagnostic Report: ${device.brand} ${device.model}`,
        message: `Diagnostic completed with ${summary.failed} issues found. Requires admin review.`,
        status: 'unread',
        created_at: new Date().toISOString()
      };

      console.log('[DiagnosticChecklist] Creating admin notification:', notificationData);

      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert(notificationData);

      if (notificationError) {
        console.warn('[DiagnosticChecklist] ⚠️ Failed to create admin notification:', notificationError);
      } else {
        console.log('[DiagnosticChecklist] ✅ Admin notification created successfully');
      }

      console.log('[DiagnosticChecklist] Updating device status to awaiting-admin-review');
      onStatusUpdate('awaiting-admin-review');
      
      console.log('[DiagnosticChecklist] ✅ Admin submission completed successfully');
      toast.success('Diagnostic report submitted to admin');
      onClose();
    } catch (error) {
      console.error('[DiagnosticChecklist] ❌ Error submitting to admin:', error);
      toast.error('Failed to submit to admin');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50 border-green-200';
      case 'fail': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hardware': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'software': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'connectivity': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'performance': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  const summary = getDiagnosticSummary();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Device Diagnostic Checklist</h2>
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

        {/* Summary Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Passed: {summary.passed}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Failed: {summary.failed}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Pending: {summary.pending}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {Math.round(((summary.passed + summary.failed) / summary.total) * 100)}% Complete
            </div>
          </div>
        </div>

        {/* Diagnostic Items */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {diagnosticItems.map((item, index) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  item.status === 'pass'
                    ? 'bg-green-50 border-green-200'
                    : item.status === 'fail'
                    ? 'bg-red-50 border-red-200'
                    : index === currentStep
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {item.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {item.status === 'pass' && <CheckCircle className="h-3 w-3" />}
                        {item.status === 'fail' && <XCircle className="h-3 w-3" />}
                        {item.status === 'pending' && <AlertTriangle className="h-3 w-3" />}
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      {item.required && (
                        <span className="text-xs text-red-600 font-medium">Required</span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => updateDiagnosticStatus(item.id, 'pass')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          item.status === 'pass'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Working
                      </button>
                      <button
                        onClick={() => updateDiagnosticStatus(item.id, 'fail')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          item.status === 'fail'
                            ? 'bg-red-500 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <XCircle className="h-4 w-4 inline mr-1" />
                        Fail
                      </button>
                    </div>

                    {/* Notes Input */}
                    <div className="mt-3">
                      <textarea
                        placeholder="Add notes for this test..."
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

        {/* Admin Notes */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Notes</h3>
          <textarea
            placeholder="Add notes for admin review..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {summary.passed + summary.failed} of {summary.total} tests completed
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDiagnostic}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Results'}
            </button>
            <button
              onClick={handleSubmitToAdmin}
              disabled={loading || summary.pending > 0}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Submit to Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticChecklist; 