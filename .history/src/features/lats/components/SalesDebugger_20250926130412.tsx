import React, { useState } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Database, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SalesDebugger: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);

  // Test database connection and sales
  const testDatabase = async () => {
    try {
      setLoading(true);
      console.log('🔍 Testing database connection...');
      
      // Test 1: Check if table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('lats_sales')
        .select('id')
        .limit(1);

      if (tableError) {
        setTestResults({
          success: false,
          error: `Table check failed: ${tableError.message}`,
          step: 'table_check'
        });
        return;
      }

      // Test 2: Get total count
      const { count, error: countError } = await supabase
        .from('lats_sales')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        setTestResults({
          success: false,
          error: `Count check failed: ${countError.message}`,
          step: 'count_check'
        });
        return;
      }

      // Test 3: Get recent sales
      const { data: recentSales, error: salesError } = await supabase
        .from('lats_sales')
        .select('id, sale_number, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (salesError) {
        setTestResults({
          success: false,
          error: `Sales fetch failed: ${salesError.message}`,
          step: 'sales_fetch'
        });
        return;
      }

      setTestResults({
        success: true,
        totalSales: count || 0,
        recentSales: recentSales || [],
        message: `Database connection successful. Found ${count || 0} sales.`
      });

      setSales(recentSales || []);
      
    } catch (err) {
      console.error('❌ Database test failed:', err);
      setTestResults({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        step: 'general'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a test sale
  const createTestSale = async () => {
    try {
      setLoading(true);
      console.log('🧪 Creating test sale...');
      
      const testSaleData = {
        sale_number: `TEST-${Date.now()}`,
        customer_id: null,
        total_amount: Math.floor(Math.random() * 5000) + 1000, // Random amount between 1000-6000
        payment_method: JSON.stringify({ 
          type: 'single', 
          method: 'Cash' 
        }),
        status: 'completed',
        created_by: null, // Use NULL since created_by expects UUID
        notes: 'Test sale created by debugger'
      };

      const { data, error } = await supabase
        .from('lats_sales')
        .insert([testSaleData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating test sale:', error);
        toast.error(`Failed to create test sale: ${error.message}`);
        return;
      }

      console.log('✅ Test sale created:', data);
      toast.success('Test sale created successfully!');
      
      // Refresh the test results
      testDatabase();
    } catch (err) {
      console.error('Error creating test sale:', err);
      toast.error('Failed to create test sale');
    } finally {
      setLoading(false);
    }
  };

  // Create multiple test sales
  const createMultipleTestSales = async () => {
    try {
      setLoading(true);
      console.log('🧪 Creating multiple test sales...');
      
      const testSales = [];
      const now = new Date();
      
      // Create 5 test sales with different dates
      for (let i = 0; i < 5; i++) {
        const saleDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // Each day back
        
        testSales.push({
          sale_number: `TEST-BATCH-${Date.now()}-${i}`,
          customer_id: i % 2 === 0 ? null : `customer-${i}`,
          total_amount: Math.floor(Math.random() * 3000) + 500,
          payment_method: JSON.stringify({ 
            type: 'single', 
            method: i % 2 === 0 ? 'Cash' : 'Card' 
          }),
          status: i % 3 === 0 ? 'pending' : 'completed',
          created_by: null, // Use NULL since created_by expects UUID
          created_at: saleDate.toISOString(),
          notes: `Test sale ${i + 1} created by debugger`
        });
      }

      const { data, error } = await supabase
        .from('lats_sales')
        .insert(testSales)
        .select();

      if (error) {
        console.error('❌ Error creating test sales:', error);
        toast.error(`Failed to create test sales: ${error.message}`);
        return;
      }

      console.log('✅ Test sales created:', data);
      toast.success(`${testSales.length} test sales created successfully!`);
      
      // Refresh the test results
      testDatabase();
    } catch (err) {
      console.error('Error creating test sales:', err);
      toast.error('Failed to create test sales');
    } finally {
      setLoading(false);
    }
  };

  // Clear all test sales
  const clearTestSales = async () => {
    try {
      setLoading(true);
      console.log('🗑️ Clearing test sales...');
      
      const { error } = await supabase
        .from('lats_sales')
        .delete()
        .like('sale_number', 'TEST-%');

      if (error) {
        console.error('❌ Error clearing test sales:', error);
        toast.error(`Failed to clear test sales: ${error.message}`);
        return;
      }

      console.log('✅ Test sales cleared');
      toast.success('Test sales cleared successfully!');
      
      // Refresh the test results
      testDatabase();
    } catch (err) {
      console.error('Error clearing test sales:', err);
      toast.error('Failed to clear test sales');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Sales Database Debugger</h3>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <GlassButton
            onClick={testDatabase}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Test Database
          </GlassButton>
          
          <GlassButton
            onClick={createTestSale}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Create Test Sale
          </GlassButton>
          
          <GlassButton
            onClick={createMultipleTestSales}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create 5 Test Sales
          </GlassButton>
          
          <GlassButton
            onClick={clearTestSales}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Clear Test Sales
          </GlassButton>
        </div>

        {testResults && (
          <div className={`p-4 rounded-lg border ${
            testResults.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                testResults.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResults.success ? 'Database Test Passed' : 'Database Test Failed'}
              </span>
            </div>
            
            <p className={`text-sm ${
              testResults.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResults.message || testResults.error}
            </p>
            
            {testResults.totalSales !== undefined && (
              <div className="mt-2 text-sm text-gray-600">
                Total sales in database: <strong>{testResults.totalSales}</strong>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {sales.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
          </div>
          
          <div className="space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-gray-900">#{sale.sale_number}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sale.status === 'completed' ? 'bg-green-100 text-green-700' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(sale.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatMoney(sale.total_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default SalesDebugger;
