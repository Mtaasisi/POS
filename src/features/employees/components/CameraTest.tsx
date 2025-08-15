import React, { useState, useRef, useCallback } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Camera, RotateCcw, CheckCircle, X, AlertTriangle, Play, Pause } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CameraTest: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraInfo, setCameraInfo] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      console.log('📸 Starting camera test...');
      setError('');
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      console.log('📸 Available cameras:', cameras);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 }
        },
        audio: false
      });

      console.log('📸 Camera stream obtained:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setIsPaused(false);
        
        // Get camera information
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          const track = tracks[0];
          const settings = track.getSettings();
          const capabilities = track.getCapabilities();
          
          setCameraInfo({
            deviceId: track.getSettings().deviceId,
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            capabilities: capabilities
          });
          
          console.log('📸 Camera settings:', settings);
          console.log('📸 Camera capabilities:', capabilities);
        }
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('📸 Video metadata loaded');
          videoRef.current?.play().catch(err => {
            console.error('📸 Error playing video:', err);
          });
        };
      }
    } catch (err: any) {
      console.error('📸 Camera test error:', err);
      
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
      toast.error(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsPaused(false);
    setCameraInfo(null);
    console.log('📸 Camera stopped');
  }, []);

  const togglePause = useCallback(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isPaused]);

  const testPhotoCapture = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context && videoRef.current.videoWidth > 0) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        console.log('📸 Test photo captured, size:', photoData.length, 'characters');
        
        toast.success('Test photo captured successfully!');
        
        // Create a download link for the test photo
        const link = document.createElement('a');
        link.download = 'camera-test-photo.jpg';
        link.href = photoData;
        link.click();
      } else {
        toast.error('Unable to capture test photo');
      }
    }
  }, []);

  return (
    <GlassCard className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Camera Test</h3>
        </div>

        <p className="text-sm text-gray-600">
          Test your camera functionality before using the attendance system.
        </p>

        {/* Camera View */}
        {isCameraActive && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            
            {/* Camera Status */}
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Camera Active</span>
              </div>
            </div>
            
            {/* Pause/Play Overlay */}
            {isPaused && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <Pause size={48} className="mx-auto mb-2" />
                  <p className="text-sm">Camera Paused</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camera Information */}
        {cameraInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Camera Information</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">Resolution:</span>
                <p>{cameraInfo.width} x {cameraInfo.height}</p>
              </div>
              <div>
                <span className="font-medium">Frame Rate:</span>
                <p>{cameraInfo.frameRate ? `${cameraInfo.frameRate} fps` : 'Unknown'}</p>
              </div>
              <div>
                <span className="font-medium">Device ID:</span>
                <p className="truncate">{cameraInfo.deviceId || 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">Camera Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isCameraActive ? (
            <GlassButton
              onClick={startCamera}
              icon={<Camera size={18} />}
              className="flex-1 bg-blue-600 text-white"
            >
              Start Camera Test
            </GlassButton>
          ) : (
            <>
              <GlassButton
                onClick={togglePause}
                icon={isPaused ? <Play size={18} /> : <Pause size={18} />}
                className="flex-1 bg-yellow-600 text-white"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </GlassButton>
              
              <GlassButton
                onClick={testPhotoCapture}
                icon={<Camera size={18} />}
                className="flex-1 bg-green-600 text-white"
              >
                Test Capture
              </GlassButton>
              
              <GlassButton
                onClick={stopCamera}
                icon={<X size={18} />}
                className="flex-1 bg-red-600 text-white"
              >
                Stop Camera
              </GlassButton>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Test Instructions:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Click "Start Camera Test" to begin</li>
            <li>• Ensure your face is clearly visible in the camera</li>
            <li>• Test the pause/resume functionality</li>
            <li>• Try "Test Capture" to save a sample photo</li>
            <li>• Check that the camera information is displayed correctly</li>
            <li>• If everything works, your camera is ready for attendance</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Troubleshooting:</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Allow camera permissions when prompted</li>
            <li>• Close other apps that might be using the camera</li>
            <li>• Try refreshing the page if camera doesn't start</li>
            <li>• Ensure you're using HTTPS (required for camera access)</li>
            <li>• Try a different browser if issues persist</li>
          </ul>
        </div>
      </div>
    </GlassCard>
  );
};

export default CameraTest;
