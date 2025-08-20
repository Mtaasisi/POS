import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import LocationVerification from './LocationVerification';
import NetworkVerification from './NetworkVerification';
import PhotoVerification from './PhotoVerification';
import AutoLocationVerification from './AutoLocationVerification';
import { Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAttendanceSettings } from '../../../hooks/useAttendanceSettings';

interface SecureAttendanceVerificationProps {
  onAllVerificationsComplete: () => void;
  onVerificationFailed: () => void;
  employeeName: string;
  officeLocation: {
    lat: number;
    lng: number;
    radius: number;
    address: string;
  };
  officeNetworks: {
    ssid: string;
    bssid?: string;
    description: string;
  }[];
}

type VerificationStep = 'location' | 'network' | 'photo' | 'complete';

interface VerificationStatus {
  location: boolean;
  network: boolean;
  photo: boolean;
}

const SecureAttendanceVerification: React.FC<SecureAttendanceVerificationProps> = ({
  onAllVerificationsComplete,
  onVerificationFailed,
  employeeName,
  officeLocation,
  officeNetworks
}) => {
  const { settings: attendanceSettings } = useAttendanceSettings();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('location');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    location: false,
    network: false,
    photo: false
  });
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');

  // Determine which verification steps are required based on settings
  const requiresLocation = attendanceSettings.requireLocation;
  const requiresNetwork = attendanceSettings.requireWifi;
  const requiresPhoto = true; // Always require photo for security

  // Determine the first step based on requirements
  const getInitialStep = (): VerificationStep => {
    if (requiresLocation) return 'location';
    if (requiresNetwork) return 'network';
    return 'photo';
  };

  // State for auto-detected office
  const [detectedOffice, setDetectedOffice] = useState<any>(null);

  const handleLocationSuccess = () => {
    setVerificationStatus(prev => ({ ...prev, location: true }));
    
    // Determine next step based on requirements
    if (requiresNetwork) {
      setCurrentStep('network');
      toast.success('Location verified! Moving to network verification.');
    } else {
      setCurrentStep('photo');
      toast.success('Location verified! Moving to photo verification.');
    }
  };

  const handleLocationFailed = () => {
    setVerificationStatus(prev => ({ ...prev, location: false }));
    onVerificationFailed();
  };

  const handleAutoLocationSuccess = (officeInfo: any) => {
    setDetectedOffice(officeInfo.office);
    setVerificationStatus(prev => ({ ...prev, location: true }));
    
    // Determine next step based on requirements
    if (requiresNetwork) {
      setCurrentStep('network');
      toast.success(`Office detected: ${officeInfo.office.name}! Moving to network verification.`);
    } else {
      setCurrentStep('photo');
      toast.success(`Office detected: ${officeInfo.office.name}! Moving to photo verification.`);
    }
  };

  const handleAutoLocationFailed = () => {
    setVerificationStatus(prev => ({ ...prev, location: false }));
    onVerificationFailed();
  };

  const handleNetworkSuccess = () => {
    setVerificationStatus(prev => ({ ...prev, network: true }));
    setCurrentStep('photo');
    toast.success('Network verified! Moving to photo verification.');
  };

  const handleNetworkFailed = () => {
    setVerificationStatus(prev => ({ ...prev, network: false }));
    onVerificationFailed();
  };

  const handlePhotoSuccess = (photoData: string) => {
    setCapturedPhoto(photoData);
    setVerificationStatus(prev => ({ ...prev, photo: true }));
    setCurrentStep('complete');
    toast.success('Photo verified! All security checks passed.');
    onAllVerificationsComplete();
  };

  const handlePhotoFailed = () => {
    setVerificationStatus(prev => ({ ...prev, photo: false }));
    onVerificationFailed();
  };

  const getStepIcon = (step: VerificationStep) => {
    switch (step) {
      case 'location':
        return '📍';
      case 'network':
        return '📶';
      case 'photo':
        return '📷';
      case 'complete':
        return '✅';
      default:
        return '🔒';
    }
  };

  const getStepTitle = (step: VerificationStep) => {
    switch (step) {
      case 'location':
        return 'Location Verification';
      case 'network':
        return 'Network Verification';
      case 'photo':
        return 'Photo Verification';
      case 'complete':
        return 'All Verifications Complete';
      default:
        return 'Security Verification';
    }
  };

  const getStepDescription = (step: VerificationStep) => {
    switch (step) {
      case 'location':
        return 'Verify you are physically present at the office location.';
      case 'network':
        return 'Confirm you are connected to the office WiFi network.';
      case 'photo':
        return 'Take a photo to verify your identity and presence.';
      case 'complete':
        return 'All security verifications have been completed successfully.';
      default:
        return 'Multi-factor security verification process.';
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = Object.values(verificationStatus).filter(Boolean).length;
    return (completedSteps / 3) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield size={32} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Secure Attendance Verification</h2>
              <p className="text-gray-600">Multi-factor security verification required</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center">
            {(['location', 'network', 'photo'] as VerificationStep[]).map((step, index) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  verificationStatus[step as keyof VerificationStatus]
                    ? 'bg-green-500 text-white'
                    : currentStep === step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {verificationStatus[step as keyof VerificationStatus] ? '✓' : index + 1}
                </div>
                <span className="text-xs text-gray-600 mt-1 capitalize">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Current Step */}
      <GlassCard className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{getStepIcon(currentStep)}</span>
            <h3 className="text-xl font-semibold text-gray-900">{getStepTitle(currentStep)}</h3>
          </div>
          
          <p className="text-gray-600">{getStepDescription(currentStep)}</p>

          {/* Security Level Indicator */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">High Security Level</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This verification process ensures you are physically present at the office and prevents unauthorized check-ins.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Verification Components */}
      {currentStep === 'location' && (
        <AutoLocationVerification
          onVerificationSuccess={handleAutoLocationSuccess}
          onVerificationFailed={handleAutoLocationFailed}
          employeeName={employeeName}
        />
      )}

      {currentStep === 'network' && (
        <NetworkVerification
          onVerificationSuccess={handleNetworkSuccess}
          onVerificationFailed={handleNetworkFailed}
          officeNetworks={detectedOffice?.networks || officeNetworks}
        />
      )}

      {currentStep === 'photo' && (
        <PhotoVerification
          onVerificationSuccess={handlePhotoSuccess}
          onVerificationFailed={handlePhotoFailed}
          employeeName={employeeName}
        />
      )}

      {currentStep === 'complete' && (
        <GlassCard className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={32} className="text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">All Verifications Complete!</h3>
            </div>
            
            <p className="text-gray-600">
              You have successfully completed all security verifications. You can now proceed with your attendance.
            </p>

            {/* Verification Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Verification Summary</h4>
              <div className="space-y-2 text-sm">
                {requiresLocation && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-green-700">
                      Location verified - {detectedOffice ? `Detected: ${detectedOffice.name}` : 'You are at the office'}
                    </span>
                  </div>
                )}
                {requiresNetwork && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-green-700">Network verified - Connected to office WiFi</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-green-700">Photo verified - Identity confirmed</span>
                </div>
              </div>
            </div>

            <GlassButton
              onClick={onAllVerificationsComplete}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Proceed to Check In
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Security Information */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Why These Verifications?</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {requiresLocation && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📍</span>
                  <span className="font-medium text-blue-800">Location</span>
                </div>
                <p className="text-sm text-blue-700">
                  Ensures you are physically present at the office location using GPS coordinates.
                </p>
              </div>
            )}

            {requiresNetwork && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📶</span>
                  <span className="font-medium text-green-800">Network</span>
                </div>
                <p className="text-sm text-green-700">
                  Confirms you are connected to the office WiFi network, preventing remote check-ins.
                </p>
              </div>
            )}

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📷</span>
                <span className="font-medium text-purple-800">Photo</span>
              </div>
              <p className="text-sm text-purple-700">
                Verifies your identity and ensures you are the one performing the check-in.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-gray-600" />
              <span className="font-medium text-gray-800">Security Notice</span>
            </div>
            <p className="text-sm text-gray-700">
              These verifications are designed to prevent fraudulent attendance and ensure accurate time tracking. 
              All data is collected securely and used only for attendance purposes.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SecureAttendanceVerification;
