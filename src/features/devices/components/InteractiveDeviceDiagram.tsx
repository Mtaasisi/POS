import React, { useState } from 'react';
import { Smartphone, Monitor, Tablet, Laptop } from 'lucide-react';

interface ProblemArea {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  severity: 'low' | 'medium' | 'high';
}

interface DeviceDiagramProps {
  deviceType: 'smartphone' | 'laptop' | 'tablet' | 'desktop';
  problemAreas: ProblemArea[];
  onAreaClick?: (area: ProblemArea) => void;
  selectedArea?: string;
}

const InteractiveDeviceDiagram: React.FC<DeviceDiagramProps> = ({
  deviceType,
  problemAreas,
  onAreaClick,
  selectedArea
}) => {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'smartphone':
        return <Smartphone size={120} className="text-gray-400" />;
      case 'laptop':
        return <Laptop size={120} className="text-gray-400" />;
      case 'tablet':
        return <Tablet size={120} className="text-gray-400" />;
      case 'desktop':
        return <Monitor size={120} className="text-gray-400" />;
      default:
        return <Smartphone size={120} className="text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'Critical';
      case 'medium':
        return 'Moderate';
      case 'low':
        return 'Minor';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Analysis</h3>
      
      {/* Device Diagram */}
      <div className="relative flex justify-center items-center min-h-[200px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="relative">
          {getDeviceIcon()}
          
          {/* Problem Area Indicators */}
          {problemAreas.map((area) => (
            <div
              key={area.id}
              className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transition-all duration-200 ${
                getSeverityColor(area.severity)
              } ${
                selectedArea === area.id ? 'ring-4 ring-blue-300 scale-125' : ''
              } ${
                hoveredArea === area.id ? 'scale-110' : ''
              }`}
              style={{
                left: `${area.x}%`,
                top: `${area.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => onAreaClick?.(area)}
              onMouseEnter={() => setHoveredArea(area.id)}
              onMouseLeave={() => setHoveredArea(null)}
              title={area.name}
            />
          ))}
        </div>
      </div>

      {/* Problem Areas Legend */}
      <div className="mt-4 space-y-2">
        <h4 className="font-medium text-gray-900">Problem Areas:</h4>
        {problemAreas.map((area) => (
          <div
            key={area.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              selectedArea === area.id 
                ? 'bg-blue-50 border border-blue-200' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onAreaClick?.(area)}
          >
            <div className={`w-3 h-3 rounded-full ${getSeverityColor(area.severity)}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{area.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  area.severity === 'high' ? 'bg-red-100 text-red-700' :
                  area.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {getSeverityText(area.severity)}
                </span>
              </div>
              <p className="text-xs text-gray-600">{area.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hover Tooltip */}
      {hoveredArea && (
        <div className="absolute bg-gray-900 text-white text-xs rounded-lg px-2 py-1 z-10 pointer-events-none">
          {problemAreas.find(area => area.id === hoveredArea)?.name}
        </div>
      )}
    </div>
  );
};

export default InteractiveDeviceDiagram;
