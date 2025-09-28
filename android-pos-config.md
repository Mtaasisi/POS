# LATS POS Android APK Configuration

## Overview
This document outlines the configuration for building a POS-only Android APK from the LATS CHANCE application.

## Key Features Included in POS-Only APK
- ✅ Point of Sale (POS) system
- ✅ Product inventory management
- ✅ Customer management
- ✅ Sales reporting
- ✅ Payment processing
- ✅ Receipt generation
- ✅ Loyalty points system
- ✅ Basic settings

## Excluded Features (for future modules)
- ❌ Device management
- ❌ Diagnostic tools
- ❌ Employee management
- ❌ Advanced analytics
- ❌ WhatsApp integration
- ❌ Purchase orders
- ❌ Shipping management
- ❌ Backup management

## Build Process

### Prerequisites
1. Node.js (v16 or higher)
2. npm
3. Android Studio (for final APK building)
4. Java Development Kit (JDK 11 or higher)

### Quick Build Commands

```bash
# Build POS-only web app and sync with Android
npm run android:build

# Open Android Studio for final APK building
npm run android:dev

# Run on connected Android device/emulator
npm run android:run
```

### Detailed Build Process

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build POS-Only Web App**
   ```bash
   npm run build:pos
   ```

3. **Initialize Capacitor (first time only)**
   ```bash
   npm run android:init
   npm run android:add
   ```

4. **Sync with Android Platform**
   ```bash
   npm run android:sync
   ```

5. **Build APK**
   ```bash
   npx cap build android
   ```

### Using the Build Script
For automated building, use the provided script:
```bash
./build-android-pos.sh
```

## App Configuration

### App Details
- **App Name**: LATS POS
- **Package ID**: com.lats.pos
- **Version**: 1.0.0
- **Target SDK**: 34 (Android 14)
- **Minimum SDK**: 21 (Android 5.0)

### Permissions
The POS app requires the following permissions:
- `INTERNET` - For API calls and data synchronization
- `CAMERA` - For barcode scanning
- `WRITE_EXTERNAL_STORAGE` - For receipt storage
- `READ_EXTERNAL_STORAGE` - For accessing stored receipts
- `ACCESS_NETWORK_STATE` - For network connectivity checks

### Features Configuration
- **Offline Support**: Yes (limited)
- **Barcode Scanning**: Yes
- **Receipt Printing**: Yes (via Bluetooth)
- **Payment Integration**: Yes (M-Pesa, Cards)
- **Real-time Sync**: Yes

## File Structure
```
src/
├── App-POS-Only.tsx          # POS-only app component
├── main-POS-Only.tsx         # POS-only entry point
├── features/lats/            # LATS features (POS, inventory, etc.)
├── features/customers/       # Customer management
├── features/shared/          # Shared components
└── context/                  # React contexts

android/                      # Android native project
├── app/
│   ├── src/main/
│   │   ├── java/            # Java source code
│   │   ├── res/             # Android resources
│   │   └── AndroidManifest.xml
│   └── build.gradle         # App-level build config
└── build.gradle             # Project-level build config
```

## Customization Options

### App Icon
Replace the default icons in:
- `android/app/src/main/res/mipmap-*/`

### Splash Screen
Configure in `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: "#1e40af",
    // ... other options
  }
}
```

### App Name
Update in:
- `android/app/src/main/res/values/strings.xml`
- `capacitor.config.ts`

## Troubleshooting

### Common Issues

1. **Build Fails with "SDK not found"**
   - Install Android SDK via Android Studio
   - Set `ANDROID_HOME` environment variable

2. **"Module not found" errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that all required features are properly imported

3. **APK too large**
   - The POS-only build excludes many features to reduce size
   - Consider enabling ProGuard for additional optimization

4. **Permissions denied**
   - Check `android/app/src/main/AndroidManifest.xml` for required permissions
   - Ensure runtime permissions are handled in the app

### Debug Commands
```bash
# Check Capacitor configuration
npx cap doctor

# List connected devices
adb devices

# View logs
adb logcat
```

## Future Enhancements

### Planned Modules (Future APKs)
1. **Device Management APK**
   - Device tracking
   - Diagnostic tools
   - Repair management

2. **Admin APK**
   - User management
   - System settings
   - Analytics dashboard

3. **Communication APK**
   - WhatsApp integration
   - SMS management
   - Customer communication

## Support
For issues or questions regarding the Android POS build:
1. Check this documentation
2. Review the build logs
3. Ensure all prerequisites are installed
4. Contact the development team
