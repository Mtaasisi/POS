import React from 'react';
import { usePOSClickSounds } from '../../hooks/usePOSClickSounds';
import TouchButton from '../ui/TouchButton';
import GlassButton from '../ui/GlassButton';
import { ShoppingCart, CreditCard, Trash2, CheckCircle, XCircle } from 'lucide-react';

/**
 * Demo component to showcase POS click sounds functionality
 * This can be used for testing and demonstration purposes
 */
const POSClickSoundsDemo: React.FC = () => {
  const { 
    playClickSound, 
    playCartAddSound, 
    playPaymentSound, 
    playDeleteSound, 
    playSuccessSound, 
    playErrorSound,
    config 
  } = usePOSClickSounds();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">POS Click Sounds Demo</h2>
        <p className="text-gray-600">
          Test the different click sounds available in the POS system. 
          Sounds are currently {config.enabled ? 'enabled' : 'disabled'}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Click Sound */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Click Sound</h3>
          <p className="text-sm text-gray-600 mb-3">
            General button clicks and interactions
          </p>
          <div className="space-y-2">
            <TouchButton 
              onClick={() => playClickSound()}
              variant="primary"
              size="sm"
              soundType="click"
            >
              Touch Button
            </TouchButton>
            <GlassButton 
              onClick={() => playClickSound()}
              variant="primary"
              size="sm"
              soundType="click"
            >
              Glass Button
            </GlassButton>
          </div>
        </div>

        {/* Cart Add Sound */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Cart Add Sound</h3>
          <p className="text-sm text-gray-600 mb-3">
            When adding items to cart
          </p>
          <TouchButton 
            onClick={() => playCartAddSound()}
            variant="primary"
            size="sm"
            soundType="cart-add"
            icon={ShoppingCart}
          >
            Add to Cart
          </TouchButton>
        </div>

        {/* Payment Sound */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Sound</h3>
          <p className="text-sm text-gray-600 mb-3">
            Successful payment processing
          </p>
          <TouchButton 
            onClick={() => playPaymentSound()}
            variant="success"
            size="sm"
            soundType="payment"
            icon={CreditCard}
          >
            Process Payment
          </TouchButton>
        </div>

        {/* Delete Sound */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Delete Sound</h3>
          <p className="text-sm text-gray-600 mb-3">
            Removing items or clearing cart
          </p>
          <TouchButton 
            onClick={() => playDeleteSound()}
            variant="danger"
            size="sm"
            soundType="delete"
            icon={Trash2}
          >
            Clear Cart
          </TouchButton>
        </div>

        {/* Success Sound */}
        <div className="bg-emerald-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Success Sound</h3>
          <p className="text-sm text-gray-600 mb-3">
            Successful operations
          </p>
          <TouchButton 
            onClick={() => playSuccessSound()}
            variant="success"
            size="sm"
            soundType="success"
            icon={CheckCircle}
          >
            Success
          </TouchButton>
        </div>

        {/* Error Sound */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Error Sound</h3>
          <p className="text-sm text-gray-600 mb-3">
            Error notifications
          </p>
          <TouchButton 
            onClick={() => playErrorSound()}
            variant="danger"
            size="sm"
            soundType="error"
            icon={XCircle}
          >
            Error
          </TouchButton>
        </div>
      </div>

      {/* Settings Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Current Sound Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Overall:</span> {config.enabled ? 'On' : 'Off'}
          </div>
          <div>
            <span className="font-medium">Volume:</span> {Math.round(config.volume * 100)}%
          </div>
          <div>
            <span className="font-medium">Click Sounds:</span> {config.sounds.click ? 'On' : 'Off'}
          </div>
          <div>
            <span className="font-medium">Cart Sounds:</span> {config.sounds.cartAdd ? 'On' : 'Off'}
          </div>
          <div>
            <span className="font-medium">Payment Sounds:</span> {config.sounds.payment ? 'On' : 'Off'}
          </div>
          <div>
            <span className="font-medium">Delete Sounds:</span> {config.sounds.delete ? 'On' : 'Off'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSClickSoundsDemo;
