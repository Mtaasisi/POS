import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  getDiagnosticRequest, 
  getDiagnosticTemplate,
  createDiagnosticCheck,
  updateDiagnosticCheck,
  getDiagnosticChecks,
  updateDiagnosticRequest,
  updateDiagnosticDevice
} from '../../../lib/diagnosticsApi';
import { 
  DiagnosticRequest, 
  DiagnosticDevice, 
  DiagnosticCheck,
  DiagnosticTemplate,
  ChecklistItem,
  UpdateDiagnosticCheckData
} from '../types/diagnostics';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Save, 
  Upload, 
  Camera,
  Monitor,
  Printer,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DiagnosticDevicePage: React.FC = () => {
  const { requestId, deviceId } = useParams<{ requestId: string; deviceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<DiagnosticRequest | null>(null);
  const [device, setDevice] = useState<DiagnosticDevice | null>(null);
  const [template, setTemplate] = useState<DiagnosticTemplate | null>(null);
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  // Load data
  useEffect(() => {
    if (requestId && deviceId) {
      loadData();
    }
  }, [requestId, deviceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const requestData = await getDiagnosticRequest(requestId!);
      if (!requestData) {
        toast.error('Diagnostic request not found');
        navigate('/diagnostics/assigned');
        return;
      }

      setRequest(requestData);
      
      // Find the specific device
      const targetDevice = requestData.devices?.find(d => d.id === deviceId);
      if (!targetDevice) {
        toast.error('Device not found in request');
        navigate('/diagnostics/assigned');
        return;
      }

      setDevice(targetDevice);

      // Load template based on device type
      const deviceType = getDeviceTypeFromName(targetDevice.device_name);
      const templateData = await getDiagnosticTemplate(deviceType);
      setTemplate(templateData);

      // Load existing checks
      const checksData = await getDiagnosticChecks(deviceId!);
      setChecks(checksData);
    } catch (error) {
      console.error('Error loading diagnostic data:', error);
      toast.error('Failed to load diagnostic data');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceTypeFromName = (deviceName: string): string => {
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return 'laptop';
    if (name.includes('printer') || name.includes('print')) return 'printer';
    if (name.includes('monitor') || name.includes('screen')) return 'monitor';
    if (name.includes('desktop') || name.includes('pc')) return 'desktop';
    if (name.includes('tablet') || name.includes('ipad')) return 'tablet';
    if (name.includes('phone') || name.includes('mobile')) return 'phone';
    return 'other';
  };

  const getDeviceIcon = (deviceName?: string) => {
    if (!deviceName) return <Package className="h-5 w-5" />;
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return <Laptop className="h-5 w-5" />;
    if (name.includes('printer') || name.includes('print')) return <Printer className="h-5 w-5" />;
    if (name.includes('monitor') || name.includes('screen')) return <Monitor className="h-5 w-5" />;
    if (name.includes('desktop') || name.includes('pc')) return <Monitor className="h-5 w-5" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet className="h-5 w-5" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'passed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'partially_failed':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'submitted':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleCheckResult = async (itemId: string, result: 'passed' | 'failed', remarks?: string) => {
    setSaving(true);
    try {
      const existingCheck = checks.find(c => c.test_item === itemId);
      
      const checkData: UpdateDiagnosticCheckData = {
        test_item: itemId,
        result,
        remarks
      };

      if (existingCheck) {
        await updateDiagnosticCheck(existingCheck.id, checkData);
      } else {
        await createDiagnosticCheck(deviceId!, checkData);
      }

      // Reload checks
      const updatedChecks = await getDiagnosticChecks(deviceId!);
      setChecks(updatedChecks);

      toast.success(`Check result saved: ${result}`);
    } catch (error) {
      console.error('Error saving check result:', error);
      toast.error('Failed to save check result');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteDiagnosis = async () => {
    setSaving(true);
    try {
      // Update device result status based on checks
      const totalChecks = template?.checklist_items.length || 0;
      const passedChecks = checks.filter(c => c.result === 'passed').length;
      const failedChecks = checks.filter(c => c.result === 'failed').length;
      const completedChecks = checks.filter(c => c.result === 'passed' || c.result === 'failed').length;

      let resultStatus = 'pending';
      if (completedChecks === totalChecks && totalChecks > 0) {
        if (failedChecks === 0) {
          resultStatus = 'passed';
        } else if (passedChecks === 0) {
          resultStatus = 'failed';
        } else {
          resultStatus = 'partially_failed';
        }
      }

      // Update device status
      await updateDiagnosticDevice(deviceId!, { result_status: resultStatus });

      // Determine next step based on results
      if (resultStatus === 'passed') {
        // All tests passed - send to customer care
        await updateDiagnosticDevice(deviceId!, { result_status: 'sent_to_care' });
        await updateDiagnosticRequest(requestId!, { status: 'completed' });
        toast.success('All tests passed! Device sent to customer care.');
      } else {
        // Some tests failed - send to admin for review
        await updateDiagnosticDevice(deviceId!, { 
          result_status: 'submitted_for_review',
          submitted_at: new Date().toISOString()
        });
        await updateDiagnosticRequest(requestId!, { status: 'submitted_for_review' });
        toast.success('Diagnostic completed. Results sent to admin for review.');
      }
      
      navigate('/diagnostics/assigned');
    } catch (error) {
      console.error('Error completing diagnosis:', error);
      toast.error('Failed to complete diagnosis');
    } finally {
      setSaving(false);
    }
  };

  const getCheckResult = (itemId: string) => {
    return checks.find(c => c.test_item === itemId)?.result;
  };

  const getCheckRemarks = (itemId: string) => {
    return checks.find(c => c.test_item === itemId)?.remarks;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diagnostic device...</p>
        </div>
      </div>
    );
  }

  if (!request || !device || !template) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Device Not Found</h2>
            <p className="text-gray-600">The requested diagnostic device could not be found.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const completedChecks = checks.filter(c => c.result === 'passed' || c.result === 'failed').length;
  const totalChecks = template.checklist_items.length;
  const progressPercentage = totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <GlassButton
            onClick={() => navigate('/diagnostics/assigned')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </GlassButton>
          <h1 className="text-2xl font-bold text-gray-900">Device Diagnosis</h1>
        </div>

        {/* Device Info */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getDeviceIcon(device.device_name)}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{device.device_name}</h2>
                {device.model && <p className="text-gray-600">{device.model}</p>}
                {device.serial_number && <p className="text-sm text-gray-500">S/N: {device.serial_number}</p>}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(device.result_status)}`}>
              {device.result_status.replace('_', ' ')}
            </span>
          </div>
          
          {device.notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Info size={16} />
                <span className="font-medium">Notes:</span>
              </div>
              <p className="text-blue-700 mt-1">{device.notes}</p>
            </div>
          )}
        </GlassCard>

        {/* Progress Bar */}
        <GlassCard className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {completedChecks} / {totalChecks} checks completed
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </GlassCard>
      </div>

      {/* Diagnostic Checklist */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Checklist</h3>
        
        <div className="space-y-4">
          {template.checklist_items.map((item) => {
            const currentResult = getCheckResult(item.id);
            const currentRemarks = getCheckRemarks(item.id);
            const itemRemarks = remarks[item.id] || currentRemarks || '';

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  currentResult === 'passed'
                    ? 'bg-green-50 border-green-200'
                    : currentResult === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <GlassButton
                      onClick={() => handleCheckResult(item.id, 'passed', itemRemarks)}
                      disabled={saving}
                      className={`flex items-center gap-2 ${
                        currentResult === 'passed'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <CheckCircle size={16} />
                      Pass
                    </GlassButton>
                    
                    <GlassButton
                      onClick={() => handleCheckResult(item.id, 'failed', itemRemarks)}
                      disabled={saving}
                      className={`flex items-center gap-2 ${
                        currentResult === 'failed'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <XCircle size={16} />
                      Fail
                    </GlassButton>
                  </div>
                </div>

                {/* Remarks Section */}
                {currentRemarks && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Info size={14} className="text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Remarks:</span>
                    </div>
                    <p className="text-sm text-yellow-700">{currentRemarks}</p>
                  </div>
                )}

                {/* Remarks Input */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks (optional)
                  </label>
                  <textarea
                    value={itemRemarks}
                    onChange={(e) => setRemarks(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Add notes about this test..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <GlassButton
            onClick={() => navigate('/diagnostics/assigned')}
            className="flex items-center gap-2"
          >
            Cancel
          </GlassButton>
          
          <GlassButton
            onClick={handleCompleteDiagnosis}
            disabled={saving || completedChecks === 0}
            className="flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Upload size={20} />
            )}
            {saving ? 'Processing...' : 'Complete Diagnosis'}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default DiagnosticDevicePage;