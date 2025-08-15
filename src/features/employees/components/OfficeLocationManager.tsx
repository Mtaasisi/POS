import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { MapPin, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { OfficeConfig, mainOffice, branchOffices, getAllOfficeConfigs } from '../config/officeConfig';

interface OfficeLocationManagerProps {
  onLocationUpdate?: (config: OfficeConfig) => void;
}

const OfficeLocationManager: React.FC<OfficeLocationManagerProps> = ({ onLocationUpdate }) => {
  const [offices, setOffices] = useState<OfficeConfig[]>(getAllOfficeConfigs());
  const [editingOffice, setEditingOffice] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lng: '',
    radius: '100',
    address: '',
    ssid: '',
    description: ''
  });

  const handleEdit = (officeName: string) => {
    const office = offices.find(o => o.location.name === officeName);
    if (office) {
      setFormData({
        name: office.location.name,
        lat: office.location.lat.toString(),
        lng: office.location.lng.toString(),
        radius: office.location.radius.toString(),
        address: office.location.address,
        ssid: office.networks[0]?.ssid || '',
        description: office.networks[0]?.description || ''
      });
      setEditingOffice(officeName);
    }
  };

  const handleSave = () => {
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const radius = parseInt(formData.radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      toast.error('Please enter valid coordinates and radius');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180');
      return;
    }

    const updatedOffice: OfficeConfig = {
      location: {
        lat,
        lng,
        radius,
        address: formData.address,
        name: formData.name
      },
      networks: [
        {
          ssid: formData.ssid,
          description: formData.description
        }
      ]
    };

    const updatedOffices = offices.map(office => 
      office.location.name === editingOffice ? updatedOffice : office
    );

    setOffices(updatedOffices);
    setEditingOffice(null);
    setFormData({
      name: '',
      lat: '',
      lng: '',
      radius: '100',
      address: '',
      ssid: '',
      description: ''
    });

    toast.success('Office location updated successfully');
    
    if (onLocationUpdate) {
      onLocationUpdate(updatedOffice);
    }
  };

  const handleAdd = () => {
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const radius = parseInt(formData.radius);

    if (!formData.name || isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    const newOffice: OfficeConfig = {
      location: {
        lat,
        lng,
        radius,
        address: formData.address,
        name: formData.name
      },
      networks: [
        {
          ssid: formData.ssid,
          description: formData.description
        }
      ]
    };

    setOffices([...offices, newOffice]);
    setShowAddForm(false);
    setFormData({
      name: '',
      lat: '',
      lng: '',
      radius: '100',
      address: '',
      ssid: '',
      description: ''
    });

    toast.success('New office location added successfully');
  };

  const handleDelete = (officeName: string) => {
    if (officeName === mainOffice.location.name) {
      toast.error('Cannot delete the main office');
      return;
    }

    const updatedOffices = offices.filter(office => office.location.name !== officeName);
    setOffices(updatedOffices);
    toast.success('Office location deleted successfully');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          }));
          toast.success('Current location captured');
        },
        (error) => {
          toast.error('Failed to get current location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Office Location Manager</h3>
          </div>
          <GlassButton
            onClick={() => setShowAddForm(true)}
            icon={<Plus size={16} />}
            className="bg-green-600 text-white"
          >
            Add Office
          </GlassButton>
        </div>

        {/* Add New Office Form */}
        {showAddForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-3">Add New Office</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Main Office"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street, City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="-3.359178"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="36.661366"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meters)</label>
                <input
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WiFi SSID</label>
                <input
                  type="text"
                  value={formData.ssid}
                  onChange={(e) => setFormData(prev => ({ ...prev, ssid: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Office_WiFi"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Main office WiFi network"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <GlassButton
                onClick={getCurrentLocation}
                className="bg-blue-600 text-white"
              >
                Use Current Location
              </GlassButton>
              <GlassButton
                onClick={handleAdd}
                icon={<Save size={16} />}
                className="bg-green-600 text-white"
              >
                Add Office
              </GlassButton>
              <GlassButton
                onClick={() => setShowAddForm(false)}
                icon={<X size={16} />}
                variant="ghost"
                className="text-gray-600"
              >
                Cancel
              </GlassButton>
            </div>
          </div>
        )}

        {/* Office List */}
        <div className="space-y-4">
          {offices.map((office) => (
            <div key={office.location.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{office.location.name}</h4>
                  <p className="text-sm text-gray-600">{office.location.address}</p>
                </div>
                <div className="flex gap-2">
                  {editingOffice === office.location.name ? (
                    <>
                      <GlassButton
                        onClick={handleSave}
                        icon={<Save size={16} />}
                        className="bg-green-600 text-white"
                      >
                        Save
                      </GlassButton>
                      <GlassButton
                        onClick={() => setEditingOffice(null)}
                        icon={<X size={16} />}
                        variant="ghost"
                        className="text-gray-600"
                      >
                        Cancel
                      </GlassButton>
                    </>
                  ) : (
                    <>
                      <GlassButton
                        onClick={() => handleEdit(office.location.name)}
                        icon={<Edit size={16} />}
                        variant="ghost"
                        className="text-gray-600"
                      >
                        Edit
                      </GlassButton>
                      {office.location.name !== mainOffice.location.name && (
                        <GlassButton
                          onClick={() => handleDelete(office.location.name)}
                          icon={<Trash2 size={16} />}
                          variant="ghost"
                          className="text-red-600"
                        >
                          Delete
                        </GlassButton>
                      )}
                    </>
                  )}
                </div>
              </div>

              {editingOffice === office.location.name ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (m)</label>
                    <input
                      type="number"
                      value={formData.radius}
                      onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Coordinates:</span>
                    <p className="font-mono">{office.location.lat}, {office.location.lng}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Radius:</span>
                    <p>{office.location.radius}m</p>
                  </div>
                  <div>
                    <span className="text-gray-500">WiFi Networks:</span>
                    <p>{office.networks.length} network(s)</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default OfficeLocationManager;
