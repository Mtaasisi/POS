import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { MapPin, Wifi, Smartphone, AlertTriangle, CheckCircle, X, RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LocationVerificationProps {
  onVerificationSuccess: () => void;
  onVerificationFailed: () => void;
  officeLocation: {
    lat: number;
    lng: number;
    radius: number; // meters
    address: string;
  };
}

const LocationVerification: React.FC<LocationVerificationProps> = ({
  onVerificationSuccess,
  onVerificationFailed,
  officeLocation
}) => {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'gps' | 'ip' | 'manual'>('gps');

  // Detect iOS device
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    console.log('📱 Device detection:', { isIOS: isIOSDevice, userAgent });
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Handle iOS CoreLocation specific errors
  const handleIOSLocationError = (error: GeolocationPositionError): string => {
    console.error('🍎 iOS CoreLocation error:', error);
    
    // iOS specific error handling
    if (isIOS) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return 'Location permission denied on iOS. Please go to Settings → Privacy & Security → Location Services and enable for this app.';
        case error.POSITION_UNAVAILABLE:
          return 'iOS CoreLocation cannot determine your position. This often happens indoors or with poor GPS signal. Try moving to a window or going outside.';
        case error.TIMEOUT:
          return 'iOS location request timed out. This may be due to poor GPS signal or location services being temporarily unavailable.';
        default:
          return `iOS location error: ${error.message}. Try restarting the app or checking location settings.`;
      }
    }
    
    // Generic error handling for other devices
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission denied. Please enable location services in your browser settings.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable. Please try again or use alternative verification.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return `Location error: ${error.message}`;
    }
  };

  // Get IP-based location as fallback
  const getIPLocation = async (): Promise<{lat: number, lng: number, accuracy: number}> => {
    try {
      console.log('🌐 Attempting IP-based location...');
      
      // Use a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('🌐 IP location obtained:', data);
        return {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          accuracy: 5000 // IP location is much less accurate
        };
      } else {
        throw new Error('IP location data invalid');
      }
    } catch (error) {
      console.error('🌐 IP location failed:', error);
      throw new Error('Unable to get location from IP address');
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      // iOS-specific options
      const options = {
        enableHighAccuracy: isIOS ? false : true, // iOS often works better with standard accuracy
        timeout: isIOS ? 20000 : 15000, // Longer timeout for iOS
        maximumAge: 0
      };

      console.log('📍 Location request options:', { isIOS, options });

      const successCallback = (position: GeolocationPosition) => {
        console.log('📍 Location obtained successfully:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isIOS
        });
        resolve(position);
      };

      const errorCallback = (error: GeolocationPositionError) => {
        const errorMessage = handleIOSLocationError(error);
        console.error('📍 Location error details:', {
          code: error.code,
          message: error.message,
          isIOS,
          userAgent: navigator.userAgent
        });
        reject(new Error(errorMessage));
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    });
  };

  const verifyLocation = async () => {
    setIsLoading(true);
    setError('');
    setLocationMethod('gps');

    try {
      console.log('📍 Starting GPS location verification...');
      
      // Try GPS location first
      const position = await getCurrentLocation();
      
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      setCurrentLocation(userLocation);

      // Calculate distance from office
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        officeLocation.lat,
        officeLocation.lng
      );

      console.log('📍 Distance calculation:', {
        userLocation,
        officeLocation,
        distance,
        allowedRadius: officeLocation.radius,
        accuracy: userLocation.accuracy,
        isIOS
      });

      // Check if within office radius (including GPS accuracy)
      const isWithinRange = distance <= (officeLocation.radius + userLocation.accuracy);

      if (isWithinRange) {
        setVerificationStatus('success');
        toast.success('Location verified! You are at the office.');
        onVerificationSuccess();
      } else {
        setVerificationStatus('failed');
        setError(`You are ${Math.round(distance)}m away from the office. Please come to the office to check in.`);
        onVerificationFailed();
      }

    } catch (err) {
      console.error('📍 GPS location verification failed:', err);
      
      // Try IP-based location as fallback
      if (retryCount >= 1) {
        try {
          console.log('📍 Trying IP-based location as fallback...');
          setLocationMethod('ip');
          
          const ipLocation = await getIPLocation();
          setCurrentLocation(ipLocation);
          
          const distance = calculateDistance(
            ipLocation.lat,
            ipLocation.lng,
            officeLocation.lat,
            officeLocation.lng
          );

          console.log('📍 IP-based distance calculation:', {
            ipLocation,
            officeLocation,
            distance,
            allowedRadius: officeLocation.radius
          });

          // IP location is less accurate, so we use a larger radius
          const isWithinRange = distance <= (officeLocation.radius + 10000); // 10km buffer for IP

          if (isWithinRange) {
            setVerificationStatus('success');
            toast.success('Location verified via IP! You appear to be in the office area.');
            onVerificationSuccess();
            return;
          } else {
            setError(`IP location shows you are ${Math.round(distance/1000)}km away from the office. Please come to the office to check in.`);
          }
        } catch (ipError) {
          console.error('📍 IP location also failed:', ipError);
        }
      }
      
      setVerificationStatus('failed');
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to verify your location. Please try again or use alternative verification.');
      }
      
      // Show fallback option after multiple failures
      if (retryCount >= 2) {
        setShowFallback(true);
      }
      
      onVerificationFailed();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError('');
    setVerificationStatus('pending');
    verifyLocation();
  };

  const handleFallbackVerification = () => {
    // For demonstration, we'll allow fallback verification
    // In a real implementation, this might involve:
    // - Manual verification by manager
    // - Alternative verification methods
    // - Temporary override with approval
    
    setVerificationStatus('success');
    toast.success('Fallback verification approved. Please ensure you are at the office.');
    onVerificationSuccess();
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'failed':
        return <X size={24} className="text-red-600" />;
      default:
        return <MapPin size={24} className="text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Location Verified';
      case 'failed':
        return 'Location Verification Failed';
      default:
        return 'Verify Location';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">Location Verification</h3>
        </div>

        <p className="text-sm text-gray-600">
          We need to verify that you are at the office before allowing check-in.
        </p>

        {/* Office Location Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Office Location</span>
          </div>
          <p className="text-sm text-blue-700">{officeLocation.address}</p>
          <p className="text-xs text-blue-600 mt-1">
            Allowed radius: {officeLocation.radius}m
          </p>
        </div>

        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Your Location</span>
              </div>
              <div className="flex items-center gap-1">
                {locationMethod === 'gps' && <MapPin size={12} className="text-green-600" />}
                {locationMethod === 'ip' && <WifiOff size={12} className="text-orange-600" />}
                <span className="text-xs text-gray-500 uppercase">
                  {locationMethod === 'gps' ? 'GPS' : locationMethod === 'ip' ? 'IP' : 'Manual'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Accuracy: ±{Math.round(currentLocation.accuracy)}m
              {locationMethod === 'ip' && ' (IP-based, less accurate)'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">Verification Failed</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            
            {/* Retry Button */}
            {retryCount < 3 && (
              <div className="mt-3">
                <GlassButton
                  onClick={handleRetry}
                  disabled={isLoading}
                  icon={<RefreshCw size={16} />}
                  className="bg-blue-600 text-white text-sm"
                >
                  Try Again ({3 - retryCount} attempts left)
                </GlassButton>
              </div>
            )}
          </div>
        )}

        {/* Fallback Option */}
        {showFallback && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Alternative Verification</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Location services are not working properly. You can use alternative verification methods.
            </p>
            <GlassButton
              onClick={handleFallbackVerification}
              className="bg-yellow-600 text-white"
            >
              Use Alternative Verification
            </GlassButton>
          </div>
        )}

        {/* Action Button */}
        {!showFallback && (
          <div className="flex gap-3">
            <GlassButton
              onClick={verifyLocation}
              disabled={isLoading}
              icon={<MapPin size={18} />}
              className={`flex-1 ${
                verificationStatus === 'success' 
                  ? 'bg-green-600 text-white' 
                  : verificationStatus === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isLoading ? 'Verifying...' : getStatusText()}
            </GlassButton>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Ensure location services are enabled on your device</p>
          <p>• Allow location access when prompted</p>
          <p>• You must be within {officeLocation.radius}m of the office</p>
          <p>• GPS accuracy will be considered in verification</p>
          <p>• If location fails, try refreshing the page or restarting your browser</p>
          
          {/* iOS-specific instructions */}
          {isIOS && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={14} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">iOS Device Detected</span>
              </div>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Go to Settings → Privacy & Security → Location Services</li>
                <li>• Ensure Location Services is ON</li>
                <li>• Find your browser and set to "While Using"</li>
                <li>• If indoors, try moving near a window</li>
                <li>• Restart the app if location still fails</li>
              </ul>
            </div>
          )}
        </div>

        {/* Troubleshooting Tips */}
        {error && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Troubleshooting Tips:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Check if location services are enabled in your device settings</li>
              <li>• Ensure you're using HTTPS (required for location access)</li>
              <li>• Try refreshing the page and allowing location access</li>
              <li>• If on mobile, ensure the app has location permissions</li>
              <li>• Try using a different browser or device</li>
            </ul>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default LocationVerification;
