import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { X, Save, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  hours: number;
  notes?: string;
}

interface AttendanceModalProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (attendance: Attendance) => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  employees,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Attendance>>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'present',
    hours: 0,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        checkIn: '',
        checkOut: '',
        status: 'present',
        hours: 0,
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.checkIn) {
      newErrors.checkIn = 'Check-in time is required';
    }

    if (formData.status === 'present' && !formData.checkOut) {
      newErrors.checkOut = 'Check-out time is required for present status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
    if (!selectedEmployee) {
      toast.error('Selected employee not found');
      return;
    }

    const attendanceData: Attendance = {
      id: Date.now().toString(),
      employeeId: formData.employeeId!,
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      date: formData.date!,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      status: formData.status!,
      hours: formData.hours || 0,
      notes: formData.notes
    };

    onSave(attendanceData);
    onClose();
    toast.success('Attendance marked successfully');
  };

  const calculateHours = () => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(`2000-01-01T${formData.checkIn}`);
      const checkOut = new Date(`2000-01-01T${formData.checkOut}`);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      setFormData(prev => ({ ...prev, hours: Math.max(0, diffHours) }));
    }
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.id === formData.employeeId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
            </div>
            <GlassButton
              variant="ghost"
              onClick={onClose}
              icon={<X size={20} />}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <GlassSelect
                options={employees.map(emp => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName} - ${emp.position} (${emp.department})`
                }))}
                value={formData.employeeId}
                onChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                placeholder="Select employee"
              />
              {errors.employeeId && (
                <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <GlassSelect
                options={[
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'half-day', label: 'Half Day' }
                ]}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                placeholder="Select status"
              />
            </div>

            {/* Time Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check In Time *
                </label>
                <input
                  type="time"
                  value={formData.checkIn}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.checkIn ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.checkIn && (
                  <p className="text-red-500 text-sm mt-1">{errors.checkIn}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Out Time
                </label>
                <input
                  type="time"
                  value={formData.checkOut}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.checkOut ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.checkOut && (
                  <p className="text-red-500 text-sm mt-1">{errors.checkOut}</p>
                )}
              </div>
            </div>

            {/* Hours Calculation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: Number(e.target.value) }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
                <GlassButton
                  type="button"
                  onClick={calculateHours}
                  className="bg-blue-600 text-white"
                >
                  Calculate
                </GlassButton>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Employee Info Display */}
            {getSelectedEmployee() && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Employee Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {getSelectedEmployee()?.firstName} {getSelectedEmployee()?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-medium">{getSelectedEmployee()?.position}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{getSelectedEmployee()?.department}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <GlassButton
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                icon={<Save size={18} />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                Mark Attendance
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default AttendanceModal;
