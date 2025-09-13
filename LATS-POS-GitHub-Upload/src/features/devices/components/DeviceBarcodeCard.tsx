import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { Printer } from 'lucide-react';

interface DeviceBarcodeCardProps {
  deviceId: string;
  onPrint?: () => void;
}

const DeviceBarcodeCard: React.FC<DeviceBarcodeCardProps> = ({ deviceId, onPrint }) => {
  return (
    <GlassCard>
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
          <QRCodeSVG
            value={deviceId}
            size={170}
            level="H"
            includeMargin
          />
        </div>
        
        <p className="font-mono text-lg font-bold text-gray-900 mb-4">
          {deviceId}
        </p>
        
        {onPrint && (
          <GlassButton
            onClick={onPrint}
            icon={<Printer size={18} />}
          >
            Print Barcode
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
};

export default DeviceBarcodeCard;