import { supabase } from './supabaseClient';

export interface AttendanceSettings {
  enabled: boolean;
  requireLocation: boolean;
  requireWifi: boolean;
  allowMobileData: boolean;
  gpsAccuracy: number;
  checkInRadius: number;
  checkInTime: string;
  checkOutTime: string;
  gracePeriod: number;
  offices: {
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
  }[];
}

// Default attendance settings
export const defaultAttendanceSettings: AttendanceSettings = {
  enabled: true,
  requireLocation: true,
  requireWifi: true,
  allowMobileData: true,
  gpsAccuracy: 50,
  checkInRadius: 100,
  checkInTime: '08:00',
  checkOutTime: '17:00',
  gracePeriod: 15,
  offices: [
    {
      name: 'Arusha Main Office',
      lat: -3.359178,
      lng: 36.661366,
      radius: 100,
      address: 'Main Office, Arusha, Tanzania',
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
          ssid: '4G_Mobile',
          description: 'Mobile data connection'
        }
      ]
    }
  ]
};

// Get attendance settings from database
export const getAttendanceSettings = async (): Promise<AttendanceSettings> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'attendance')
      .single();

    if (error) {
      console.error('Error fetching attendance settings:', error);
      return defaultAttendanceSettings;
    }

    if (data) {
      return JSON.parse(data.value);
    }

    return defaultAttendanceSettings;
  } catch (error) {
    console.error('Error fetching attendance settings:', error);
    return defaultAttendanceSettings;
  }
};

// Save attendance settings to database
export const saveAttendanceSettings = async (settings: AttendanceSettings): Promise<void> => {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'attendance',
        value: JSON.stringify(settings),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving attendance settings:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving attendance settings:', error);
    throw error;
  }
};

// Update specific attendance setting
export const updateAttendanceSetting = async (key: string, value: any): Promise<void> => {
  try {
    const currentSettings = await getAttendanceSettings();
    const updatedSettings = {
      ...currentSettings,
      [key]: value
    };

    await saveAttendanceSettings(updatedSettings);
  } catch (error) {
    console.error('Error updating attendance setting:', error);
    throw error;
  }
};

// Get office configuration by name
export const getOfficeConfig = (officeName: string = 'main'): AttendanceSettings['offices'][0] | null => {
  const settings = getAttendanceSettings();
  return settings.then(attendanceSettings => {
    const office = attendanceSettings.offices.find(office => 
      office.name.toLowerCase().includes(officeName.toLowerCase())
    );
    return office || attendanceSettings.offices[0] || null;
  });
};

// Get all office configurations
export const getAllOfficeConfigs = (): Promise<AttendanceSettings['offices']> => {
  return getAttendanceSettings().then(settings => settings.offices);
};

// Add new office
export const addOffice = async (office: AttendanceSettings['offices'][0]): Promise<void> => {
  try {
    const currentSettings = await getAttendanceSettings();
    const updatedSettings = {
      ...currentSettings,
      offices: [...currentSettings.offices, office]
    };

    await saveAttendanceSettings(updatedSettings);
  } catch (error) {
    console.error('Error adding office:', error);
    throw error;
  }
};

// Update office
export const updateOffice = async (officeIndex: number, office: AttendanceSettings['offices'][0]): Promise<void> => {
  try {
    const currentSettings = await getAttendanceSettings();
    const updatedOffices = [...currentSettings.offices];
    updatedOffices[officeIndex] = office;

    const updatedSettings = {
      ...currentSettings,
      offices: updatedOffices
    };

    await saveAttendanceSettings(updatedSettings);
  } catch (error) {
    console.error('Error updating office:', error);
    throw error;
  }
};

// Remove office
export const removeOffice = async (officeIndex: number): Promise<void> => {
  try {
    const currentSettings = await getAttendanceSettings();
    const updatedOffices = currentSettings.offices.filter((_, index) => index !== officeIndex);

    const updatedSettings = {
      ...currentSettings,
      offices: updatedOffices
    };

    await saveAttendanceSettings(updatedSettings);
  } catch (error) {
    console.error('Error removing office:', error);
    throw error;
  }
};

// Validate attendance settings
export const validateAttendanceSettings = (settings: AttendanceSettings): string[] => {
  const errors: string[] = [];

  if (settings.checkInRadius < 10) {
    errors.push('Check-in radius must be at least 10 meters');
  }

  if (settings.gpsAccuracy < 10) {
    errors.push('GPS accuracy must be at least 10 meters');
  }

  if (settings.gracePeriod < 0 || settings.gracePeriod > 60) {
    errors.push('Grace period must be between 0 and 60 minutes');
  }

  if (settings.offices.length === 0) {
    errors.push('At least one office must be configured');
  }

  settings.offices.forEach((office, index) => {
    if (!office.name.trim()) {
      errors.push(`Office ${index + 1}: Name is required`);
    }

    if (office.radius < 10) {
      errors.push(`Office ${index + 1}: Radius must be at least 10 meters`);
    }

    if (office.networks.length === 0) {
      errors.push(`Office ${index + 1}: At least one WiFi network must be configured`);
    }
  });

  return errors;
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Auto-detect office based on GPS coordinates
export const detectNearestOffice = async (userLat: number, userLng: number): Promise<{
  office: AttendanceSettings['offices'][0] | null;
  distance: number;
  isWithinRange: boolean;
}> => {
  try {
    const settings = await getAttendanceSettings();
    
    if (settings.offices.length === 0) {
      return {
        office: null,
        distance: Infinity,
        isWithinRange: false
      };
    }

    let nearestOffice: AttendanceSettings['offices'][0] | null = null;
    let shortestDistance = Infinity;

    // Find the nearest office
    for (const office of settings.offices) {
      const distance = calculateDistance(userLat, userLng, office.lat, office.lng);
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestOffice = office;
      }
    }

    if (!nearestOffice) {
      return {
        office: null,
        distance: Infinity,
        isWithinRange: false
      };
    }

    // Check if within the office's check-in radius
    const isWithinRange = shortestDistance <= nearestOffice.radius;

    return {
      office: nearestOffice,
      distance: shortestDistance,
      isWithinRange
    };
  } catch (error) {
    console.error('Error detecting nearest office:', error);
    return {
      office: null,
      distance: Infinity,
      isWithinRange: false
    };
  }
};

// Get office by name with fallback to nearest office
export const getOfficeByNameOrNearest = async (
  officeName?: string, 
  userLat?: number, 
  userLng?: number
): Promise<{
  office: AttendanceSettings['offices'][0] | null;
  distance?: number;
  isWithinRange?: boolean;
  detectionMethod: 'name' | 'nearest' | 'default';
}> => {
  try {
    const settings = await getAttendanceSettings();
    
    // If office name is provided, try to find it
    if (officeName) {
      const office = settings.offices.find(office => 
        office.name.toLowerCase().includes(officeName.toLowerCase())
      );
      
      if (office) {
        return {
          office,
          detectionMethod: 'name'
        };
      }
    }

    // If GPS coordinates are provided, detect nearest office
    if (userLat !== undefined && userLng !== undefined) {
      const detection = await detectNearestOffice(userLat, userLng);
      
      return {
        office: detection.office,
        distance: detection.distance,
        isWithinRange: detection.isWithinRange,
        detectionMethod: 'nearest'
      };
    }

    // Fallback to first office
    return {
      office: settings.offices[0] || null,
      detectionMethod: 'default'
    };
  } catch (error) {
    console.error('Error getting office:', error);
    return {
      office: null,
      detectionMethod: 'default'
    };
  }
};
