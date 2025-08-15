import React, { useState, useRef, useCallback } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Camera, RotateCcw, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PhotoVerificationProps {
  onVerificationSuccess: (photoData: string) => void;
  onVerificationFailed: () => void;
  employeeName: string;
}

const PhotoVerification: React.FC<PhotoVerificationProps> = ({
  onVerificationSuccess,
  onVerificationFailed,
  employeeName
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      console.log('📸 Starting camera...');
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Request camera access with better error handling
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Use front camera for selfie
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          aspectRatio: { ideal: 4/3 }
        },
        audio: false
      });

      console.log('📸 Camera stream obtained:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setError('');
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('📸 Video metadata loaded');
          videoRef.current?.play().catch(err => {
            console.error('📸 Error playing video:', err);
          });
        };
      }
    } catch (err: any) {
      console.error('📸 Camera error:', err);
      
      let errorMessage = 'Unable to access camera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not met. Please try again.';
      } else if (err.name === 'TypeError') {
        errorMessage = 'Camera not supported. Please use a different browser or device.';
      }
      
      setError(errorMessage);
      onVerificationFailed();
    }
  }, [onVerificationFailed]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    console.log('📸 Capturing photo...');
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        console.log('📸 Canvas size:', canvas.width, 'x', canvas.height);

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 with good quality
        const photoData = canvas.toDataURL('image/jpeg', 0.9);
        console.log('📸 Photo captured, size:', photoData.length, 'characters');
        
        setCapturedPhoto(photoData);
        stopCamera();
        
        toast.success('Photo captured successfully!');
      } else {
        console.error('📸 Video not ready or context not available');
        setError('Camera not ready. Please wait a moment and try again.');
      }
    } else {
      console.error('📸 Video or canvas refs not available');
      setError('Camera not available. Please restart the camera.');
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setVerificationStatus('pending');
    setError('');
    startCamera();
  }, [startCamera]);

  const verifyPhoto = useCallback(async () => {
    if (!capturedPhoto) {
      setError('Please capture a photo first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would:
      // 1. Send the photo to a server for face recognition
      // 2. Compare with employee's stored photo
      // 3. Check for liveness detection (blink, smile, etc.)
      // 4. Verify timestamp and metadata

      // For demonstration, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate verification success (in real app, this would be based on actual verification)
      const isVerified = Math.random() > 0.1; // 90% success rate for demo

      if (isVerified) {
        setVerificationStatus('success');
        toast.success('Photo verification successful!');
        onVerificationSuccess(capturedPhoto);
      } else {
        setVerificationStatus('failed');
        setError('Photo verification failed. Please ensure your face is clearly visible and try again.');
        onVerificationFailed();
      }
    } catch (err) {
      setVerificationStatus('failed');
      setError('Verification failed. Please try again.');
      onVerificationFailed();
    } finally {
      setIsLoading(false);
    }
  }, [capturedPhoto, onVerificationSuccess, onVerificationFailed]);

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'failed':
        return <X size={24} className="text-red-600" />;
      default:
        return <Camera size={24} className="text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Photo Verified';
      case 'failed':
        return 'Photo Verification Failed';
      default:
        return 'Take Photo';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">Photo Verification</h3>
        </div>

        <p className="text-sm text-gray-600">
          Please take a photo to verify your identity and presence at the office.
        </p>

        {/* Camera View */}
        {isCameraActive && !capturedPhoto && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed rounded-lg p-4">
                <p className="text-white text-sm">Position your face in the frame</p>
              </div>
            </div>
            {/* Camera Status Indicator */}
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Camera Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Captured Photo */}
        {capturedPhoto && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <img
              src={capturedPhoto}
              alt="Captured photo"
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 right-2">
              <GlassButton
                onClick={retakePhoto}
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={16} />}
                className="bg-white/80 text-gray-800 hover:bg-white"
              >
                Retake
              </GlassButton>
            </div>
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isCameraActive && !capturedPhoto && (
            <GlassButton
              onClick={startCamera}
              icon={<Camera size={18} />}
              className="flex-1 bg-blue-600 text-white"
            >
              Start Camera
            </GlassButton>
          )}

          {isCameraActive && !capturedPhoto && (
            <GlassButton
              onClick={capturePhoto}
              icon={<Camera size={18} />}
              className="flex-1 bg-green-600 text-white"
            >
              Capture Photo
            </GlassButton>
          )}

          {capturedPhoto && verificationStatus === 'pending' && (
            <GlassButton
              onClick={verifyPhoto}
              disabled={isLoading}
              icon={<CheckCircle size={18} />}
              className="flex-1 bg-blue-600 text-white"
            >
              {isLoading ? 'Verifying...' : 'Verify Photo'}
            </GlassButton>
          )}

          {capturedPhoto && verificationStatus === 'success' && (
            <div className="flex-1 text-center text-sm text-green-600 py-2">
              Photo verified successfully
            </div>
          )}

          {capturedPhoto && verificationStatus === 'failed' && (
            <GlassButton
              onClick={retakePhoto}
              icon={<RotateCcw size={18} />}
              className="flex-1 bg-red-600 text-white"
            >
              Retake Photo
            </GlassButton>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Ensure good lighting for clear photo</p>
          <p>• Position your face clearly in the frame</p>
          <p>• Remove sunglasses or hats that obscure your face</p>
          <p>• Photo will be used for attendance verification only</p>
        </div>

        {/* Camera Troubleshooting */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Camera Troubleshooting:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Check if camera permissions are granted in browser settings</li>
              <li>• Ensure no other apps are using the camera</li>
              <li>• Try refreshing the page and allowing camera access</li>
              <li>• If on mobile, ensure the app has camera permissions</li>
              <li>• Try using a different browser (Chrome, Firefox, Safari)</li>
              <li>• Ensure you're using HTTPS (required for camera access)</li>
            </ul>
          </div>
        )}

        {/* Privacy Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Privacy Notice</p>
            <p className="text-xs">
              Your photo will be used solely for attendance verification and will be stored securely. 
              It will not be shared with third parties without your consent.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default PhotoVerification;
