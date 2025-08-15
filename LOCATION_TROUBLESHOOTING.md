# Location Verification Troubleshooting Guide

## CoreLocation Error: `kCLErrorLocationUnknown`

This error occurs when the iOS CoreLocation framework cannot determine the device's location. Here's how to resolve it:

### 🔧 **Immediate Solutions**

#### **1. Check Location Services**
- **Settings → Privacy & Security → Location Services**
- Ensure Location Services is **ON**
- Find your browser/app and set to **"While Using"** or **"Always"**

#### **2. Check Browser Permissions**
- **Safari**: Settings → Safari → Location → Allow
- **Chrome**: Settings → Privacy & Security → Location → Allow
- **Firefox**: Settings → Privacy & Security → Location → Allow

#### **3. Restart Location Services**
1. **Settings → Privacy & Security → Location Services**
2. **Toggle OFF** then **ON**
3. **Wait 30 seconds** before trying again

#### **4. Restart Device**
- **Power off** your device completely
- **Wait 10 seconds**
- **Power on** and try again

---

### 📱 **Device-Specific Solutions**

#### **iPhone/iPad**
1. **Settings → General → Reset → Reset Location & Privacy**
2. **Settings → Privacy & Security → Location Services → System Services**
3. **Enable "Setting Time Zone"** and **"System Customization"**
4. **Settings → Privacy & Security → Location Services → Significant Locations**
5. **Enable "Significant Locations"**

#### **Android**
1. **Settings → Location → Mode → High accuracy**
2. **Settings → Apps → [Browser] → Permissions → Location → Allow**
3. **Settings → Location → Google Location Accuracy → ON**

#### **Desktop Browsers**
1. **Chrome**: `chrome://settings/content/location`
2. **Firefox**: `about:preferences#privacy` → Location
3. **Safari**: Safari → Preferences → Websites → Location

---

### 🌐 **Browser-Specific Issues**

#### **Safari (iOS)**
```javascript
// Common Safari location issues:
// 1. HTTPS required
// 2. User interaction required
// 3. Permission must be granted

// Solution: Ensure HTTPS and user interaction
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    success => console.log('Location:', success),
    error => console.error('Error:', error),
    { enableHighAccuracy: true, timeout: 15000 }
  );
}
```

#### **Chrome (Mobile)**
```javascript
// Chrome mobile location issues:
// 1. Permission prompt may be blocked
// 2. Location services may be disabled
// 3. GPS may be turned off

// Solution: Check permissions and GPS
const checkLocationPermission = async () => {
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    console.log('Permission status:', permission.state);
    return permission.state === 'granted';
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};
```

#### **Firefox (Mobile)**
```javascript
// Firefox mobile location issues:
// 1. Location services may be disabled
// 2. Permission may be denied
// 3. GPS may not be available

// Solution: Check location availability
const checkLocationAvailable = () => {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return false;
  }
  
  // Test location availability
  navigator.geolocation.getCurrentPosition(
    () => console.log('Location available'),
    (error) => console.error('Location error:', error),
    { timeout: 5000 }
  );
};
```

---

### 🛠️ **Technical Solutions**

#### **1. Force Location Update**
```javascript
// Force location services to update
const forceLocationUpdate = () => {
  // Clear any cached location
  if (navigator.geolocation && navigator.geolocation.clearWatch) {
    navigator.geolocation.clearWatch();
  }
  
  // Request fresh location with high accuracy
  navigator.geolocation.getCurrentPosition(
    position => {
      console.log('Fresh location:', position);
    },
    error => {
      console.error('Location error:', error);
      // Show user-friendly error message
      showLocationError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    }
  );
};
```

#### **2. Progressive Location Enhancement**
```javascript
// Try multiple location methods
const getLocationProgressive = async () => {
  // Method 1: High accuracy GPS
  try {
    const position = await getHighAccuracyLocation();
    return position;
  } catch (error) {
    console.log('High accuracy failed, trying standard...');
  }
  
  // Method 2: Standard accuracy
  try {
    const position = await getStandardLocation();
    return position;
  } catch (error) {
    console.log('Standard accuracy failed, trying IP...');
  }
  
  // Method 3: IP-based location (fallback)
  try {
    const position = await getIPLocation();
    return position;
  } catch (error) {
    throw new Error('All location methods failed');
  }
};
```

