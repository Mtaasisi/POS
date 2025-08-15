import React from 'react';
import { LocationDebugger, CameraTest } from '../components';
import { BackButton } from '../../../features/shared/components/ui/BackButton';

const LocationTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Location Test Page</h1>
            <p className="text-gray-600">Debug CoreLocation and location verification issues</p>
          </div>
        </div>

        {/* Location Debugger */}
        <LocationDebugger />

        {/* Camera Test */}
        <CameraTest />

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use This Page</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Check System Information:</strong> Review the debug information above to understand your device and browser capabilities.</p>
            <p>2. <strong>Test GPS Location:</strong> Click "Test GPS Location" to try standard location detection.</p>
            <p>3. <strong>Test iOS Location:</strong> If you're on iOS, click "Test iOS Location" to try iOS-specific settings.</p>
            <p>4. <strong>Review Results:</strong> Check the test results to see what's working or failing.</p>
            <p>5. <strong>Follow Troubleshooting:</strong> Use the tips provided to fix any issues.</p>
          </div>
        </div>

        {/* Common Solutions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">Quick Fixes for CoreLocation Error</h2>
          <div className="space-y-2 text-sm text-yellow-700">
            <p><strong>iOS Devices:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Settings → Privacy & Security → Location Services → ON</li>
              <li>Settings → Safari → Location → Allow</li>
              <li>Move near a window or go outside</li>
              <li>Restart Safari app</li>
            </ul>
            
            <p className="mt-3"><strong>Android Devices:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Settings → Location → Mode → High accuracy</li>
              <li>Settings → Apps → [Browser] → Permissions → Location → Allow</li>
              <li>Clear browser cache</li>
            </ul>
            
            <p className="mt-3"><strong>Desktop Browsers:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Ensure you're using HTTPS</li>
              <li>Allow location when prompted</li>
              <li>Check browser location settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTestPage;
