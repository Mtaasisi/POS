import React from 'react';
import DeviceLink from '../components/DeviceLink';

/**
 * Example component showing how to use DeviceLink
 * This demonstrates different ways to link to device detail pages
 */
const DeviceLinkExample: React.FC = () => {
  // Example device IDs (replace with actual device IDs from your database)
  const exampleDeviceIds = [
    'device-123',
    'device-456', 
    'device-789'
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Device Link Examples</h1>
      
      <div className="space-y-6">
        {/* Basic Link */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Basic Device Link</h2>
          <p className="text-gray-600 mb-3">
            Click to open device detail page:
          </p>
          <DeviceLink deviceId={exampleDeviceIds[0]}>
            View Device {exampleDeviceIds[0]}
          </DeviceLink>
        </div>

        {/* Link with Custom Styling */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Styled Device Link</h2>
          <p className="text-gray-600 mb-3">
            Custom styled link:
          </p>
          <DeviceLink 
            deviceId={exampleDeviceIds[1]}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 no-underline"
          >
            Open Device Details
          </DeviceLink>
        </div>

        {/* Multiple Device Links */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Multiple Device Links</h2>
          <p className="text-gray-600 mb-3">
            List of devices with links:
          </p>
          <div className="space-y-2">
            {exampleDeviceIds.map((deviceId, index) => (
              <div key={deviceId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>Device {index + 1}: {deviceId}</span>
                <DeviceLink deviceId={deviceId}>
                  View Details
                </DeviceLink>
              </div>
            ))}
          </div>
        </div>

        {/* Button Style Link */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Button Style Link</h2>
          <p className="text-gray-600 mb-3">
            Link styled as a button:
          </p>
          <DeviceLink 
            deviceId={exampleDeviceIds[2]}
            className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 no-underline font-medium transition-colors"
          >
            🔧 Access Device Dashboard
          </DeviceLink>
        </div>

        {/* Direct URL Example */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Direct URL Access</h2>
          <p className="text-gray-600 mb-3">
            You can also access devices directly via URL:
          </p>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <div>URL Pattern: <code>/devices/[device-id]</code></div>
            <div className="mt-2">
              Examples:
              <ul className="mt-1 ml-4">
                {exampleDeviceIds.map((deviceId) => (
                  <li key={deviceId}>
                    <code>/devices/{deviceId}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Code Example */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Programmatic Navigation</h2>
          <p className="text-gray-600 mb-3">
            To navigate programmatically in your components:
          </p>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <pre>{`import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to device detail page
const openDevice = (deviceId: string) => {
  navigate(\`/devices/\${deviceId}\`);
};

// Usage
<button onClick={() => openDevice('your-device-id')}>
  Open Device
</button>`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceLinkExample;
