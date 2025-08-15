import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { DollarSign, ArrowRight, Calculator, Package, ShoppingCart } from 'lucide-react';

const QuickCashDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAmount, setSelectedAmount] = useState<number>(0);

  // Get the result from navigation state (if coming back from QuickCashPage)
  const result = location.state?.quickCashAmount;

  const demoAmounts = [
    { label: 'Small Purchase', amount: 1500, description: 'Coffee and snacks' },
    { label: 'Medium Purchase', amount: 8500, description: 'Electronics accessory' },
    { label: 'Large Purchase', amount: 25000, description: 'Premium product' },
    { label: 'Custom Amount', amount: 0, description: 'Enter your own amount' }
  ];

  const handleNavigateToQuickCash = (amount: number) => {
    if (amount > 0) {
      // Navigate with suggested amount
      navigate(`/lats/quick-cash?amount=${amount}`);
    } else {
      // Navigate without suggested amount
      navigate('/lats/quick-cash');
    }
  };

  const handleCustomAmount = () => {
    const customAmount = prompt('Enter the amount due:');
    if (customAmount && !isNaN(parseFloat(customAmount))) {
      navigate(`/lats/quick-cash?amount=${parseFloat(customAmount)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="w-full">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calculator className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Quick Cash Demo</h1>
              </div>
              <p className="text-lg text-gray-600">
                Test the Quick Cash functionality with different scenarios
              </p>
            </div>

            {/* Result Display */}
            {result && (
              <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    ✅ Payment Processed Successfully!
                  </h3>
                  <div className="text-2xl font-bold text-green-800 mb-2">
                    TZS {result.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">
                    Amount received and processed
                  </div>
                </div>
              </div>
            )}

            {/* Demo Scenarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {demoAmounts.map((demo, index) => (
                <div
                  key={index}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{demo.label}</h3>
                        <p className="text-sm text-gray-600">{demo.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {demo.amount > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-gray-900 mb-4">
                        TZS {demo.amount.toLocaleString()}
                      </div>
                      <GlassButton
                        onClick={() => handleNavigateToQuickCash(demo.amount)}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Process Payment
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </GlassButton>
                    </>
                  ) : (
                    <>
                      <div className="text-lg text-gray-600 mb-4">
                        Enter custom amount
                      </div>
                      <GlassButton
                        onClick={handleCustomAmount}
                        variant="secondary"
                        className="w-full"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Enter Amount
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </GlassButton>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Features Overview */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Cash Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg mt-1">
                    <Calculator className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Number Keypad</h4>
                    <p className="text-sm text-gray-600">Full numeric keypad for precise amount entry</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg mt-1">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Quick Amounts</h4>
                    <p className="text-sm text-gray-600">Predefined amounts for common transactions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg mt-1">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Change Calculation</h4>
                    <p className="text-sm text-gray-600">Automatic change calculation when amount due is provided</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg mt-1">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">POS Integration</h4>
                    <p className="text-sm text-gray-600">Seamlessly integrates with the POS system</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <GlassButton
                onClick={() => navigate('/pos')}
                variant="secondary"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Back to POS
                </div>
              </GlassButton>
              <GlassButton
                onClick={() => navigate('/lats')}
                variant="secondary"
                className="bg-blue-200 hover:bg-blue-300 text-blue-700"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  LATS Dashboard
                </div>
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default QuickCashDemoPage;
