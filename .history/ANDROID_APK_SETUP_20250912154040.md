# 🚀 LATS POS Android APK Setup Guide

## Quick Start

### 1. Prerequisites
Make sure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Android Studio** - [Download here](https://developer.android.com/studio)
- **Java Development Kit (JDK 11+)** - Usually comes with Android Studio

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Android APK

#### Option A: Using the Build Script (Recommended)
```bash
./build-android-pos.sh
```

#### Option B: Manual Steps
```bash
# 1. Build the POS-only web app
npm run build:pos

# 2. Initialize Capacitor (first time only)
npm run android:init
npm run android:add

# 3. Sync with Android platform
npm run android:sync

# 4. Open Android Studio to build APK
npm run android:dev
```

### 4. Build APK in Android Studio
1. Android Studio will open automatically
2. Wait for Gradle sync to complete
3. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. The APK will be generated in: `android/app/build/outputs/apk/debug/`

## 📱 What's Included in POS APK

### ✅ Core POS Features
- Point of Sale interface
- Product search and selection
- Shopping cart management
- Payment processing (Cash, M-Pesa, Cards)
- Receipt generation and printing
- Customer management
- Inventory management
- Sales reporting
- Loyalty points system

### ✅ Technical Features
- Offline support
- Barcode scanning
- Bluetooth printer support
- Real-time data sync
- Touch-optimized interface

### ❌ Excluded (for future modules)
- Device management
- Diagnostic tools
- Employee management
- WhatsApp integration
- Purchase orders
- Advanced analytics

## 🔧 Configuration Files Created

- `capacitor.config.ts` - Capacitor configuration
- `src/App-POS-Only.tsx` - POS-only app component
- `src/main-POS-Only.tsx` - POS-only entry point
- `vite.config.pos.ts` - Vite build configuration for POS
- `build-android-pos.sh` - Automated build script
- `android-pos-config.md` - Detailed configuration guide

## 🛠️ Troubleshooting

### Common Issues

**"SDK not found" error:**
```bash
# Set Android SDK path (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**"Module not found" errors:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**APK build fails:**
```bash
# Check Capacitor doctor
npx cap doctor

# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run android:sync
```

### Debug Commands
```bash
# Check connected devices
adb devices

# View app logs
adb logcat | grep "LATS"

# Install APK directly
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 📋 Build Commands Reference

| Command | Description |
|---------|-------------|
| `npm run build:pos` | Build POS-only web app |
| `npm run android:build` | Build web app + sync + build APK |
| `npm run android:dev` | Build + sync + open Android Studio |
| `npm run android:run` | Run on connected device/emulator |
| `npm run android:sync` | Sync web app with Android platform |

## 🎯 Next Steps

1. **Test the APK** on a real device or emulator
2. **Customize app icon** in `android/app/src/main/res/mipmap-*/`
3. **Configure app name** in `android/app/src/main/res/values/strings.xml`
4. **Sign the APK** for distribution (production builds)

## 📞 Support

If you encounter issues:
1. Check the build logs in the terminal
2. Review `android-pos-config.md` for detailed configuration
3. Ensure all prerequisites are properly installed
4. Try the troubleshooting steps above

---

**Happy Building! 🎉**
