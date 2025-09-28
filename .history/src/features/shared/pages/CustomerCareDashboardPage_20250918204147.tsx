import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useUserGoals } from '../../../context/UserGoalsContext';
import { PageErrorWrapper } from '../components/PageErrorWrapper';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import CustomerCareDashboard from '../components/dashboards/CustomerCareDashboard';
import BarcodeScanner from '../../devices/components/BarcodeScanner';
import { DeviceStatus, Device } from '../../../types';

const CustomerCareDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { devices, loading: devicesLoading } = useDevices();
  const { customers, loading: customersLoading } = useCustomers();
  const { userGoals, loading: goalsLoading } = useUserGoals();
  
  // Error handling
  const { handleError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all');
  const [showScanner, setShowScanner] = useState(false);

  // Filter devices for customer care focus
  const filteredDevices = useMemo(() => {
    let filtered = devices.filter(device => device.status !== 'done'); // Exclude done devices from main list

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device => 
        device.brand?.toLowerCase().includes(query) ||
        device.model?.toLowerCase().includes(query) ||
        device.serialNumber?.toLowerCase().includes(query) ||
        device.customerName?.toLowerCase().includes(query) ||
        device.issueDescription?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    
    return filtered;
  }, [devices, searchQuery, statusFilter]);

  // Loading state
  const loading = devicesLoading || customersLoading || goalsLoading;

  // Error handling for data loading
  useEffect(() => {
    if (devices.length === 0 && !devicesLoading) {
      console.warn('No devices loaded for customer care dashboard');
    }
  }, [devices, devicesLoading]);

  return (
    <PageErrorWrapper pageName="Customer Care Dashboard" showDetails={true}>
      <div className="h-full overflow-hidden">
        {/* Main Dashboard */}
        <CustomerCareDashboard
          devices={devices}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Barcode Scanner Modal */}
        {showScanner && (
          <BarcodeScanner
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={(result) => {
              console.log('Barcode scanned:', result);
              // Handle barcode scan result
              setShowScanner(false);
            }}
          />
        )}
      </div>
    </PageErrorWrapper>
  );
};

export default CustomerCareDashboardPage;
