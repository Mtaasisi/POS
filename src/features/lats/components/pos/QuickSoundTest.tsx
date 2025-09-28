import React from 'react';
import { SoundManager } from '../../../lib/soundUtils';

const QuickSoundTest: React.FC = () => {
  const testClick = () => {
    console.log('Testing click sound...');
    SoundManager.playClickSound();
  };

  const testCart = () => {
    console.log('Testing cart sound...');
    SoundManager.playCartAddSound();
  };

  const testPayment = () => {
    console.log('Testing payment sound...');
    SoundManager.playPaymentSound();
  };

  const forceInteraction = () => {
    console.log('Forcing user interaction...');
    SoundManager.forceUserInteraction();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <h3 className="font-semibold text-sm mb-2">Quick Sound Test</h3>
      <div className="space-y-2">
        <button
          onClick={forceInteraction}
          className="w-full px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
        >
          Force Interaction
        </button>
        <button
          onClick={testClick}
          className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Test Click
        </button>
        <button
          onClick={testCart}
          className="w-full px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
        >
          Test Cart
        </button>
        <button
          onClick={testPayment}
          className="w-full px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
        >
          Test Payment
        </button>
      </div>
    </div>
  );
};

export default QuickSoundTest;
