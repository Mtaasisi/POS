import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  createDiagnosticRequest, 
  getDiagnosticTemplates,
  getTechnicians 
} from '../lib/diagnosticsApi';
import { 
  CreateDiagnosticRequestData, 
  CreateDiagnosticDeviceData,
  DiagnosticTemplate
} from '../types/diagnostics';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Monitor, 
  Printer, 
  Laptop, 
  Smartphone,
  Tablet,
  Package,
  FileText,
  ChevronDown,
  ChevronUp,
  Hash,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const NewDiagnosticRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<{ id: string; name: string; username: string }[]>([]);
  const [templates, setTemplates] = useState<DiagnosticTemplate[]>([]);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [deviceNotesExpanded, setDeviceNotesExpanded] = useState<{ [key: number]: boolean }>({});
  const [devices, setDevices] = useState<CreateDiagnosticDeviceData[]>([
    {
      device_name: '',
      brand: '',
      serial_number: '',
      model: '',
      notes: '',
      quantity: 1,
      individual_serials: [],
      template_id: undefined
    }
  ]);

  // Check if user has permission
  if (!currentUser || !['admin', 'customer-care'].includes(currentUser.role)) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to create diagnostic requests.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Load technicians and templates
  useEffect(() => {
    const loadData = async () => {
      const [techData, templateData] = await Promise.all([
        getTechnicians(),
        getDiagnosticTemplates()
      ]);
      setTechnicians(techData);
      setTemplates(templateData);
    };
    loadData();
  }, []);

  const addDevice = () => {
    setDevices([
      ...devices,
      {
        device_name: '',
        brand: '',
        serial_number: '',
        model: '',
        notes: '',
        quantity: 1,
        individual_serials: [],
        template_id: undefined
      }
    ]);
  };

  const removeDevice = (index: number) => {
    if (devices.length > 1) {
      setDevices(devices.filter((_, i) => i !== index));
    }
  };

  const updateDevice = (index: number, field: keyof CreateDiagnosticDeviceData, value: string | number) => {
    const updatedDevices = [...devices];
    
    if (field === 'quantity') {
      const newQuantity = value as number;
      const currentSerials = updatedDevices[index].individual_serials || [];
      
      // Adjust individual_serials array based on new quantity
      if (newQuantity > currentSerials.length) {
        // Add empty serial entries
        const additionalSerials = Array(newQuantity - currentSerials.length).fill('');
        updatedDevices[index].individual_serials = [...currentSerials, ...additionalSerials];
      } else {
        // Trim excess serial entries
        updatedDevices[index].individual_serials = currentSerials.slice(0, newQuantity);
      }
    }
    
    updatedDevices[index] = {
      ...updatedDevices[index],
      [field]: value
    };
    
    setDevices(updatedDevices);
  };

  const updateIndividualSerial = (deviceIndex: number, serialIndex: number, serialValue: string) => {
    const updatedDevices = [...devices];
    const device = updatedDevices[deviceIndex];
    const individualSerials = [...(device.individual_serials || [])];
    individualSerials[serialIndex] = serialValue;
    
    updatedDevices[deviceIndex] = {
      ...device,
      individual_serials: individualSerials
    };
    
    setDevices(updatedDevices);
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (!deviceType) return <Package className="h-5 w-5" />;
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

  const getSelectedTemplate = (device: CreateDiagnosticDeviceData) => {
    if (device.template_id) {
      return templates.find(t => t.id === device.template_id);
    }
    // Auto-select based on device name
    const deviceType = getDeviceTypeFromName(device.device_name);
    return templates.find(t => t.device_type.toLowerCase() === deviceType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title for the diagnostic request');
      return;
    }

    if (devices.some(d => !d.device_name.trim())) {
      toast.error('Please enter device name for all devices');
      return;
    }

    setLoading(true);

    try {
      const data: CreateDiagnosticRequestData = {
        title: title.trim(),
        assigned_to: assignedTo || undefined,
        notes: notes.trim() || undefined,
        devices: devices.map(device => ({
          device_name: device.device_name.trim(),
          brand: device.brand?.trim(),
          serial_number: device.serial_number?.trim(),
          model: device.model?.trim(),
          notes: device.notes?.trim(),
          quantity: device.quantity || 1,
          individual_serials: device.individual_serials,
          template_id: device.template_id
        }))
      };

      const result = await createDiagnosticRequest(data);
      
      if (result) {
        navigate('/diagnostics/assigned');
      }
    } catch (error) {
      console.error('Error creating diagnostic request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <GlassButton
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </GlassButton>
          <h1 className="text-2xl font-bold text-gray-900">New Diagnostic Request</h1>
        </div>
        <p className="text-gray-600">
          Create a new diagnostic request for technicians to test devices
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard className="mb-6">
          {/* Request Information */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Request Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Office Equipment Diagnostic - March 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Technician
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select technician (optional)</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Devices Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Devices ({devices.length})
                </h3>
                <GlassButton
                  type="button"
                  onClick={addDevice}
                  className="flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Device
                </GlassButton>
              </div>
              
              <div className="space-y-4">
                {devices.map((device, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(getDeviceTypeFromName(device.device_name))}
                        <h3 className="font-medium text-gray-900">Device {index + 1}</h3>
                      </div>
                      {devices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDevice(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Device Name *
                        </label>
                        <input
                          type="text"
                          value={device.device_name}
                          onChange={(e) => updateDevice(index, 'device_name', e.target.value)}
                          placeholder="e.g., HP EliteBook 840 G8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={device.brand || ''}
                          onChange={(e) => updateDevice(index, 'brand', e.target.value)}
                          placeholder="e.g., HP"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model
                        </label>
                        <input
                          type="text"
                          value={device.model || ''}
                          onChange={(e) => updateDevice(index, 'model', e.target.value)}
                          placeholder="e.g., EliteBook 840 G8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={device.quantity || 1}
                          onChange={(e) => updateDevice(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {(device.quantity || 1) > 1 ? 'Base Serial Number (optional)' : 'Serial Number'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={device.serial_number || ''}
                            onChange={(e) => updateDevice(index, 'serial_number', e.target.value)}
                            placeholder={
                              (device.quantity || 1) > 1 
                                ? "e.g., CN12345678 (for reference only)" 
                                : "e.g., CN12345678"
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                      </div>

                      {/* Template Selection */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diagnostic Template
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {/* Auto-select option */}
                          <button
                            type="button"
                            onClick={() => updateDevice(index, 'template_id', '')}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              !device.template_id
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            Auto-Select
                          </button>

                          {/* Template options */}
                          {templates.map(template => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => updateDevice(index, 'template_id', template.id)}
                              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                device.template_id === template.id
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {template.device_type} ({template.checklist_items.length} tests)
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Template Preview */}
                      {device.device_name && (
                        <div className="md:col-span-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Diagnostic Tests Preview:
                          </h4>
                          {(() => {
                            const selectedTemplate = getSelectedTemplate(device);
                            if (selectedTemplate) {
                              return (
                                <div className="space-y-1">
                                  <p className="text-sm text-blue-800 mb-2">
                                    {selectedTemplate.device_type} Template ({selectedTemplate.checklist_items.length} tests)
                                  </p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {selectedTemplate.checklist_items.map((item, idx) => (
                                      <div key={idx} className="text-xs text-blue-700">
                                        • {item.name}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <p className="text-sm text-blue-700">
                                  No template found for "{getDeviceTypeFromName(device.device_name)}"
                                </p>
                              );
                            }
                          })()}
                        </div>
                      )}

                      {/* Individual serial number inputs when quantity > 1 */}
                      {(device.quantity || 1) > 1 && (
                        <div className="md:col-span-2 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h4 className="text-sm font-medium text-yellow-900 mb-2">
                            Enter serial number for each device ({device.quantity} devices):
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Array.from({ length: device.quantity || 1 }, (_, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-yellow-700 font-medium">#{i + 1}</span>
                                <input
                                  type="text"
                                  value={device.individual_serials?.[i] || ''}
                                  onChange={(e) => updateIndividualSerial(index, i, e.target.value)}
                                  placeholder={`Serial #${i + 1}`}
                                  className="flex-1 px-2 py-1 text-sm border border-yellow-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Device Notes */}
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => setDeviceNotesExpanded(prev => ({ ...prev, [index]: !prev[index] }))}
                          className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700">Device Notes</span>
                          {deviceNotesExpanded[index] ? (
                            <ChevronUp size={16} className="text-gray-600" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-600" />
                          )}
                        </button>
                        
                        {deviceNotesExpanded[index] && (
                          <div className="mt-2">
                            <textarea
                              value={device.notes || ''}
                              onChange={(e) => updateDevice(index, 'notes', e.target.value)}
                              placeholder="e.g., Won't turn on, screen flickering"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Notes */}
            <div>
              <button
                type="button"
                onClick={() => setNotesExpanded(!notesExpanded)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  General Notes
                </h3>
                {notesExpanded ? (
                  <ChevronUp size={20} className="text-gray-600" />
                ) : (
                  <ChevronDown size={20} className="text-gray-600" />
                )}
              </button>
              
              {notesExpanded && (
                <div className="mt-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any general notes about this diagnostic request..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <GlassButton
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save size={20} />
            )}
            {loading ? 'Creating...' : 'Create Diagnostic Request'}
          </GlassButton>
        </div>
      </form>
    </div>
  );
};

export default NewDiagnosticRequestPage;