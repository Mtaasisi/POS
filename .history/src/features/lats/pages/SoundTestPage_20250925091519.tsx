import React from 'react';
import SoundTestButton from '../components/pos/SoundTestButton';
import POSClickSoundsDemo from '../components/pos/POSClickSoundsDemo';

const SoundTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Sound System Test</h1>
          <p className="text-gray-600">
            Test the click sounds functionality for the POS system
          </p>
        </div>

        <SoundTestButton />
        <POSClickSoundsDemo />
      </div>
    </div>
  );
};

export default SoundTestPage;
