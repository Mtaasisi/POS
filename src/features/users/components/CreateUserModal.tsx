import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassInput from '../../../shared/components/ui/GlassInput';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import { 
  User, Mail, Phone, Shield, Eye, EyeOff, X, Save, UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Validation schema
const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'technician', 'customer-care', 'user']),
  department: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateUserData = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => Promise<void>;
  loading?: boolean;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
      department: '',
      password: '',
      confirmPassword: ''
    }
  });

  const watchedValues = watch();

  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'manager', label: 'Manager', description: 'Department management' },
    { value: 'technician', label: 'Technician', description: 'Device diagnostics' },
    { value: 'customer-care', label: 'Customer Care', description: 'Customer support' },
    { value: 'user', label: 'User', description: 'Basic access' }
  ];

  // Department options
  const departmentOptions = [
    { value: 'IT', label: 'IT Department' },
    { value: 'Sales', label: 'Sales Department' },
    { value: 'Service', label: 'Service Department' },
    { value: 'Support', label: 'Support Department' },
    { value: 'Marketing', label: 'Marketing Department' },
    { value: 'Finance', label: 'Finance Department' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'Operations', label: 'Operations' }
  ];

  // Handle form submission
  const handleFormSubmit = async (data: CreateUserData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('User creation error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
        reset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Get role description
  const getRoleDescription = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption?.description || '';
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <GlassCard 
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New User
                </h2>
                <p className="text-sm text-gray-500">
                  Add a new user to the system
                </p>
              </div>
            </div>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              icon={<X size={20} />}
            />
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">User Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="First Name"
                    placeholder="Enter first name"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.firstName?.message}
                    required
                    icon={<User size={16} />}
                  />
                )}
              />

              {/* Last Name */}
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Last Name"
                    placeholder="Enter last name"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.lastName?.message}
                    required
                    icon={<User size={16} />}
                  />
                )}
              />
            </div>

            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Email Address"
                  type="email"
                  placeholder="user@company.com"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.email?.message}
                  required
                  icon={<Mail size={16} />}
                />
              )}
            />

            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Phone Number"
                  type="tel"
                  placeholder="+255 123 456 789"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                  icon={<Phone size={16} />}
                />
              )}
            />
          </div>

          {/* Role and Department */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Role & Department</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role */}
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    label="Role"
                    placeholder="Select role"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.role?.message}
                    options={roleOptions}
                    required
                    icon={<Shield size={16} />}
                  />
                )}
              />

              {/* Department */}
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    label="Department"
                    placeholder="Select department"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.department?.message}
                    options={departmentOptions}
                    clearable
                  />
                )}
              />
            </div>

            {/* Role Description */}
            {watchedValues.role && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Role Description:</strong> {getRoleDescription(watchedValues.role)}
                </p>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Password</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.password?.message}
                    required
                    icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    onIconClick={() => setShowPassword(!showPassword)}
                    helperText="Minimum 8 characters"
                  />
                )}
              />

              {/* Confirm Password */}
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.confirmPassword?.message}
                    required
                    icon={showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                )}
              />
            </div>

            {/* Password Requirements */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Minimum 8 characters</li>
                <li>• Should include uppercase and lowercase letters</li>
                <li>• Should include numbers</li>
                <li>• Should include special characters</li>
              </ul>
            </div>
          </div>

          {/* User Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">User Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Name:</p>
                <p className="font-medium text-gray-900">
                  {watchedValues.firstName} {watchedValues.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-medium text-gray-900">{watchedValues.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-600">Role:</p>
                <p className="font-medium text-gray-900">
                  {roleOptions.find(r => r.value === watchedValues.role)?.label || 'Not selected'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Department:</p>
                <p className="font-medium text-gray-900">
                  {watchedValues.department || 'Not assigned'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-gray-200">
            <GlassButton
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!isDirty}
              className="w-full py-4 text-lg font-semibold"
              icon={<Save size={20} />}
            >
              {loading ? 'Creating User...' : 'Create User'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default CreateUserModal;
