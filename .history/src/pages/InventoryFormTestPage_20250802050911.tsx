import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { ArrowLeft, CheckCircle, AlertCircle, Info, Package, DollarSign, Calculator, TrendingUp } from 'lucide-react';

const InventoryFormTestPage: React.FC = () => {
  const navigate = useNavigate();

  const testSteps = [
    {
      id: 1,
      title: 'Navigate to Add New Product',
      description: 'Go to Inventory → Add New Product in the sidebar',
      action: () => navigate('/inventory/new'),
      icon: <Package size={20} />
    },
    {
      id: 2,
      title: 'Check Default Mode',
      description: 'Verify the form starts in "Simple Product" mode (toggle should be gray, not blue)',
      icon: <CheckCircle size={20} />
    },
    {
      id: 3,
      title: 'Verify Product Details Section',
      description: 'Look for the "Product Details" section with cost price, selling price, and quantity fields',
      icon: <DollarSign size={20} />
    },
    {
      id: 4,
      title: 'Test Quick Price Calculator',
      description: 'Enter a cost price and try the markup buttons (10%, 20%, 30%, 50%)',
      icon: <Calculator size={20} />
    },
    {
      id: 5,
      title: 'Check Profit Analysis',
      description: 'Enter both cost and selling prices to see the enhanced profit analysis',
      icon: <TrendingUp size={20} />
    },
    {
      id: 6,
      title: 'Test Mode Toggle',
      description: 'Try switching between Simple Product and With Variants modes',
      icon: <Info size={20} />
    }
  ];

  const expectedChanges = [
    '✅ Form starts in Simple Product mode (hasVariants = false)',
    '✅ Product Details section visible by default',
    '✅ Helpful tooltips under each field',
    '✅ Quick price calculator buttons',
    '✅ Enhanced profit analysis with better styling',
    '✅ Product summary section',
    '✅ Smart toggle between modes'
  ];

  const troubleshootingSteps = [
    'Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+F5 on Windows)',
    'Clear browser cache',
    'Check browser console for any errors',
    'Verify the development server is running',
    'Try opening in an incognito/private window'
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GlassButton
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Inventory
        </GlassButton>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Form Test</h1>
          <p className="text-gray-600">Test and verify the new inventory form features</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Steps */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Test Steps
          </h2>
          <div className="space-y-4">
            {testSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{step.id}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {step.icon}
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  {step.action && (
                    <GlassButton
                      onClick={step.action}
                      className="text-sm"
                    >
                      Go to Form
                    </GlassButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Expected Changes */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Expected Changes
          </h2>
          <div className="space-y-2">
            {expectedChanges.map((change, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm text-green-800">{change}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Troubleshooting */}
        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-600" />
            Troubleshooting
          </h2>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 mb-3">
              If you don't see the expected changes, try these steps:
            </p>
            <ul className="space-y-1">
              {troubleshootingSteps.map((step, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info size={20} className="text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassButton
              onClick={() => navigate('/inventory/new')}
              className="flex items-center gap-2"
            >
              <Package size={16} />
              Test New Product Form
            </GlassButton>
            <GlassButton
              onClick={() => window.open('http://localhost:5173', '_blank')}
              className="flex items-center gap-2"
            >
              <Info size={16} />
              Open Application
            </GlassButton>
            <GlassButton
              onClick={() => window.open('test-inventory-form.html', '_blank')}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              View Test Instructions
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default InventoryFormTestPage; 