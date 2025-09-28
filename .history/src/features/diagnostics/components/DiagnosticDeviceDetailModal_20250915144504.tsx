import React, { useState, useEffect } from 'react';
import { DiagnosticRequest, DiagnosticDevice } from '../../types/diagnostics';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import {
  X, Stethoscope, CheckCircle, AlertTriangle, Wrench, Package, 
  Camera, Battery, Wifi, Speaker, Monitor, Cpu, HardDrive,
  Smartphone, Laptop, Tablet, Clock, FileText, Lightbulb,
  ArrowRight, ArrowLeft, Play, Pause, RotateCcw, Save,
  User, Calendar, MapPin, Phone, Mail
} from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import DiagnosticChecklist from './DiagnosticChecklist';

interface DiagnosticDeviceDetailModalProps {
  request: DiagnosticRequest;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface DiagnosticDeviceWithDetails extends DiagnosticDevice {
  diagnostic_checklist?: any;
  result_status?: string;
  notes?: string;
  admin_feedback?: string;
  next_action?: string;
}

const DiagnosticDeviceDetailModal: React.FC<DiagnosticDeviceDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onRefresh
}) => {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState<DiagnosticDeviceWithDetails[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DiagnosticDeviceWithDetails | null>(null);
  const [showDiagnosticChecklist, setShowDiagnosticChecklist] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load diagnostic devices for this request
  useEffect(() => {
    if (isOpen && request) {
      loadDiagnosticDevices();
    }
  }, [isOpen, request]);

  const loadDiagnosticDevices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnostic_devices')
        .select('*')
        .eq('diagnostic_request_id', request.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading diagnostic devices:', error);
        toast.error('Failed to load diagnostic devices');
        return;
      }

      setDevices(data || []);
    } catch (error) {
      console.error('Error loading diagnostic devices:', error);
      toast.error('Failed to load diagnostic devices');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDiagnostic = (device: DiagnosticDeviceWithDetails) => {
    setSelectedDevice(device);
    setShowDiagnosticChecklist(true);
  };

  const handleDiagnosticComplete = async (deviceId: string, status: string) => {
    try {
      // Update device status
      const { error } = await supabase
        .from('diagnostic_devices')
        .update({ 
          result_status: status,
          submitted_at: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (error) {
        console.error('Error updating device status:', error);
        toast.error('Failed to update device status');
        return;
      }

      toast.success('Diagnostic completed successfully!');
      setShowDiagnosticChecklist(false);
      setSelectedDevice(null);
      loadDiagnosticDevices(); // Refresh the list
      onRefresh(); // Refresh parent component
    } catch (error) {
      console.error('Error completing diagnostic:', error);
      toast.error('Failed to complete diagnostic');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'partially_failed': return 'text-yellow-600 bg-yellow-100';
      case 'submitted_for_review': return 'text-blue-600 bg-blue-100';
      case 'repair_required': return 'text-orange-600 bg-orange-100';
      case 'replacement_required': return 'text-purple-600 bg-purple-100';
      case 'no_action_required': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'partially_failed': return <AlertTriangle className="w-4 h-4" />;
      case 'submitted_for_review': return <FileText className="w-4 h-4" />;
      case 'repair_required': return <Wrench className="w-4 h-4" />;
      case 'replacement_required': return <Package className="w-4 h-4" />;
      case 'no_action_required': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return <Laptop className="w-5 h-5" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="w-5 h-5" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <GlassCard className="p-0">
            {/* Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500 text-white">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Diagnostic Request Details</h2>
                    <p className="text-sm text-gray-600">{request.title}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Request Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Created by:</span>
                    <span className="font-medium">{request.created_by_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Total devices:</span>
                    <span className="font-medium">{request.total_devices}</span>
                  </div>
                </div>
                {request.notes && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-700">{request.notes}</p>
                  </div>
                )}
              </div>

              {/* Devices List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Diagnostic Devices</h3>
                
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">No devices found for this diagnostic request</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devices.map((device) => (
                      <div key={device.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(device.device_name)}
                            <div>
                              <h4 className="font-semibold text-gray-900">{device.device_name}</h4>
                              {device.model && (
                                <p className="text-sm text-gray-600">{device.model}</p>
                              )}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(device.result_status || 'pending')}`}>
                            {getStatusIcon(device.result_status || 'pending')}
                            {device.result_status ? device.result_status.replace('_', ' ') : 'Pending'}
                          </div>
                        </div>

                        {device.serial_number && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Serial:</span> {device.serial_number}
                          </div>
                        )}

                        {device.notes && (
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Notes:</span> {device.notes}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <GlassButton
                            onClick={() => handleStartDiagnostic(device)}
                            variant="primary"
                            size="sm"
                            className="flex-1"
                          >
                            <Stethoscope className="w-4 h-4 mr-2" />
                            {device.result_status ? 'Review Diagnostic' : 'Start Diagnostic'}
                          </GlassButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Diagnostic Checklist Modal */}
      {selectedDevice && (
        <DiagnosticChecklist
          device={{
            id: selectedDevice.id,
            brand: selectedDevice.device_name.split(' ')[0] || 'Unknown',
            model: selectedDevice.model || selectedDevice.device_name,
            serialNumber: selectedDevice.serial_number || '',
            issueDescription: selectedDevice.notes || 'Diagnostic testing required',
            status: 'diagnosis-started' as any,
            assignedTo: currentUser?.id || '',
            customerId: '',
            customerName: '',
            phoneNumber: '',
            expectedReturnDate: null,
            createdAt: selectedDevice.created_at,
            updatedAt: selectedDevice.updated_at,
            estimatedHours: 0,
            warrantyStart: null,
            warrantyEnd: null,
            warrantyStatus: null,
            repairCount: 0,
            lastReturnDate: null,
            remarks: [],
            transitions: [],
            ratings: [],
            diagnostic_checklist: selectedDevice.diagnostic_checklist
          }}
          isOpen={showDiagnosticChecklist}
          onClose={() => {
            setShowDiagnosticChecklist(false);
            setSelectedDevice(null);
          }}
          onStatusUpdate={(status) => {
            handleDiagnosticComplete(selectedDevice.id, status);
          }}
        />
      )}
    </>
  );
};

export default DiagnosticDeviceDetailModal;
