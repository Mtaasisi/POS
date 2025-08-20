import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { MapPin, Compass, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAttendanceSettings } from '../../../hooks/useAttendanceSettings';

const OfficeDetectionDemo: React.FC = () => {
  const { detectNearestOfficeByLocation, settings } = useAttendanceSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testDetection = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      // Detect nearest office
      const detection = await detectNearestOfficeByLocation(userLocation.lat, userLocation.lng);

      setResult({
        userLocation,
        detection
      });

      if (detection.office) {
        if (detection.isWithinRange) {
          toast.success(`✅ Detected: ${detection.office.name} (${Math.round(detection.distance)}m away)`);
        } else {
          toast.error(`❌ Too far: ${detection.office.name} (${Math.round(detection.distance)}m away, need to be within ${detection.office.radius}m)`);
        }
      } else {
        toast.error('❌ No offices configured');
      }

    } catch (err: any) {
      console.error('Detection failed:', err);
      setError(err.message || 'Failed to detect office');
      toast.error('❌ Detection failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <MapPin className="w-8 h-8 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Office Detection Demo</h3>
        </div>
        
        <p className="text-gray-600">
          Test the automatic office detection feature using your current GPS location.
        </p>

        <GlassButton
          onClick={testDetection}
          disabled={isLoading}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 mr-2" />
              Test Office Detection
            </>
          )}
        </GlassButton>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            {/* User Location */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Your Location</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <p><strong>Latitude:</strong> {result.userLocation.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {result.userLocation.lng.toFixed(6)}</p>
                <p><strong>GPS Accuracy:</strong> ±{Math.round(result.userLocation.accuracy)}m</p>
              </div>
            </div>

            {/* Detection Result */}
            {result.detection.office && (
              <div className={`border rounded-lg p-4 ${
                result.detection.isWithinRange 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.detection.isWithinRange ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  )}
                  <span className={`font-medium ${
                    result.detection.isWithinRange ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    {result.detection.isWithinRange ? 'Office Detected!' : 'Too Far Away'}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p><strong>Office:</strong> {result.detection.office.name}</p>
                  <p><strong>Address:</strong> {result.detection.office.address}</p>
                  <p><strong>Distance:</strong> {Math.round(result.detection.distance)}m away</p>
                  <p><strong>Check-in Radius:</strong> {result.detection.office.radius}m</p>
                  <p><strong>WiFi Networks:</strong> {result.detection.office.networks.length} configured</p>
                </div>

                {result.detection.isWithinRange ? (
                  <p className="text-green-700 text-sm mt-2">✅ You're within the check-in range!</p>
                ) : (
                  <p className="text-orange-700 text-sm mt-2">
                    ⚠️ You need to be within {result.detection.office.radius}m to check in
                  </p>
                )}
              </div>
            )}

            {/* No Office Found */}
            {!result.detection.office && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">No Office Found</span>
                </div>
                <p className="text-red-600 text-sm">
                  No office locations are configured in the system. Please contact your administrator.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Configured Offices Info */}
        {settings.offices.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Configured Offices</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {settings.offices.map((office, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{office.name}</span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {office.radius}m radius
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">How It Works</h4>
          <div className="space-y-1 text-sm text-yellow-700">
            <p>📍 Uses your GPS location to find the nearest office</p>
            <p>📏 Calculates distance to each configured office</p>
            <p>✅ Checks if you're within the office's check-in radius</p>
            <p>🎯 Automatically selects the closest office within range</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default OfficeDetectionDemo;
