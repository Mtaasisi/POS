import { useState, useEffect } from 'react';
import { 
  getAttendanceSettings, 
  saveAttendanceSettings, 
  AttendanceSettings,
  defaultAttendanceSettings,
  detectNearestOffice,
  getOfficeByNameOrNearest
} from '../lib/attendanceSettingsApi';
import toast from 'react-hot-toast';

export const useAttendanceSettings = () => {
  const [settings, setSettings] = useState<AttendanceSettings>(defaultAttendanceSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const attendanceSettings = await getAttendanceSettings();
      setSettings(attendanceSettings);
    } catch (error) {
      console.error('Error loading attendance settings:', error);
      toast.error('Failed to load attendance settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: AttendanceSettings) => {
    try {
      setSaving(true);
      await saveAttendanceSettings(newSettings);
      setSettings(newSettings);
      toast.success('Attendance settings updated successfully');
    } catch (error) {
      console.error('Error updating attendance settings:', error);
      toast.error('Failed to update attendance settings');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = async (key: keyof AttendanceSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    await updateSettings(newSettings);
  };

  const getOfficeConfig = (officeName?: string) => {
    if (!officeName) {
      return settings.offices[0] || null;
    }
    
    return settings.offices.find(office => 
      office.name.toLowerCase().includes(officeName.toLowerCase())
    ) || settings.offices[0] || null;
  };

  const getAllOffices = () => {
    return settings.offices;
  };

  const isAttendanceEnabled = () => {
    return settings.enabled;
  };

  const getLocationRequirements = () => {
    return {
      requireLocation: settings.requireLocation,
      requireWifi: settings.requireWifi,
      allowMobileData: settings.allowMobileData,
      gpsAccuracy: settings.gpsAccuracy,
      checkInRadius: settings.checkInRadius
    };
  };

  const getTimeSettings = () => {
    return {
      checkInTime: settings.checkInTime,
      checkOutTime: settings.checkOutTime,
      gracePeriod: settings.gracePeriod
    };
  };

  // Auto-detect nearest office based on GPS coordinates
  const detectNearestOfficeByLocation = async (userLat: number, userLng: number) => {
    return await detectNearestOffice(userLat, userLng);
  };

  // Get office with smart detection (name, nearest, or default)
  const getOfficeWithDetection = async (
    officeName?: string, 
    userLat?: number, 
    userLng?: number
  ) => {
    return await getOfficeByNameOrNearest(officeName, userLat, userLng);
  };

  return {
    settings,
    loading,
    saving,
    updateSettings,
    updateSetting,
    getOfficeConfig,
    getAllOffices,
    isAttendanceEnabled,
    getLocationRequirements,
    getTimeSettings,
    detectNearestOfficeByLocation,
    getOfficeWithDetection,
    reload: loadSettings
  };
};
