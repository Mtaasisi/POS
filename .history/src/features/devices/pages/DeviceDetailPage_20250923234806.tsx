import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Smartphone, Edit, Save, X, AlertCircle, 
  FileText, Clock, Send,
  DollarSign, Printer, Download,
  User, 
  BarChart3, History, Info, 
  Layers, 
  FileImage, CheckCircle2, 
  Zap, CreditCard, 
  ArrowLeft, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import StatusBadge from '../../../features/shared/components/ui/StatusBadge';
import StatusUpdateForm from '../components/forms/StatusUpdateForm';
import { Device, DeviceStatus, User as UserType } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface DeviceDetailPageProps {
  editMode?: boolean;
}

const DeviceDetailPage: React.FC<DeviceDetailPageProps> = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  
  // Context hooks
  const { 
    getDeviceById,
    updateDeviceStatus,
    addDeviceRemark
  } = useDevices();
  const { getCustomerById } = useCustomers();
  const { payments } = usePayments();

  // Local state
  const [device, setDevice] = useState<Device | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(editMode);
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState('overview');
  
  // Load device data
  useEffect(() => {
    const loadDeviceData = async () => {
      if (!id) return;
      
      setIsLoadingDevice(true);
      try {
        const deviceData = await getDeviceById(id);
        if (deviceData) {
          setDevice(deviceData);
          
          // Load customer data if available
          if (deviceData.customerId) {
            const customerData = getCustomerById(deviceData.customerId);
            setCustomer(customerData);
          }
        } else {
          toast.error('Device not found');
          navigate('/devices');
        }
      } catch (error) {
        console.error('Error loading device:', error);
        toast.error('Failed to load device details');
        navigate('/devices');
      } finally {
        setIsLoadingDevice(false);
      }
    };

    loadDeviceData();
  }, [id, getDeviceById, getCustomerById, navigate]);

  // Handle status update
  const handleStatusUpdate = useCallback(async (status: DeviceStatus, fingerprint: string) => {
    if (!device || !currentUser) return;
    
    try {
      await updateDeviceStatus(device.id, status, currentUser.id, fingerprint);
      toast.success('Device status updated successfully');
      
      // Reload device data to get updated status
      const updatedDevice = await getDeviceById(device.id);
      if (updatedDevice) {
        setDevice(updatedDevice);
      }
    } catch (error) {
      console.error('Error updating device status:', error);
      toast.error('Failed to update device status');
    }
  }, [device, currentUser, updateDeviceStatus, getDeviceById]);

  // Handle adding remarks
  const handleAddRemark = useCallback(async (remark: string) => {
    if (!device || !currentUser) return;
    
    try {
      await addDeviceRemark(device.id, remark, currentUser.id);
      toast.success('Remark added successfully');
      
      // Reload device data to get updated remarks
      const updatedDevice = await getDeviceById(device.id);
      if (updatedDevice) {
        setDevice(updatedDevice);
      }
    } catch (error) {
      console.error('Error adding remark:', error);
      toast.error('Failed to add remark');
    }
  }, [device, currentUser, addDeviceRemark, getDeviceById]);

  // Get device payments
  const devicePayments = payments?.filter(payment => 
    payment.device_id === device?.id
  ) || [];

  // Calculate outstanding amount
  const outstandingAmount = devicePayments.reduce((total, payment) => {
    return total + (payment.amount || 0);
  }, 0);

  if (isLoadingDevice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading device details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Not Found</h2>
            <p className="text-gray-600 mb-6">The device you're looking for doesn't exist or has been removed.</p>
            <GlassButton
              onClick={() => navigate('/devices')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Devices
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <GlassButton
                onClick={() => navigate('/devices')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </GlassButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {device.brand} {device.model}
                </h1>
                <p className="text-gray-600">Device ID: {device.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={device.status} />
              <GlassButton
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "secondary" : "primary"}
                className="flex items-center gap-2"
              >
                <Edit size={16} />
                {isEditing ? 'Cancel' : 'Edit'}
              </GlassButton>
            </div>
          </div>

          {/* Device Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Device Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Brand:</span> {device.brand}</p>
                <p><span className="font-medium">Model:</span> {device.model}</p>
                <p><span className="font-medium">IMEI:</span> {device.imei || 'N/A'}</p>
                <p><span className="font-medium">Serial:</span> {device.serialNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Customer Information</h3>
              {customer ? (
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {customer.name}</p>
                  <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                  <p><span className="font-medium">Email:</span> {customer.email || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No customer information available</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Status & Progress</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Status:</span> <StatusBadge status={device.status} /></p>
                <p><span className="font-medium">Assigned To:</span> {device.assignedTo || 'Unassigned'}</p>
                <p><span className="font-medium">Created:</span> {new Date(device.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: <Eye size={16} /> },
                { id: 'status', label: 'Status & Actions', icon: <CheckCircle2 size={16} /> },
                { id: 'history', label: 'History', icon: <History size={16} /> },
                { id: 'payments', label: 'Payments', icon: <CreditCard size={16} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Device Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Purchase Type:</span> {device.purchaseType || 'N/A'}</p>
                      <p><span className="font-medium">Condition:</span> {device.condition || 'N/A'}</p>
                      <p><span className="font-medium">Color:</span> {device.color || 'N/A'}</p>
                      <p><span className="font-medium">Storage:</span> {device.storage || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Additional Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Accessories:</span> {device.accessories || 'None'}</p>
                      <p><span className="font-medium">Issues:</span> {device.issues || 'None reported'}</p>
                      <p><span className="font-medium">Notes:</span> {device.notes || 'No notes'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-6">
                <StatusUpdateForm
                  device={device}
                  currentUser={currentUser as UserType}
                  onUpdateStatus={handleStatusUpdate}
                  onAddRemark={handleAddRemark}
                  outstanding={outstandingAmount}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Device History</h3>
                {device.remarks && device.remarks.length > 0 ? (
                  <div className="space-y-3">
                    {device.remarks.map((remark, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Remark #{index + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(remark.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{remark.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No history available for this device.</p>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Payment Information</h3>
                {devicePayments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900">
                        Outstanding Amount: {formatCurrency(outstandingAmount)}
                      </p>
                    </div>
                    {devicePayments.map((payment, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-600">Method: {payment.method}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">{payment.reference || 'No reference'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No payments recorded for this device.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailPage;
