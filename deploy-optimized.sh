#!/bin/bash

# 🚀 LATS CHANCE - Optimized Deployment Script
# Enhanced deployment script with better error handling and platform-specific optimizations

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check build status
check_build() {
    print_status "Checking build status..."
    
    if [ ! -d "dist" ]; then
        print_warning "Build folder not found. Building application..."
        if command_exists npm; then
            npm run build
        else
            print_error "npm not found. Please install Node.js and npm first."
            exit 1
        fi
    fi
    
    if [ -d "dist" ]; then
        BUILD_SIZE=$(du -sh dist | cut -f1)
        FILE_COUNT=$(find dist -type f | wc -l)
        print_success "Build found: dist/ ($BUILD_SIZE, $FILE_COUNT files)"
    else
        print_error "Build failed. Please check for errors."
        exit 1
    fi
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Check for required files
    REQUIRED_FILES=("dist/index.html" "dist/manifest.webmanifest" "dist/sw.js")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file missing: $file"
            exit 1
        fi
    done
    
    print_success "Environment validation passed"
}

# Function to deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command_exists netlify; then
        print_warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    # Deploy with detailed output
    netlify deploy --dir=dist --prod --json | jq -r '.url' > .netlify_url 2>/dev/null || {
        print_error "Netlify deployment failed"
        return 1
    }
    
    DEPLOY_URL=$(cat .netlify_url)
    print_success "Deployed to Netlify: $DEPLOY_URL"
    rm -f .netlify_url
    
    # Open in browser
    if command_exists open; then
        open "$DEPLOY_URL"
    fi
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command_exists vercel; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy with production flag
    vercel --prod --yes | tee .vercel_output || {
        print_error "Vercel deployment failed"
        return 1
    }
    
    # Extract URL from output
    DEPLOY_URL=$(grep -o 'https://[^[:space:]]*' .vercel_output | tail -1)
    print_success "Deployed to Vercel: $DEPLOY_URL"
    rm -f .vercel_output
    
    # Open in browser
    if command_exists open; then
        open "$DEPLOY_URL"
    fi
}

# Function to deploy to Firebase
deploy_firebase() {
    print_status "Deploying to Firebase..."
    
    if ! command_exists firebase; then
        print_warning "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    
    # Check if firebase.json exists
    if [ ! -f "firebase.json" ]; then
        print_status "Initializing Firebase configuration..."
        firebase init hosting --public dist --yes || {
            print_error "Firebase initialization failed"
            return 1
        }
    fi
    
    # Deploy
    firebase deploy --only hosting | tee .firebase_output || {
        print_error "Firebase deployment failed"
        return 1
    }
    
    # Extract URL from output
    DEPLOY_URL=$(grep -o 'https://[^[:space:]]*' .firebase_output | head -1)
    print_success "Deployed to Firebase: $DEPLOY_URL"
    rm -f .firebase_output
    
    # Open in browser
    if command_exists open; then
        open "$DEPLOY_URL"
    fi
}

# Function to create deployment package
create_package() {
    print_status "Creating deployment package..."
    
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    PACKAGE_NAME="lats-deployment-$TIMESTAMP.tar.gz"
    
    tar -czf "$PACKAGE_NAME" dist/ || {
        print_error "Failed to create deployment package"
        return 1
    }
    
    PACKAGE_SIZE=$(du -sh "$PACKAGE_NAME" | cut -f1)
    print_success "Deployment package created: $PACKAGE_NAME ($PACKAGE_SIZE)"
}

# Function to show deployment info
show_info() {
    print_status "Deployment Information:"
    echo "=========================="
    echo "Build folder: dist/"
    echo "Main bundle: $(ls -lh dist/assets/index-*.js 2>/dev/null | head -1 | awk '{print $5}' || echo 'N/A')"
    echo "CSS bundle: $(ls -lh dist/assets/index-*.css 2>/dev/null | head -1 | awk '{print $5}' || echo 'N/A')"
    echo "Total files: $(find dist -type f 2>/dev/null | wc -l)"
    echo ""
    echo "PWA Features:"
    echo "- Service Worker: $(test -f dist/sw.js && echo '✅' || echo '❌')"
    echo "- Manifest: $(test -f dist/manifest.webmanifest && echo '✅' || echo '❌')"
    echo "- Offline Support: $(test -f dist/offline.html && echo '✅' || echo '❌')"
    echo ""
    echo "Environment:"
    echo "- Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "- npm: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo ""
    echo "Available Platforms:"
    echo "- Netlify CLI: $(command_exists netlify && echo '✅' || echo '❌')"
    echo "- Vercel CLI: $(command_exists vercel && echo '✅' || echo '❌')"
    echo "- Firebase CLI: $(command_exists firebase && echo '✅' || echo '❌')"
}

# Function to run performance test
performance_test() {
    print_status "Running performance test..."
    
    if command_exists lighthouse; then
        # This would require a deployed URL
        print_warning "Lighthouse requires a deployed URL. Deploy first, then run:"
        print_warning "lighthouse <your-deployed-url> --output html --output-path ./lighthouse-report.html"
    else
        print_warning "Lighthouse not installed. Install with: npm install -g lighthouse"
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f .netlify_url .vercel_output .firebase_output
    print_success "Cleanup completed"
}

# Main script
main() {
    echo "🚀 LATS CHANCE - Optimized Deployment Script"
    echo "============================================="
    echo ""
    
    # Check build and environment
    check_build
    validate_environment
    
    # Show menu
    echo ""
    echo "Choose deployment option:"
    echo "1) Deploy to Netlify (Recommended)"
    echo "2) Deploy to Vercel"
    echo "3) Deploy to Firebase"
    echo "4) Create deployment package"
    echo "5) Show deployment info"
    echo "6) Run performance test"
    echo "7) Cleanup temporary files"
    echo "8) Exit"
    echo ""
    
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            deploy_netlify
            ;;
        2)
            deploy_vercel
            ;;
        3)
            deploy_firebase
            ;;
        4)
            create_package
            ;;
        5)
            show_info
            ;;
        6)
            performance_test
            ;;
        7)
            cleanup
            ;;
        8)
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Deployment process completed!"
    echo ""
    print_status "Next steps:"
    echo "- Test your deployed application"
    echo "- Set up custom domain (optional)"
    echo "- Configure monitoring and analytics"
    echo "- Review HOSTING_PREPARATION_GUIDE.md for more details"
}

# Run main function
main "$@"
