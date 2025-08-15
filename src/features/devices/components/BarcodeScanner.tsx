import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassButton from '../../shared/components/ui/GlassButton';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

interface BarcodeScannerProps {
  onClose: () => void;
  onScan?: (result: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onClose, onScan }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanningSuccess, setScanningSuccess] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 2,
    }, false);

    setIsScanning(true);

    scanner.render((result) => {
      if (result) {
        if (onScan) {
          onScan(result);
          setScanningSuccess(true);
          setError('');
          setTimeout(() => {
            onClose();
          }, 500);
        } else {
          const deviceId = result;
          if (deviceId?.startsWith('DEV-')) {
            setScanningSuccess(true);
            setError('');
            setTimeout(() => {
              navigate(`/devices/${deviceId}`);
              onClose();
            }, 500);
          } else {
            setError('Invalid device QR code. Please scan a valid device barcode.');
            setScanningSuccess(false);
          }
        }
      }
    }, (error) => {
      if (error) {
        setError('Error accessing camera. Please check camera permissions.');
        setIsScanning(false);
        console.error(error);
      }
    });

    return () => {
      scanner.clear();
      setIsScanning(false);
    };
  }, [navigate, onClose, onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md sm:max-w-lg mx-auto bg-white rounded-lg shadow-xl overflow-hidden transform transition-all">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close scanner"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Camera size={20} className="sm:w-5 sm:h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Scan Device QR Code
            </h3>
          </div>
          
          <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
            <div id="reader" className="w-full h-full" />
            <div className="absolute inset-0 border-2 border-blue-500/50 pointer-events-none" />
            
            {/* Scanning indicator */}
            {isScanning && !scanningSuccess && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Scanning...
              </div>
            )}
            
            {/* Success indicator */}
            {scanningSuccess && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Found!
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              Point your camera at a device QR code to scan
            </p>
            
            <GlassButton
              onClick={onClose}
              variant="secondary"
              className="w-full text-sm"
            >
              Cancel Scan
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;