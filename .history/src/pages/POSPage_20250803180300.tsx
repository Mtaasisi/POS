import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);

  const exitPOS = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600">Process sales and manage transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={exitPOS}
              >
                Exit POS
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <GlassCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">POS System</h2>
          <p className="text-gray-600">POS system is working correctly!</p>
          <p className="text-sm text-gray-500 mt-2">Cart items: {cart.length}</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default POSPage; 