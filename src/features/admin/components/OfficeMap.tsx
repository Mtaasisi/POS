import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import { MapPin, Compass, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { googleMapsService } from '../../../lib/googleMapsService';

interface Office {
  name: string;
  lat: number;
  lng: number;
  radius: number;
  address: string;
  networks: {
    ssid: string;
    bssid?: string;
    description: string;
  }[];
}

interface OfficeMapProps {
  offices: Office[];
  selectedOffice?: Office | null;
  onOfficeSelect?: (office: Office) => void;
  showRadius?: boolean;
  className?: string;
}

const OfficeMap: React.FC<OfficeMapProps> = ({
  offices,
  selectedOffice,
  onOfficeSelect,
  showRadius = true,
  className = ''
}) => {
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        await googleMapsService.load();
        setIsMapLoaded(true);
      } catch (error) {
        console.error('❌ Failed to load Google Maps API:', error);
        setMapError(googleMapsService.getError() || 'Failed to load Google Maps API');
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapContainer || offices.length === 0) return;

    try {
      // Verify Google Maps API is properly loaded
      if (!googleMapsService.isReady()) {
        console.error('❌ Google Maps API not available');
        return;
      }

      const googleMaps = googleMapsService.getGoogleMaps();

      const center = offices[0] ? { lat: offices[0].lat, lng: offices[0].lng } : { lat: -3.359178, lng: 36.661366 };

      const newMap = new googleMaps.Map(mapContainer, {
        center,
        zoom: 13,
        mapTypeId: googleMaps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(newMap);
      console.log('✅ Map initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }, [isMapLoaded, mapContainer, offices]);

  // Add markers and circles
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    try {
      // Verify Google Maps API is properly loaded
      if (!googleMapsService.isReady()) {
        console.error('❌ Google Maps API not available for markers');
        return;
      }

      const googleMaps = googleMapsService.getGoogleMaps();

      // Clear existing markers and circles
      markers.forEach(marker => marker.setMap(null));
      circles.forEach(circle => circle.setMap(null));

      const newMarkers: any[] = [];
      const newCircles: any[] = [];

      offices.forEach((office, index) => {
        try {
          // Create marker
          const marker = new googleMaps.Marker({
            position: { lat: office.lat, lng: office.lng },
            map,
            title: office.name,
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            },
            icon: {
              path: googleMaps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: selectedOffice?.name === office.name ? '#3B82F6' : '#EF4444',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });

      // Create info window
      const infoWindow = new googleMaps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1F2937; font-weight: bold;">${office.name}</h3>
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px;">${office.address}</p>
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px;">
              <strong>Radius:</strong> ${office.radius}m
            </p>
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px;">
              <strong>WiFi Networks:</strong> ${office.networks.length}
            </p>
            <div style="margin-top: 8px;">
              ${office.networks.map(network => 
                `<div style="font-size: 11px; color: #059669;">📶 ${network.ssid}</div>`
              ).join('')}
            </div>
          </div>
        `
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onOfficeSelect) {
          onOfficeSelect(office);
        }
      });

      newMarkers.push(marker);

      // Create circle for radius
      if (showRadius) {
        const circle = new googleMaps.Circle({
          strokeColor: selectedOffice?.name === office.name ? '#3B82F6' : '#EF4444',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: selectedOffice?.name === office.name ? '#3B82F6' : '#EF4444',
          fillOpacity: 0.1,
          map,
          center: { lat: office.lat, lng: office.lng },
          radius: office.radius
        });

        newCircles.push(circle);
      }
        } catch (error) {
          console.error(`❌ Error creating marker/circle for office ${office.name}:`, error);
        }
      });

    setMarkers(newMarkers);
    setCircles(newCircles);

    // Fit bounds to show all offices
    if (offices.length > 1) {
      try {
        const bounds = new googleMaps.LatLngBounds();
        offices.forEach(office => {
          bounds.extend({ lat: office.lat, lng: office.lng });
        });
        map.fitBounds(bounds);
      } catch (error) {
        console.error('❌ Error fitting bounds:', error);
      }
    }
    } catch (error) {
      console.error('❌ Error in markers and circles creation:', error);
    }
  }, [map, offices, selectedOffice, showRadius, isMapLoaded]);

  // Update map when selected office changes
  useEffect(() => {
    if (!map || !selectedOffice) return;

    try {
      map.setCenter({ lat: selectedOffice.lat, lng: selectedOffice.lng });
      map.setZoom(15);
    } catch (error) {
      console.error('❌ Error updating map center:', error);
    }
  }, [map, selectedOffice]);

  if (!isMapLoaded) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            {mapError ? (
              <>
                <div className="text-red-500 mb-4">
                  <AlertCircle className="w-8 h-8 mx-auto" />
                </div>
                <p className="text-red-600 font-medium">Map Loading Failed</p>
                <p className="text-gray-600 text-sm mt-2">{mapError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </>
            )}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Office Locations Map
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Office</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
      
      <div 
        ref={setMapContainer}
        className="w-full h-80 rounded-lg border border-gray-200"
        style={{ minHeight: '320px' }}
      />
      
      <div className="mt-4 text-sm text-gray-600">
        <p>💡 Click on any office marker to view details and select it</p>
        <p>📍 Circles show the check-in radius for each office</p>
      </div>
    </GlassCard>
  );
};

export default OfficeMap;
