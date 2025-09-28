#!/bin/bash

# LATS POS Android APK Build Script
# This script builds a POS-only Android APK

set -e

echo "🚀 Starting LATS POS Android APK Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not installed. Please install npx first."
        exit 1
    fi
    
    print_success "All requirements are met!"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed!"
}

# Build POS-only web app
build_web_app() {
    print_status "Building POS-only web application..."
    npm run build:pos
    print_success "Web application built successfully!"
}

# Initialize Capacitor (if not already done)
init_capacitor() {
    if [ ! -d "android" ]; then
        print_status "Initializing Capacitor..."
        npm run android:init
        npm run android:add
        print_success "Capacitor initialized!"
    else
        print_status "Capacitor already initialized, skipping..."
    fi
}

# Sync with Android platform
sync_android() {
    print_status "Syncing with Android platform..."
    npx cap sync android
    print_success "Android platform synced!"
}

# Build Android APK
build_apk() {
    print_status "Building Android APK..."
    npx cap build android
    print_success "Android APK built successfully!"
}

# Open Android Studio (optional)
open_android_studio() {
    read -p "Do you want to open Android Studio? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Opening Android Studio..."
        npx cap open android
    fi
}

# Main build process
main() {
    print_status "Starting LATS POS Android APK build process..."
    
    check_requirements
    install_dependencies
    build_web_app
    init_capacitor
    sync_android
    build_apk
    open_android_studio
    
    print_success "🎉 Build process completed successfully!"
    print_status "APK file should be located in: android/app/build/outputs/apk/"
    print_warning "Note: You may need to sign the APK for distribution."
}

# Run main function
main "$@"
