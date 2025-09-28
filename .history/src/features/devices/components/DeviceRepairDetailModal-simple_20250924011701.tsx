import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../lib/customerApi';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createRepairPart, getRepairParts, RepairPart, acceptSpareParts, rejectSpareParts, areAllSparePartsReady } from '../../lats/lib/sparePartsApi';
import { validateRepairStart } from '../../../utils/repairValidation';
import { validateDeviceHandover, createPendingPayments } from '../../../utils/paymentValidation';

// Icons
import { 
  X, Smartphone, User as UserIcon, Clock, CheckCircle, AlertTriangle, 
  Wrench, Stethoscope, Send, Printer, Upload,
  History, Timer, Target, CheckSquare, MessageSquare, 
  Edit, Trash2, Eye, Download, Phone, Mail, MapPin,
  Calendar, Package, FileText, Settings,
  Info, Building, Activity, BarChart3, MessageCircle, Zap,
  Shield, Search, AlertCircle, ExternalLink, XCircle
} from 'lucide-react';

// Components
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import CustomerDetailModal from '../../customers/components/CustomerDetailModal';
import DiagnosticChecklistModal from './DiagnosticChecklistModal';

interface DeviceRepairDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

const DeviceRepairDetailModal: React.FC<DeviceRepairDetailModalProps> = ({
  isOpen,
  onClose,
  deviceId
}) => {
  const { currentUser } = useAuth();
  const { devices, getDeviceById, updateDeviceStatus } = useDevices();
  const { customers } = useCustomers();
  const navigate = useNavigate();

  // Get device from context (real-time updates)
  const device = devices.find(d => d.id === deviceId) || null;
  
  // Device data updates are handled automatically by the context
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  
  // Component state
  const [countdown, setCountdown] = useState<string>('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Spare parts state
  const [repairParts, setRepairParts] = useState<RepairPart[]>([]);
  const [repairPartsLoading, setRepairPartsLoading] = useState(false);
  const [showSparePartsSelector, setShowSparePartsSelector] = useState(false);
  
  // Spare parts actions state
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partsActionLoading, setPartsActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Financial information state
  const [financialInfo, setFinancialInfo] = useState<{
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
  } | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  
  // Device costs state - extracted from device object
  const [deviceCosts, setDeviceCosts] = useState<{
    repairCost: number;
    depositAmount: number;
  } | null>(null);
  
  // Diagnostic checklist state
  const [showDiagnosticChecklist, setShowDiagnosticChecklist] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  if (!isOpen || !device) return null;

  const modalContent = createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Device Information</h4>
                <p><strong>Brand:</strong> {device.brand}</p>
                <p><strong>Model:</strong> {device.model}</p>
                <p><strong>Serial:</strong> {device.serialNumber || 'N/A'}</p>
                <p><strong>Status:</strong> <StatusBadge status={device.status} /></p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Customer Information</h4>
                <p><strong>Name:</strong> {device.customerName}</p>
                <p><strong>Phone:</strong> {device.phoneNumber}</p>
                <p><strong>Issue:</strong> {device.issueDescription || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <GlassButton
                onClick={() => setShowDiagnosticChecklist(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                <Stethoscope size={16} />
                Diagnostic
              </GlassButton>
              
              <GlassButton
                onClick={() => setShowCustomerModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
              >
                <UserIcon size={16} />
                Customer Details
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {modalContent}
      
      {/* Customer Detail Modal */}
      {device && (
        <CustomerDetailModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          customerId={device.customerId}
          onCustomerUpdate={() => {
            // Customer updated successfully
          }}
        />
      )}

      {/* Diagnostic Checklist Modal */}
      {device && (
        <DiagnosticChecklistModal
          isOpen={showDiagnosticChecklist}
          onClose={() => setShowDiagnosticChecklist(false)}
          deviceId={device.id}
          onComplete={async () => {
            // Diagnostic completed
            setShowDiagnosticChecklist(false);
          }}
        />
      )}
    </>
  );
};

export default DeviceRepairDetailModal;
