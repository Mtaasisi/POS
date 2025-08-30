import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { MapPin, Smartphone, AlertTriangle, CheckCircle, RefreshCw, Info } from 'lucide-react';

const LocationDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const collectDebugInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      geolocationSupported: !!navigator.geolocation,
      https: window.location.protocol === 'https:',
      hostname: window.location.hostname,
      timestamp: new Date().toISOString(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : 'Not available',
      permissions: null as any
    };

    // Check permissions if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(permission => {
          info.permissions = permission.state;
          setDebugInfo(info);
        })
        .catch(() => {
          info.permissions = 'Query failed';
          setDebugInfo(info);
        });
    } else {
      setDebugInfo(info);
    }
  };

  const testLocation = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });

      setTestResult(`✅ SUCCESS: Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}, Accuracy: ${position.coords.accuracy}m`);
    } catch (error: any) {
      setTestResult(`❌ FAILED: ${error.message} (Code: ${error.code})`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLocationIOS = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        // iOS-specific options
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false, // iOS often works better with standard accuracy
            timeout: 20000, // Longer timeout for iOS
            maximumAge: 0
          }
        );
      });

      setTestResult(`✅ iOS SUCCESS: Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}, Accuracy: ${position.coords.accuracy}m`);
    } catch (error: any) {
      setTestResult(`❌ iOS FAILED: ${error.message} (Code: ${error.code})`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Location Debugger</h3>
        </div>

        <p className="text-sm text-gray-600">
          This tool helps diagnose location issues, especially CoreLocation errors on iOS devices.
        </p>

        {/* Debug Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">System Information</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>User Agent:</strong> {debugInfo.userAgent}</p>
            <p><strong>Platform:</strong> {debugInfo.platform}</p>
            <p><strong>Geolocation Supported:</strong> {debugInfo.geolocationSupported ? '✅ Yes' : '❌ No'}</p>
            <p><strong>HTTPS:</strong> {debugInfo.https ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Hostname:</strong> {debugInfo.hostname}</p>
            <p><strong>Screen Size:</strong> {debugInfo.screenSize}</p>
            <p><strong>Viewport Size:</strong> {debugInfo.viewportSize}</p>
            <p><strong>Permissions:</strong> {debugInfo.permissions || 'Checking...'}</p>
            {debugInfo.connection && typeof debugInfo.connection === 'object' && (
              <div>
                <p><strong>Connection Type:</strong> {debugInfo.connection.effectiveType}</p>
                <p><strong>Download Speed:</strong> {debugInfo.connection.downlink} Mbps</p>
                <p><strong>RTT:</strong> {debugInfo.connection.rtt} ms</p>
              </div>
            )}
          </div>
        </div>



        {/* Refresh Button */}
        <div className="flex justify-center">
          <GlassButton
            onClick={collectDebugInfo}
            icon={<RefreshCw size={16} />}
            variant="ghost"
            size="sm"
            className="text-gray-600"
          >
            Refresh Debug Info
          </GlassButton>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg ${
            testResult.includes('SUCCESS') 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.includes('SUCCESS') ? (
                <CheckCircle size={16} className="text-green-600" />
              ) : (
                <AlertTriangle size={16} className="text-red-600" />
              )}
              <span className="text-sm font-medium">
                {testResult.includes('SUCCESS') ? 'Test Result' : 'Test Failed'}
              </span>
            </div>
            <p className="text-sm mt-1">{testResult}</p>
          </div>
        )}

        {/* iOS Specific Tips */}
        {debugInfo.userAgent?.toLowerCase().includes('iphone') || 
         debugInfo.userAgent?.toLowerCase().includes('ipad') ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">iOS Device Detected</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• CoreLocation errors are common on iOS devices</p>
              <p>• Try the "Test iOS Location" button above</p>
              <p>• Ensure Location Services is enabled in Settings</p>
              <p>• Try moving near a window or going outside</p>
              <p>• Restart the Safari app if issues persist</p>
            </div>
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
};

export default LocationDebugger;
