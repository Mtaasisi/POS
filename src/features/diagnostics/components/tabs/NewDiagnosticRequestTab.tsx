import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { 
  createDiagnosticRequest, 
  getDiagnosticTemplates,
  getTechnicians 
} from '../../../../lib/diagnosticsApi';
import { 
  CreateDiagnosticRequestData, 
  CreateDiagnosticDeviceData,
  DiagnosticTemplate
} from '../../types/diagnostics';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { 
  Plus, 
  Trash2, 
  Save, 
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

const NewDiagnosticRequestTab: React.FC = () => {
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

  // Load technicians and templates
  useEffect(() => {
    const loadData = async () => {
      try {
        const [techData, templateData] = await Promise.all([
          getTechnicians(),
          getDiagnosticTemplates()
        ]);
        setTechnicians(techData);
        setTemplates(templateData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      }
    };
    loadData();
  }, []);

  // Check if user has permission
  if (!currentUser || !['admin', 'customer-care'].includes(currentUser.role)) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to create diagnostic requests.</p>
        </div>
      </GlassCard>
    );
  }

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

  const updateDevice = (index: number, field: keyof CreateDiagnosticDeviceData, value: any) => {
    const updatedDevices = [...devices];
    updatedDevices[index] = { ...updatedDevices[index], [field]: value };
    setDevices(updatedDevices);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for the diagnostic request');
      return;
    }

    if (!assignedTo) {
      toast.error('Please select a technician');
      return;
    }

    // Validate devices
    for (const device of devices) {
      if (!device.device_name.trim() || !device.brand.trim() || !device.model.trim()) {
        toast.error('Please fill in all required device fields');
        return;
      }
    }

    const requestData: CreateDiagnosticRequestData = {
      title: title.trim(),
      assigned_to: assignedTo,
      notes: notes.trim(),
      devices
    };

    setLoading(true);
    try {
      await createDiagnosticRequest(requestData);
      toast.success('Diagnostic request created successfully!');
      
      // Reset form
      setTitle('');
      setAssignedTo('');
      setNotes('');
      setDevices([{
        device_name: '',
        brand: '',
        serial_number: '',
        model: '',
        notes: '',
        quantity: 1,
        individual_serials: [],
        template_id: undefined
      }]);
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create diagnostic request');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return <Laptop className="w-5 h-5" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="w-5 h-5" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet className="w-5 h-5" />;
    if (name.includes('printer')) return <Printer className="w-5 h-5" />;
    if (name.includes('monitor') || name.includes('display')) return <Monitor className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Diagnostic Request</h2>
          <p className="text-gray-600">Create a new diagnostic request for devices</p>
        </div>
        <GlassButton
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Request'}
        </GlassButton>
      </div>

      {/* Request Details */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Technician *
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a technician...</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} ({tech.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional instructions or context..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </GlassCard>

      {/* Devices */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Devices ({devices.length})</h3>
          <GlassButton
            onClick={addDevice}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </GlassButton>
        </div>

        <div className="space-y-4">
          {devices.map((device, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getDeviceIcon(device.device_name)}
                  <span className="font-medium text-gray-900">
                    Device {index + 1}
                  </span>
                </div>
                {devices.length > 1 && (
                  <button
                    onClick={() => removeDevice(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    value={device.device_name}
                    onChange={(e) => updateDevice(index, 'device_name', e.target.value)}
                    placeholder="e.g., iPhone 13 Pro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={device.brand}
                    onChange={(e) => updateDevice(index, 'brand', e.target.value)}
                    placeholder="e.g., Apple"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={device.model}
                    onChange={(e) => updateDevice(index, 'model', e.target.value)}
                    placeholder="e.g., A2483"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={device.serial_number}
                    onChange={(e) => updateDevice(index, 'serial_number', e.target.value)}
                    placeholder="Device serial number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={device.quantity}
                    onChange={(e) => updateDevice(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select
                    value={device.template_id || ''}
                    onChange={(e) => updateDevice(index, 'template_id', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Notes
                </label>
                <textarea
                  value={device.notes}
                  onChange={(e) => updateDevice(index, 'notes', e.target.value)}
                  placeholder="Any specific issues or notes for this device..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default NewDiagnosticRequestTab;
