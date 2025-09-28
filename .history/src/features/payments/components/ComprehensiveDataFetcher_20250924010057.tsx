import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  Download, RefreshCw, Database, FileText, BarChart3, 
  CheckCircle, AlertTriangle, Clock, TrendingUp, Users,
  CreditCard, Building, Package, Wrench, DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

interface DataSummary {
  [key: string]: number;
}

interface ComprehensiveData {
  timestamp: string;
  summary: DataSummary;
  data: {
    [key: string]: any[];
  };
}

const ComprehensiveDataFetcher: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ComprehensiveData | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchAllPaymentInformation = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting comprehensive payment data fetch...');
      
      const allData: ComprehensiveData = {
        timestamp: new Date().toISOString(),
        summary: {},
        data: {}
      };

      // 1. Customer Payments
      console.log('📊 Fetching customer payments...');
      const { data: customerPayments, error: customerError } = await supabase
        .from('customer_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customerError) {
        console.error('❌ Error fetching customer payments:', customerError);
      } else {
        allData.data.customerPayments = customerPayments || [];
        allData.summary.customerPayments = customerPayments?.length || 0;
        console.log(`✅ Fetched ${customerPayments?.length || 0} customer payments`);
      }

      // 2. Purchase Order Payments
      console.log('📊 Fetching purchase order payments...');
      const { data: purchaseOrderPayments, error: poError } = await supabase
        .from('purchase_order_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (poError) {
        console.error('❌ Error fetching purchase order payments:', poError);
      } else {
        allData.data.purchaseOrderPayments = purchaseOrderPayments || [];
        allData.summary.purchaseOrderPayments = purchaseOrderPayments?.length || 0;
        console.log(`✅ Fetched ${purchaseOrderPayments?.length || 0} purchase order payments`);
      }

      // 3. Payment Transactions
      console.log('📊 Fetching payment transactions...');
      const { data: paymentTransactions, error: ptError } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ptError) {
        console.error('❌ Error fetching payment transactions:', ptError);
      } else {
        allData.data.paymentTransactions = paymentTransactions || [];
        allData.summary.paymentTransactions = paymentTransactions?.length || 0;
        console.log(`✅ Fetched ${paymentTransactions?.length || 0} payment transactions`);
      }

      // 4. Payment Providers
      console.log('📊 Fetching payment providers...');
      const { data: paymentProviders, error: ppError } = await supabase
        .from('payment_providers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ppError) {
        console.error('❌ Error fetching payment providers:', ppError);
      } else {
        allData.data.paymentProviders = paymentProviders || [];
        allData.summary.paymentProviders = paymentProviders?.length || 0;
        console.log(`✅ Fetched ${paymentProviders?.length || 0} payment providers`);
      }

      // 5. Finance Accounts
      console.log('📊 Fetching finance accounts...');
      const { data: financeAccounts, error: faError } = await supabase
        .from('finance_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (faError) {
        console.error('❌ Error fetching finance accounts:', faError);
      } else {
        allData.data.financeAccounts = financeAccounts || [];
        allData.summary.financeAccounts = financeAccounts?.length || 0;
        console.log(`✅ Fetched ${financeAccounts?.length || 0} finance accounts`);
      }

      // 6. Payment Audit Log
      console.log('📊 Fetching payment audit log...');
      const { data: paymentAuditLog, error: palError } = await supabase
        .from('payment_audit_log')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (palError) {
        console.error('❌ Error fetching payment audit log:', palError);
      } else {
        allData.data.paymentAuditLog = paymentAuditLog || [];
        allData.summary.paymentAuditLog = paymentAuditLog?.length || 0;
        console.log(`✅ Fetched ${paymentAuditLog?.length || 0} payment audit log entries`);
      }

      // 7. Payment Reconciliation
      console.log('📊 Fetching payment reconciliation...');
      const { data: paymentReconciliation, error: prError } = await supabase
        .from('payment_reconciliation')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (prError) {
        console.error('❌ Error fetching payment reconciliation:', prError);
      } else {
        allData.data.paymentReconciliation = paymentReconciliation || [];
        allData.summary.paymentReconciliation = paymentReconciliation?.length || 0;
        console.log(`✅ Fetched ${paymentReconciliation?.length || 0} payment reconciliation entries`);
      }

      // 8. Customers (for reference)
      console.log('📊 Fetching customers...');
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customersError) {
        console.error('❌ Error fetching customers:', customersError);
      } else {
        allData.data.customers = customers || [];
        allData.summary.customers = customers?.length || 0;
        console.log(`✅ Fetched ${customers?.length || 0} customers`);
      }

      // 9. Purchase Orders (for reference)
      console.log('📊 Fetching purchase orders...');
      const { data: purchaseOrders, error: poRefError } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (poRefError) {
        console.error('❌ Error fetching purchase orders:', poRefError);
      } else {
        allData.data.purchaseOrders = purchaseOrders || [];
        allData.summary.purchaseOrders = purchaseOrders?.length || 0;
        console.log(`✅ Fetched ${purchaseOrders?.length || 0} purchase orders`);
      }

      // 10. Devices (for reference)
      console.log('📊 Fetching devices...');
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (devicesError) {
        console.error('❌ Error fetching devices:', devicesError);
      } else {
        allData.data.devices = devices || [];
        allData.summary.devices = devices?.length || 0;
        console.log(`✅ Fetched ${devices?.length || 0} devices`);
      }

      // 11. Repair Orders (for reference)
      console.log('📊 Fetching repair orders...');
      const { data: repairOrders, error: roError } = await supabase
        .from('repair_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (roError) {
        console.error('❌ Error fetching repair orders:', roError);
      } else {
        allData.data.repairOrders = repairOrders || [];
        allData.summary.repairOrders = repairOrders?.length || 0;
        console.log(`✅ Fetched ${repairOrders?.length || 0} repair orders`);
      }

      // Calculate totals and analytics
      const totalPayments = (allData.summary.customerPayments || 0) + 
                           (allData.summary.purchaseOrderPayments || 0) + 
                           (allData.summary.paymentTransactions || 0);
      
      const totalAmount = [...(allData.data.customerPayments || []), 
                          ...(allData.data.purchaseOrderPayments || []), 
                          ...(allData.data.paymentTransactions || [])]
        .reduce((sum, payment) => sum + (payment.amount || payment.total_amount || 0), 0);

      allData.summary.totalPayments = totalPayments;
      allData.summary.totalAmount = totalAmount;
      allData.summary.totalRecords = Object.values(allData.summary).reduce((sum, count) => sum + (count || 0), 0);

      setData(allData);
      setLastFetch(new Date());
      
      toast.success(`Successfully fetched ${allData.summary.totalRecords} total records`);
      console.log('🎉 Comprehensive data fetch completed!');

    } catch (error) {
      console.error('❌ Critical error during data fetch:', error);
      toast.error('Failed to fetch payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadData = () => {
    if (!data) return;
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Payment data downloaded successfully');
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDataIcon = (key: string) => {
    switch (key) {
      case 'customerPayments': return <Users className="w-4 h-4" />;
      case 'purchaseOrderPayments': return <Package className="w-4 h-4" />;
      case 'paymentTransactions': return <CreditCard className="w-4 h-4" />;
      case 'paymentProviders': return <Building className="w-4 h-4" />;
      case 'financeAccounts': return <DollarSign className="w-4 h-4" />;
      case 'customers': return <Users className="w-4 h-4" />;
      case 'purchaseOrders': return <Package className="w-4 h-4" />;
      case 'devices': return <Wrench className="w-4 h-4" />;
      case 'repairOrders': return <Wrench className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comprehensive Data Fetcher</h2>
          <p className="text-gray-600">Fetch all payment information from all database sources</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton
            onClick={fetchAllPaymentInformation}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Fetching...' : 'Fetch All Data'}
          </GlassButton>
          {data && (
            <GlassButton
              onClick={downloadData}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </GlassButton>
          )}
        </div>
      </div>

      {/* Status */}
      {lastFetch && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">
              Last fetched: {lastFetch.toLocaleString()}
            </span>
          </div>
        </GlassCard>
      )}

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-900">{data.summary.totalRecords}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Payments</p>
                <p className="text-2xl font-bold text-green-900">{data.summary.totalPayments}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Amount</p>
                <p className="text-2xl font-bold text-purple-900">{formatMoney(data.summary.totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Data Sources</p>
                <p className="text-2xl font-bold text-orange-900">{Object.keys(data.data).length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Detailed Breakdown */}
      {data && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.summary).map(([key, count]) => {
              if (key === 'totalPayments' || key === 'totalAmount' || key === 'totalRecords') return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getDataIcon(key)}
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">records</div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Instructions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-blue-600">1</span>
            </div>
            <div>
              <p className="font-medium">Click "Fetch All Data" to retrieve all payment information from the database</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-blue-600">2</span>
            </div>
            <div>
              <p className="font-medium">View the summary and detailed breakdown of all data sources</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-blue-600">3</span>
            </div>
            <div>
              <p className="font-medium">Click "Download JSON" to save all data to a file for analysis</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ComprehensiveDataFetcher;
