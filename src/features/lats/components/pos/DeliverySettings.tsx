// Delivery Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import DeliveryMethodsManager from './DeliveryMethodsManager';
import { Truck, MapPin, Clock, DollarSign, Settings, Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  isDefault: boolean;
  enabled: boolean;
}

interface DeliverySettings {
  // General Settings
  enabled: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  maxDeliveryDistance: number;
  
  // Delivery Methods
  deliveryMethods: DeliveryMethod[];
  
  // Delivery Areas
  deliveryAreas: Array<{
    id: string;
    name: string;
    fee: number;
    estimatedTime: string;
    enabled: boolean;
  }>;
  
  // Time Settings
  deliveryHours: {
    start: string;
    end: string;
  };
  sameDayDelivery: boolean;
  nextDayDelivery: boolean;
  deliveryTimeSlots: Array<{
    id: string;
    time: string;
    enabled: boolean;
  }>;
  
  // Notification Settings
  notifyCustomer: boolean;
  notifyDriver: boolean;
  sendSMS: boolean;
  sendEmail: boolean;
  
  // Driver Settings
  autoAssignDriver: boolean;
  driverCommission: number;
  requireSignature: boolean;
  
  // Advanced Settings
  allowScheduledDelivery: boolean;
  maxScheduledDays: number;
  requireAdvancePayment: boolean;
  allowPartialDelivery: boolean;
}

const DeliverySettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaFee, setNewAreaFee] = useState('');
  const [newAreaTime, setNewAreaTime] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue
  } = useForm<DeliverySettings>({
    defaultValues: {
      enabled: false,
      deliveryFee: 2000,
      freeDeliveryThreshold: 50000,
      maxDeliveryDistance: 50,
      deliveryMethods: [
        { id: '1', name: 'Standard Delivery', description: '2-3 business days', price: 500, estimatedTime: '2-3 days', isDefault: true, enabled: true },
        { id: '2', name: 'Express Delivery', description: '1-2 business days', price: 1000, estimatedTime: '1-2 days', isDefault: false, enabled: true },
        { id: '3', name: 'Same Day Delivery', description: 'Same day', price: 2000, estimatedTime: 'Same day', isDefault: false, enabled: true }
      ],
      deliveryAreas: [
        { id: '1', name: 'Dar es Salaam', fee: 2000, estimatedTime: '2-3 hours', enabled: true },
        { id: '2', name: 'Arusha', fee: 3000, estimatedTime: '3-4 hours', enabled: true },
        { id: '3', name: 'Mwanza', fee: 2500, estimatedTime: '2-3 hours', enabled: true },
        { id: '4', name: 'Dodoma', fee: 3500, estimatedTime: '4-5 hours', enabled: false }
      ],
      deliveryHours: {
        start: '08:00',
        end: '18:00'
      },
      sameDayDelivery: true,
      nextDayDelivery: true,
      deliveryTimeSlots: [
        { id: '1', time: '09:00 - 12:00', enabled: true },
        { id: '2', time: '12:00 - 15:00', enabled: true },
        { id: '3', time: '15:00 - 18:00', enabled: true },
        { id: '4', time: '18:00 - 21:00', enabled: false }
      ],
      notifyCustomer: true,
      notifyDriver: true,
      sendSMS: true,
      sendEmail: false,
      autoAssignDriver: true,
      driverCommission: 10,
      requireSignature: true,
      allowScheduledDelivery: false,
      maxScheduledDays: 7,
      requireAdvancePayment: false,
      allowPartialDelivery: false
    }
  });

  const watchedValues = watch();

  // Load current settings
  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-delivery-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading delivery settings:', error);
      toast.error('Failed to load delivery settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async (data: DeliverySettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-delivery-settings', JSON.stringify(data));
      toast.success('Delivery settings saved successfully');
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast.error('Failed to save delivery settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Add new delivery area
  const handleAddDeliveryArea = () => {
    if (!newAreaName.trim() || !newAreaFee.trim() || !newAreaTime.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const newArea = {
      id: Date.now().toString(),
      name: newAreaName.trim(),
      fee: parseFloat(newAreaFee),
      estimatedTime: newAreaTime.trim(),
      enabled: true
    };

    setValue('deliveryAreas', [...watchedValues.deliveryAreas, newArea]);
    setNewAreaName('');
    setNewAreaFee('');
    setNewAreaTime('');
    toast.success('Delivery area added successfully');
  };

  // Remove delivery area
  const handleRemoveDeliveryArea = (areaId: string) => {
    const updatedAreas = watchedValues.deliveryAreas.filter(area => area.id !== areaId);
    setValue('deliveryAreas', updatedAreas);
    toast.success('Delivery area removed successfully');
  };

  // Toggle delivery area
  const handleToggleDeliveryArea = (areaId: string) => {
    const updatedAreas = watchedValues.deliveryAreas.map(area =>
      area.id === areaId ? { ...area, enabled: !area.enabled } : area
    );
    setValue('deliveryAreas', updatedAreas);
  };

  // Toggle time slot
  const handleToggleTimeSlot = (slotId: string) => {
    const updatedSlots = watchedValues.deliveryTimeSlots.map(slot =>
      slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot
    );
    setValue('deliveryTimeSlots', updatedSlots);
  };

  // Handle delivery methods change
  const handleDeliveryMethodsChange = (methods: DeliveryMethod[]) => {
    setValue('deliveryMethods', methods);
  };

  // Reset to defaults
  const handleReset = () => {
    reset({
      enabled: false,
      deliveryFee: 2000,
      freeDeliveryThreshold: 50000,
      maxDeliveryDistance: 50,
      deliveryMethods: [
        { id: '1', name: 'Standard Delivery', description: '2-3 business days', price: 500, estimatedTime: '2-3 days', isDefault: true, enabled: true },
        { id: '2', name: 'Express Delivery', description: '1-2 business days', price: 1000, estimatedTime: '1-2 days', isDefault: false, enabled: true },
        { id: '3', name: 'Same Day Delivery', description: 'Same day', price: 2000, estimatedTime: 'Same day', isDefault: false, enabled: true }
      ],
      deliveryAreas: [
        { id: '1', name: 'Dar es Salaam', fee: 2000, estimatedTime: '2-3 hours', enabled: true },
        { id: '2', name: 'Arusha', fee: 3000, estimatedTime: '3-4 hours', enabled: true },
        { id: '3', name: 'Mwanza', fee: 2500, estimatedTime: '2-3 hours', enabled: true },
        { id: '4', name: 'Dodoma', fee: 3500, estimatedTime: '4-5 hours', enabled: false }
      ],
      deliveryHours: {
        start: '08:00',
        end: '18:00'
      },
      sameDayDelivery: true,
      nextDayDelivery: true,
      deliveryTimeSlots: [
        { id: '1', time: '09:00 - 12:00', enabled: true },
        { id: '2', time: '12:00 - 15:00', enabled: true },
        { id: '3', time: '15:00 - 18:00', enabled: true },
        { id: '4', time: '18:00 - 21:00', enabled: false }
      ],
      notifyCustomer: true,
      notifyDriver: true,
      sendSMS: true,
      sendEmail: false,
      autoAssignDriver: true,
      driverCommission: 10,
      requireSignature: true,
      allowScheduledDelivery: false,
      maxScheduledDays: 7,
      requireAdvancePayment: false,
      allowPartialDelivery: false
    });
    toast.success('Delivery settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading delivery settings...</span>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Truck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Delivery Settings</h2>
          <p className="text-sm text-gray-600">Configure delivery options and areas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enable Delivery</div>
                <div className="text-sm text-gray-600">Enable delivery service</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Delivery Fee (TZS)</label>
              <input
                type="number"
                {...register('deliveryFee', { min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Free Delivery Threshold (TZS)</label>
              <input
                type="number"
                {...register('freeDeliveryThreshold', { min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Orders above this amount get free delivery</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Delivery Distance (km)</label>
              <input
                type="number"
                {...register('maxDeliveryDistance', { min: 1, max: 200 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="200"
              />
            </div>
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Delivery Methods
          </h3>
          
          <DeliveryMethodsManager
            methods={watchedValues.deliveryMethods}
            onMethodsChange={handleDeliveryMethodsChange}
          />
        </div>

        {/* Delivery Areas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Areas
          </h3>
          
          {/* Add New Area */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Add New Delivery Area</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Area Name"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Delivery Fee (TZS)"
                value={newAreaFee}
                onChange={(e) => setNewAreaFee(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Estimated Time (e.g., 2-3 hours)"
                value={newAreaTime}
                onChange={(e) => setNewAreaTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <GlassButton
                type="button"
                onClick={handleAddDeliveryArea}
                variant="secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Area
              </GlassButton>
            </div>
          </div>

          {/* Existing Areas */}
          <div className="space-y-3">
            {watchedValues.deliveryAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={area.enabled}
                      onChange={() => handleToggleDeliveryArea(area.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <div>
                    <div className="font-medium text-gray-900">{area.name}</div>
                    <div className="text-sm text-gray-600">
                      Fee: TZS {area.fee.toLocaleString()} | Time: {area.estimatedTime}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDeliveryArea(area.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Time Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Hours Start</label>
              <input
                type="time"
                {...register('deliveryHours.start')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Hours End</label>
              <input
                type="time"
                {...register('deliveryHours.end')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Same Day Delivery</div>
                <div className="text-sm text-gray-600">Allow same day delivery</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('sameDayDelivery')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Next Day Delivery</div>
                <div className="text-sm text-gray-600">Allow next day delivery</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('nextDayDelivery')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Delivery Time Slots</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {watchedValues.deliveryTimeSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={() => handleToggleTimeSlot(slot.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className="font-medium text-gray-900">{slot.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Notify Customer</div>
                <div className="text-sm text-gray-600">Send delivery updates to customer</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('notifyCustomer')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Notify Driver</div>
                <div className="text-sm text-gray-600">Send delivery assignments to driver</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('notifyDriver')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Send SMS</div>
                <div className="text-sm text-gray-600">Send SMS notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('sendSMS')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Send Email</div>
                <div className="text-sm text-gray-600">Send email notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('sendEmail')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Driver Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Driver Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Assign Driver</div>
                <div className="text-sm text-gray-600">Automatically assign drivers to deliveries</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoAssignDriver')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver Commission (%)</label>
              <input
                type="number"
                {...register('driverCommission', { min: 0, max: 50 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="50"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage of delivery fee for driver</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Require Signature</div>
                <div className="text-sm text-gray-600">Require customer signature on delivery</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requireSignature')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Scheduled Delivery</div>
                <div className="text-sm text-gray-600">Allow customers to schedule deliveries</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('allowScheduledDelivery')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Scheduled Days</label>
              <input
                type="number"
                {...register('maxScheduledDays', { min: 1, max: 30 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="30"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum days in advance for scheduling</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Advance Payment</div>
                <div className="text-sm text-gray-600">Require payment before delivery</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requireAdvancePayment')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Partial Delivery</div>
                <div className="text-sm text-gray-600">Allow partial order delivery</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('allowPartialDelivery')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions - Save button removed, will use unified save button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <GlassButton
              type="button"
              onClick={handleReset}
              variant="secondary"
            >
              Reset to Defaults
            </GlassButton>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 italic">
              Settings will be saved using the unified save button
            </div>
          </div>
        </div>
      </form>
    </GlassCard>
  );
};

export default DeliverySettings;
