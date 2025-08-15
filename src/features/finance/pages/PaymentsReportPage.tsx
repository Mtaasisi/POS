import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { CreditCard, Filter, Printer, CheckCircle, XCircle, Clock, RefreshCw, Smartphone } from 'lucide-react';
import { useCustomers } from '../../../context/CustomersContext';
import { usePayments } from '../../../context/PaymentsContext';
import { formatCurrency } from '../../../lib/customerApi';
import { formatRelativeTime } from '../../../lib/utils';

const statusIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle className="inline text-green-600" size={16} />;
  if (status === 'pending') return <Clock className="inline text-yellow-500" size={16} />;
  if (status === 'failed') return <XCircle className="inline text-red-600" size={16} />;
  return null;
};

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CustomerRow {
  id: string;
  name: string;
}

const PaymentsReportPage: React.FC = () => {
  const { payments, loading } = usePayments();
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all devices with outstanding balances
      const { data: devicesData } = await supabase
        .from('devices')
        .select('*');
      setDevices(devicesData || []);
      // Fetch all users
      const { data: usersData } = await supabase
        .from('auth_users')
        .select('id, name, email, role');
      setUsers(usersData || []);
      // Fetch all customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name');
      setCustomers(customersData || []);
    };
    fetchData();
  }, []);

  // Unique staff for filter
  const staffList = Array.from(new Set(payments.map(p => p.created_by))).filter((s): s is string => typeof s === 'string' && !!s);

  // Helper: get staff name by ID
  const getStaffName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Unknown';
  };

  // Helper: get customer name by ID
  const getCustomerName = (id: string) => {
    const customer = customers.find(c => c.id === id);
    return customer ? customer.name : 'Unknown';
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterStaff !== 'all' && p.created_by !== filterStaff) return false;
    if (filterSource !== 'all' && p.source !== filterSource) return false;
    if (filterStart && new Date(p.payment_date) < new Date(filterStart)) return false;
    if (filterEnd && new Date(p.payment_date) > new Date(filterEnd)) return false;
    return true;
  });

  // Calculate outstanding for each device
  const deviceOutstanding = devices.map(device => {
    const devicePayments = payments.filter(p => p.device_id === device.id && p.status === 'completed');
    const totalPaid = devicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const invoiceTotal = device.invoice_total || 0;
    const outstanding = Math.max(invoiceTotal - totalPaid, 0);
    return { ...device, totalPaid, outstanding };
  }).filter(d => d.outstanding > 0);

  // Helper: get device/customer name
  const getDeviceName = (device: any) => `${device.brand || ''} ${device.model || ''}`.trim() || device.id;
  const getPaymentDevice = (payment: any) => {
    // Use the device_name from the payment if available, otherwise fallback to device lookup
    if (payment.device_name) return payment.device_name;
    const device = devices.find(d => d.id === payment.device_id);
    return device ? getDeviceName(device) : payment.device_id;
  };
  const getPaymentCustomer = (payment: any) => {
    // Use the customer_name from the payment if available, otherwise fallback to customer lookup
    if (payment.customer_name) return payment.customer_name;
    const device = devices.find(d => d.id === payment.device_id);
    if (device && device.customerName) return device.customerName;
    return getCustomerName(payment.customer_id);
  };

  // Summary
  const totalPayments = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Loading/empty states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <div className="text-blue-700 font-semibold">Loading payments report...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-8">
      {/* Minimal Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard size={24} className="text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Payments</h1>
              <p className="text-xs text-gray-500">Track payments & balances</p>
            </div>
          </div>
          <button
            onClick={() => {
              const printContents = document.getElementById('payments-report-content')?.innerHTML;
              const printWindow = window.open('', '', 'height=800,width=1000');
              if (printWindow && printContents) {
                printWindow.document.write('<html><head><title>Payments Report</title></head><body>' + printContents + '</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Print
          </button>
        </div>
      </div>
      <div id="payments-report-content" className="space-y-8">
        {/* Mobile-Optimized Filters */}
        <GlassCard className="mb-4 p-3 shadow-lg border border-blue-100">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white min-w-0 flex-1 sm:flex-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed ✓</option>
              <option value="pending">Pending ⏳</option>
              <option value="failed">Failed ✗</option>
            </select>
            
            <select 
              value={filterStaff || 'all'} 
              onChange={e => setFilterStaff(e.target.value)} 
              className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white min-w-0 flex-1 sm:flex-none"
            >
              <option value="all">All Staff</option>
              {staffList.map(staff => <option key={staff} value={staff}>{getStaffName(staff || '')}</option>)}
            </select>
            
            <select 
              value={filterSource} 
              onChange={e => setFilterSource(e.target.value)} 
              className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white min-w-0 flex-1 sm:flex-none"
            >
              <option value="all">All Sources</option>
              <option value="device_payment">Device Payments</option>
              <option value="pos_sale">POS Sales</option>
            </select>
            
            <input 
              type="date" 
              value={filterStart} 
              onChange={e => setFilterStart(e.target.value)} 
              className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white flex-1 sm:flex-none"
            />
            
            <input 
              type="date" 
              value={filterEnd} 
              onChange={e => setFilterEnd(e.target.value)} 
              className="text-sm rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white flex-1 sm:flex-none"
            />
            
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterStaff('all');
                setFilterSource('all');
                setFilterStart('');
                setFilterEnd('');
                setFiltering(true);
                setTimeout(() => setFiltering(false), 400);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors bg-white border border-gray-300"
            >
              Clear
            </button>
          </div>
        </GlassCard>
        {/* Payments Table - Mobile Optimized */}
        <GlassCard className="shadow-lg border border-blue-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-900"><CreditCard size={20}/> Payments</h2>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {filteredPayments.map((payment, idx) => (
              <div key={payment.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon(payment.status)}
                    <span className="font-semibold text-green-700 text-lg">{formatCurrency(payment.amount)}</span>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{payment.method}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{formatRelativeTime(payment.payment_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium capitalize">{payment.status}</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Device:</span>
                    <p className="font-medium truncate">{getPaymentDevice(payment)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium truncate">{getPaymentCustomer(payment)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Recorded by:</span>
                    <p className="font-medium">{getStaffName(payment.created_by || '')}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredPayments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>No payments found</p>
              </div>
            )}
            {filteredPayments.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-blue-900">Total: {formatCurrency(totalPayments)}</p>
              </div>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto w-full">
            <table className="min-w-full text-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                  <th className="px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Device</th>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-left">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, idx) => (
                  <tr key={payment.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'}>
                    <td className="px-3 py-2">{formatRelativeTime(payment.payment_date)}</td>
                    <td className="px-3 py-2 font-semibold text-green-700">{formatCurrency(payment.amount)}</td>
                    <td className="px-3 py-2 capitalize">{payment.method}</td>
                    <td className="px-3 py-2">{statusIcon(payment.status)} <span className="ml-1 capitalize">{payment.status}</span></td>
                    <td className="px-3 py-2 font-medium max-w-32 truncate" title={getPaymentDevice(payment)}>{getPaymentDevice(payment)}</td>
                    <td className="px-3 py-2 max-w-32 truncate" title={getPaymentCustomer(payment)}>{getPaymentCustomer(payment)}</td>
                    <td className="px-3 py-2">{getStaffName(payment.created_by || '')}</td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-500 py-6">No payments found</td></tr>
                )}
              </tbody>
              {filteredPayments.length > 0 && (
                <tfoot>
                  <tr className="bg-blue-100 font-bold">
                    <td className="px-3 py-2 text-right" colSpan={1}>Total:</td>
                    <td className="px-3 py-2 text-green-800">{formatCurrency(totalPayments)}</td>
                    <td colSpan={5}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </GlassCard>
        {/* Outstanding Balances - Mobile Optimized */}
        <GlassCard className="shadow-lg border border-rose-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-rose-900"><Filter size={20}/> Devices with Outstanding Balances</h2>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {deviceOutstanding.map((device, idx) => {
              const percentPaid = device.invoice_total ? Math.min(100, Math.round((device.totalPaid / device.invoice_total) * 100)) : 0;
              return (
                <div key={device.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-rose-700 text-lg">{formatCurrency(device.outstanding)}</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{device.status}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Device:</span>
                      <p className="font-medium truncate">{getDeviceName(device)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <p className="font-medium truncate">{getCustomerName(device.customer_id)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Invoice:</span>
                      <p className="font-medium">{formatCurrency(device.invoice_total || 0)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Paid:</span>
                      <p className="font-medium text-green-700">{formatCurrency(device.totalPaid)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Payment Progress:</span>
                      <span className="font-medium">{percentPaid}% paid</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${percentPaid}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {deviceOutstanding.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>No outstanding balances</p>
              </div>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto w-full">
            <table className="min-w-full text-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-rose-50">
                  <th className="px-3 py-2 text-left">Device</th>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-left">Invoice Total</th>
                  <th className="px-3 py-2 text-left">Total Paid</th>
                  <th className="px-3 py-2 text-left">Outstanding</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Progress</th>
                </tr>
              </thead>
              <tbody>
                {deviceOutstanding.map((device, idx) => {
                  const percentPaid = device.invoice_total ? Math.min(100, Math.round((device.totalPaid / device.invoice_total) * 100)) : 0;
                  return (
                    <tr key={device.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/50'}>
                      <td className="px-3 py-2 font-medium max-w-32 truncate" title={getDeviceName(device)}>{getDeviceName(device)}</td>
                      <td className="px-3 py-2 max-w-32 truncate" title={getCustomerName(device.customer_id)}>{getCustomerName(device.customer_id)}</td>
                      <td className="px-3 py-2">{formatCurrency(device.invoice_total || 0)}</td>
                      <td className="px-3 py-2 text-green-700 font-semibold">{formatCurrency(device.totalPaid)}</td>
                      <td className="px-3 py-2 text-rose-700 font-bold">{formatCurrency(device.outstanding)}</td>
                      <td className="px-3 py-2 capitalize">{device.status}</td>
                      <td className="px-3 py-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${percentPaid}%` }} />
                        </div>
                        <span className="text-xs ml-2 text-gray-600">{percentPaid}% paid</span>
                      </td>
                    </tr>
                  );
                })}
                {deviceOutstanding.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-500 py-6">No outstanding balances</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PaymentsReportPage; 