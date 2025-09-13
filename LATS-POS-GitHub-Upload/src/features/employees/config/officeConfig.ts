// Office Configuration
// This file contains office location settings for attendance verification

export interface OfficeLocation {
  lat: number;
  lng: number;
  radius: number; // meters
  address: string;
  name: string;
}

export interface OfficeNetwork {
  ssid: string;
  bssid?: string;
  description: string;
}

export interface OfficeConfig {
  location: OfficeLocation;
  networks: OfficeNetwork[];
}

// Main office configuration
export const mainOffice: OfficeConfig = {
  location: {
    lat: -3.359178, // Arusha coordinates
    lng: 36.661366,
    radius: 100, // 100 meters radius
    address: 'Main Office, Arusha, Tanzania',
    name: 'Arusha Main Office'
  },
  networks: [
    {
      ssid: 'Office_WiFi',
      bssid: '00:11:22:33:44:55',
      description: 'Main office WiFi network'
    },
    {
      ssid: 'Office_Guest',
      description: 'Guest WiFi network'
    },
    {
      ssid: '4G_Mobile', // For mobile data users
      description: 'Mobile data connection'
    },
    {
      ssid: 'Any_Network', // Allow any network for testing
      description: 'Any network connection'
    }
  ]
};

// Branch office configurations
export const branchOffices: OfficeConfig[] = [
  {
    location: {
      lat: -6.2088, // Dar es Salaam coordinates
      lng: 39.2083,
      radius: 100,
      address: 'Branch Office, Dar es Salaam, Tanzania',
      name: 'Dar es Salaam Branch'
    },
    networks: [
      {
        ssid: 'DSM_Office_WiFi',
        description: 'Dar es Salaam office WiFi'
      }
    ]
  },
  {
    location: {
      lat: -1.2921, // Nairobi coordinates
      lng: 36.8219,
      radius: 100,
      address: 'Branch Office, Nairobi, Kenya',
      name: 'Nairobi Branch'
    },
    networks: [
      {
        ssid: 'NBO_Office_WiFi',
        description: 'Nairobi office WiFi'
      }
    ]
  }
];

// Get office configuration by name
export const getOfficeConfig = (officeName: string = 'main'): OfficeConfig => {
  if (officeName === 'main') {
    return mainOffice;
  }
  
  const branch = branchOffices.find(office => 
    office.location.name.toLowerCase().includes(officeName.toLowerCase())
  );
  
  return branch || mainOffice;
};

// Get all office configurations
export const getAllOfficeConfigs = (): OfficeConfig[] => {
  return [mainOffice, ...branchOffices];
};

// Validate office location
export const validateOfficeLocation = (location: OfficeLocation): boolean => {
  return (
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    typeof location.radius === 'number' &&
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180 &&
    location.radius > 0
  );
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

// Check if location is within office radius
export const isWithinOfficeRadius = (
  userLat: number, 
  userLng: number, 
  officeLocation: OfficeLocation,
  userAccuracy: number = 0
): boolean => {
  const distance = calculateDistance(userLat, userLng, officeLocation.lat, officeLocation.lng);
  return distance <= (officeLocation.radius + userAccuracy);
};

// Get nearest office to user location
export const getNearestOffice = (userLat: number, userLng: number): OfficeConfig => {
  const allOffices = getAllOfficeConfigs();
  
  let nearestOffice = allOffices[0];
  let shortestDistance = Infinity;
  
  for (const office of allOffices) {
    const distance = calculateDistance(
      userLat, 
      userLng, 
      office.location.lat, 
      office.location.lng
    );
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestOffice = office;
    }
  }
  
  return nearestOffice;
};

// Development/testing configuration
export const devOfficeConfig: OfficeConfig = {
  location: {
    lat: -3.359178, // Arusha coordinates (for testing)
    lng: 36.661366,
    radius: 1000, // Larger radius for testing
    address: 'Test Office, Arusha, Tanzania',
    name: 'Test Office'
  },
  networks: [
    {
      ssid: 'Test_WiFi',
      description: 'Test WiFi network'
    }
  ]
};

// Export default configuration
export default mainOffice;