#### **3. Error Handling and Retry Logic**
```javascript
// Robust location handling with retries
const getLocationWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📍 Location attempt ${attempt}/${maxRetries}`);
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
      
      console.log('📍 Location obtained successfully:', position);
      return position;
      
    } catch (error) {
      console.error(`📍 Location attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};
```

---

### 🔍 **Diagnostic Tools**

#### **1. Location Status Checker**
```javascript
// Check location services status
const checkLocationStatus = () => {
  const status = {
    geolocationSupported: !!navigator.geolocation,
    https: window.location.protocol === 'https:',
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    permissions: null
  };
  
  // Check permissions if available
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(permission => {
        status.permissions = permission.state;
        console.log('📍 Location status:', status);
      });
  }
  
  return status;
};
```

#### **2. Location Test Function**
```javascript
// Test location functionality
const testLocation = () => {
  console.log('🧪 Testing location services...');
  
  if (!navigator.geolocation) {
    console.error('❌ Geolocation not supported');
    return false;
  }
  
  navigator.geolocation.getCurrentPosition(
    position => {
      console.log('✅ Location test successful:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp)
      });
      return true;
    },
    error => {
      console.error('❌ Location test failed:', {
        code: error.code,
        message: error.message
      });
      return false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};
```

---

### 📋 **Troubleshooting Checklist**

#### **Before Contacting Support**

- [ ] **Location Services Enabled** (Settings → Privacy → Location Services)
- [ ] **Browser Permissions Granted** (Browser settings → Location → Allow)
- [ ] **HTTPS Connection** (Required for location access)
- [ ] **User Interaction** (Click/tap required to trigger location)
- [ ] **GPS Enabled** (Device location settings)
- [ ] **Internet Connection** (Required for location services)
- [ ] **Browser Updated** (Latest version)
- [ ] **Device Restarted** (After changing settings)
- [ ] **Different Browser Tested** (Safari, Chrome, Firefox)
- [ ] **Different Device Tested** (If available)

#### **Advanced Troubleshooting**

- [ ] **Clear Browser Cache** (Settings → Safari → Clear History)
- [ ] **Reset Location & Privacy** (Settings → General → Reset)
- [ ] **Check System Services** (Settings → Privacy → Location → System Services)
- [ ] **Verify Network Connection** (WiFi/Cellular)
- [ ] **Test in Incognito Mode** (Private browsing)
- [ ] **Check for VPN** (May interfere with location)

---

### 🆘 **When to Contact Support**

Contact technical support if:

1. **All troubleshooting steps completed** without success
2. **Multiple devices/browsers** show the same error
3. **Location works in other apps** but not in this system
4. **Error persists** after device restart and settings reset
5. **Security concerns** about location access

#### **Information to Provide**

- **Device Model**: iPhone 14, Samsung Galaxy S23, etc.
- **Operating System**: iOS 17.1, Android 14, etc.
- **Browser**: Safari 17.1, Chrome 119, etc.
- **Error Message**: Exact error text
- **Steps Taken**: What troubleshooting was attempted
- **Screenshots**: Error messages and settings screens

---

### 🔒 **Privacy and Security**

#### **Location Data Usage**
- **Purpose**: Attendance verification only
- **Storage**: Encrypted and secure
- **Retention**: Limited time period
- **Sharing**: Never shared with third parties
- **Access**: Only authorized personnel

#### **User Rights**
- **Opt-out**: Can disable location services
- **Delete**: Can request data deletion
- **View**: Can access their location history
- **Control**: Can manage location permissions

---

### 📞 **Support Contact**

**Technical Support**: support@company.com  
**Phone**: +255 XXX XXX XXX  
**Hours**: Monday-Friday, 8:00 AM - 6:00 PM EAT

**Emergency Support**: Available 24/7 for critical issues
