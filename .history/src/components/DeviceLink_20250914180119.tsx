import React from 'react';
import { Link } from 'react-router-dom';

interface DeviceLinkProps {
  deviceId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Component to create a link to a device detail page
 * Usage: <DeviceLink deviceId="your-device-id">Link Text</DeviceLink>
 */
const DeviceLink: React.FC<DeviceLinkProps> = ({ deviceId, children, className = "" }) => {
  return (
    <Link 
      to={`/devices/${deviceId}`}
      className={`text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`}
    >
      {children}
    </Link>
  );
};

export default DeviceLink;
