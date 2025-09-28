import React, { useState } from 'react';
import { SoundManager } from '../../../lib/soundUtils';

const SoundTestButton: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasicSound = async () => {
    addResult('Testing basic sound...');
    try {
      await SoundManager.playClickSound();
      addResult('✅ Click sound played successfully');
    } catch (error) {
      addResult(`❌ Click sound failed: ${error}`);
    }
  };

  const testCartSound = async () => {
    addResult('Testing cart sound...');
    try {
      await SoundManager.playCartAddSound();
      addResult('✅ Cart sound played successfully');
    } catch (error) {
      addResult(`❌ Cart sound failed: ${error}`);
    }
  };

  const testPaymentSound = async () => {
    addResult('Testing payment sound...');
    try {
      await SoundManager.playPaymentSound();
      addResult('✅ Payment sound played successfully');
    } catch (error) {
      addResult(`❌ Payment sound failed: ${error}`);
    }
  };

  const testWebAudioAPI = () => {
    addResult('Testing Web Audio API...');
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        addResult('❌ Web Audio API not supported');
        return;
      }
      
      const audioContext = new AudioContext();
      addResult(`✅ AudioContext created, state: ${audioContext.state}`);
      
      if (audioContext.state === 'suspended') {
        addResult('⚠️ AudioContext is suspended, trying to resume...');
        audioContext.resume().then(() => {
          addResult(`✅ AudioContext resumed, state: ${audioContext.state}`);
        }).catch((error) => {
          addResult(`❌ Failed to resume AudioContext: ${error}`);
        });
      }
    } catch (error) {
      addResult(`❌ Web Audio API test failed: ${error}`);
    }
  };

  const testUserInteraction = () => {
    addResult('Testing user interaction detection...');
    // Force mark user interaction
    SoundManager.markUserInteracted();
    addResult('✅ User interaction marked');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Sound System Test</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={testBasicSound}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Click Sound
        </button>
        
        <button
          onClick={testCartSound}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Cart Sound
        </button>
        
        <button
          onClick={testPaymentSound}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Payment Sound
        </button>
        
        <button
          onClick={testWebAudioAPI}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Test Web Audio API
        </button>
        
        <button
          onClick={testUserInteraction}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Mark User Interaction
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a button above to test.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundTestButton;
