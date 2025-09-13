import React, { useState, useEffect } from 'react';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import GlassTextarea from '../../shared/components/ui/GlassTextarea';
import GlassCheckbox from '../../shared/components/ui/GlassCheckbox';
import { 
  StoreLocation, 
  CreateStoreLocationData, 
  UpdateStoreLocationData 
} from '../types/storeLocation';

interface StoreLocationFormProps {
  location?: StoreLocation;
  onSubmit: (data: CreateStoreLocationData | UpdateStoreLocationData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const defaultOpeningHours = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '09:00', close: '17:00' },
  sunday: { open: '10:00', close: '16:00' }
};

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const timeSlots = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

export const StoreLocationForm: React.FC<StoreLocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateStoreLocationData>({
    name: '',
    code: '',
    description: '',
    address: '',
    city: '',
    region: '',
    country: 'Tanzania',
    postal_code: '',
    phone: '',
    email: '',
    whatsapp: '',
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    opening_hours: defaultOpeningHours,
    is_24_hours: false,
    has_parking: false,
    has_wifi: false,
    has_repair_service: true,
    has_sales_service: true,
    has_delivery_service: false,
    store_size_sqm: undefined,
    max_capacity: undefined,
    current_staff_count: 0,
    is_active: true,
    is_main_branch: false,
    priority_order: 0,
    monthly_rent: undefined,
    utilities_cost: undefined,
    monthly_target: undefined,
    notes: '',
    images: []
  });

  const [openingHours, setOpeningHours] = useState(defaultOpeningHours);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        code: location.code,
        description: location.description || '',
        address: location.address,
        city: location.city,
        region: location.region || '',
        country: location.country,
        postal_code: location.postal_code || '',
        phone: location.phone || '',
        email: location.email || '',
        whatsapp: location.whatsapp || '',
        manager_name: location.manager_name || '',
        manager_phone: location.manager_phone || '',
        manager_email: location.manager_email || '',
        opening_hours: location.opening_hours,
        is_24_hours: location.is_24_hours,
        has_parking: location.has_parking,
        has_wifi: location.has_wifi,
        has_repair_service: location.has_repair_service,
        has_sales_service: location.has_sales_service,
        has_delivery_service: location.has_delivery_service,
        store_size_sqm: location.store_size_sqm,
        max_capacity: location.max_capacity,
        current_staff_count: location.current_staff_count,
        is_active: location.is_active,
        is_main_branch: location.is_main_branch,
        priority_order: location.priority_order,
        monthly_rent: location.monthly_rent,
        utilities_cost: location.utilities_cost,
        monthly_target: location.monthly_target,
        notes: location.notes || '',
        images: location.images
      });
      setOpeningHours(location.opening_hours);
    }
  }, [location]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOpeningHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    const newHours = {
      ...openingHours,
      [day]: {
        ...openingHours[day as keyof typeof openingHours],
        [field]: value
      }
    };
    setOpeningHours(newHours);
    setFormData(prev => ({ ...prev, opening_hours: newHours }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9]{2,10}$/.test(formData.code)) {
      newErrors.code = 'Code must be 2-10 characters, uppercase letters and numbers only';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.manager_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.manager_email)) {
      newErrors.manager_email = 'Invalid manager email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        ...formData,
        opening_hours: openingHours
      };

      if (location) {
        await onSubmit({ ...submitData, id: location.id } as UpdateStoreLocationData);
      } else {
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <GlassInput
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Store Name"
                error={errors.name}
                label="Name *"
              />
            </div>

            <div>
              <GlassInput
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="ST001"
                error={errors.code}
                label="Code *"
              />
            </div>

            <div>
              <GlassTextarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Store description"
                rows={3}
                label="Description"
              />
            </div>

            <GlassCheckbox
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              label="Active Location"
            />

            <GlassCheckbox
              checked={formData.is_main_branch}
              onChange={(e) => handleInputChange('is_main_branch', e.target.checked)}
              label="Main Branch"
            />
          </div>
        </GlassCard>

        {/* Location Details */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Location Details</h3>
          <div className="space-y-4">
            <div>
              <GlassTextarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Full address"
                rows={2}
                error={errors.address}
                label="Address *"
              />
            </div>

            <div>
              <GlassInput
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                error={errors.city}
                label="City *"
              />
            </div>

            <div>
              <GlassInput
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                placeholder="Region"
                label="Region"
              />
            </div>

            <div>
              <GlassInput
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Country"
                label="Country"
              />
            </div>

            <div>
              <GlassInput
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="Postal code"
                label="Postal Code"
              />
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <GlassInput
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Phone number"
                label="Phone"
              />
            </div>

            <div>
              <GlassInput
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email address"
                error={errors.email}
                label="Email"
              />
            </div>

            <div>
              <GlassInput
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="WhatsApp number"
                label="WhatsApp"
              />
            </div>
          </div>
        </GlassCard>

        {/* Manager Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Manager Information</h3>
          <div className="space-y-4">
            <div>
              <GlassInput
                value={formData.manager_name}
                onChange={(e) => handleInputChange('manager_name', e.target.value)}
                placeholder="Manager name"
                label="Manager Name"
              />
            </div>

            <div>
              <GlassInput
                value={formData.manager_phone}
                onChange={(e) => handleInputChange('manager_phone', e.target.value)}
                placeholder="Manager phone"
                label="Manager Phone"
              />
            </div>

            <div>
              <GlassInput
                value={formData.manager_email}
                onChange={(e) => handleInputChange('manager_email', e.target.value)}
                placeholder="Manager email"
                error={errors.manager_email}
                label="Manager Email"
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Operating Hours */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Operating Hours</h3>
          <GlassCheckbox
            checked={formData.is_24_hours}
            onChange={(e) => handleInputChange('is_24_hours', e.target.checked)}
            label="24 Hours"
          />
        </div>

        {!formData.is_24_hours && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daysOfWeek.map((day) => (
              <div key={day.key} className="border rounded-lg p-3">
                <label className="block text-sm font-medium mb-2">{day.label}</label>
                <div className="grid grid-cols-2 gap-2">
                  <GlassSelect
                    value={openingHours[day.key as keyof typeof openingHours]?.open || '08:00'}
                    onChange={(value) => handleOpeningHoursChange(day.key, 'open', value)}
                    options={timeSlots.map(time => ({ value: time, label: time }))}
                    placeholder="Select time"
                  />
                  <GlassSelect
                    value={openingHours[day.key as keyof typeof openingHours]?.close || '18:00'}
                    onChange={(value) => handleOpeningHoursChange(day.key, 'close', value)}
                    options={timeSlots.map(time => ({ value: time, label: time }))}
                    placeholder="Select time"
                  />
                </div>
              </div>
            ))}
                      </div>
          )}
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Features */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Store Features</h3>
          <div className="space-y-3">
            <GlassCheckbox
              checked={formData.has_parking}
              onChange={(e) => handleInputChange('has_parking', e.target.checked)}
              label="Has Parking"
            />

            <GlassCheckbox
              checked={formData.has_wifi}
              onChange={(e) => handleInputChange('has_wifi', e.target.checked)}
              label="Has WiFi"
            />

            <GlassCheckbox
              checked={formData.has_repair_service}
              onChange={(e) => handleInputChange('has_repair_service', e.target.checked)}
              label="Repair Service"
            />

            <GlassCheckbox
              checked={formData.has_sales_service}
              onChange={(e) => handleInputChange('has_sales_service', e.target.checked)}
              label="Sales Service"
            />

            <GlassCheckbox
              checked={formData.has_delivery_service}
              onChange={(e) => handleInputChange('has_delivery_service', e.target.checked)}
              label="Delivery Service"
                          />
            </div>
          </GlassCard>

          {/* Capacity & Financial */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Capacity & Financial</h3>
          <div className="space-y-4">
            <div>
              <GlassInput
                type="number"
                value={formData.store_size_sqm || ''}
                onChange={(e) => handleInputChange('store_size_sqm', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Store size"
                label="Store Size (sqm)"
              />
            </div>

            <div>
              <GlassInput
                type="number"
                value={formData.max_capacity || ''}
                onChange={(e) => handleInputChange('max_capacity', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Maximum capacity"
                label="Max Capacity"
              />
            </div>

            <div>
              <GlassInput
                type="number"
                value={formData.current_staff_count}
                onChange={(e) => handleInputChange('current_staff_count', Number(e.target.value))}
                placeholder="Staff count"
                label="Current Staff Count"
              />
            </div>

            <div>
              <GlassInput
                type="number"
                value={formData.priority_order}
                onChange={(e) => handleInputChange('priority_order', Number(e.target.value))}
                placeholder="Priority order"
                label="Priority Order"
              />
            </div>

            <div>
              <GlassInput
                type="number"
                value={formData.monthly_rent || ''}
                onChange={(e) => handleInputChange('monthly_rent', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Monthly rent"
                label="Monthly Rent (TZS)"
              />
            </div>

            <div>
              <GlassInput
                type="number"
                value={formData.utilities_cost || ''}
                onChange={(e) => handleInputChange('utilities_cost', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Utilities cost"
                label="Utilities Cost (TZS)"
              />
            </div>

            <div>
              <GlassInput
                type="number"
                value={formData.monthly_target || ''}
                onChange={(e) => handleInputChange('monthly_target', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Monthly target"
                label="Monthly Target (TZS)"
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Notes */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
        <GlassTextarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Additional notes about this location"
          rows={4}
        />
      </GlassCard>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <GlassButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </GlassButton>
        <GlassButton
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
        </GlassButton>
      </div>
    </form>
  );
};
