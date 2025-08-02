import React from 'react';
import FinancialDashboard from '../components/FinancialDashboard';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FinancialTestPage: React.FC = () => {
  const handleExport = (data: string) => {
    // You can handle the exported data here
    console.log('Exported data:', data);
    toast.success('Data exported successfully!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Financial Data Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Testing comprehensive financial data fetching across all systems
        </p>
      </div>

      <FinancialDashboard 
        showDetails={true}
        onExport={handleExport}
      />

      <div className="mt-8">
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Financial Data Sources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Revenue Sources:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Customer payments (customer_payments table)</li>
                <li>• Device repair costs (devices table)</li>
                <li>• Device purchase costs (devices table)</li>
                <li>• Revenue growth calculations</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Expense Sources:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Finance expenses (finance_expenses table)</li>
                <li>• Expense categories and tracking</li>
                <li>• Account-based expense management</li>
                <li>• Expense approval workflows</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Account Management:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Multiple account types (bank, cash, mobile money)</li>
                <li>• Account balance tracking</li>
                <li>• Transfer between accounts</li>
                <li>• Balance adjustments</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Analytics Features:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Real-time financial summaries</li>
                <li>• Monthly and daily trends</li>
                <li>• Growth percentage calculations</li>
                <li>• CSV/JSON data export</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default FinancialTestPage; 