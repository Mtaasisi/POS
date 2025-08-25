#!/bin/bash

# Clean Hostinger Deploy Folder - Keep Only Necessary Files
# This script removes useless files and keeps only what's needed for hosting

echo "🧹 Cleaning hostinger-deploy folder..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Create backup of current hostinger-deploy
BACKUP_DIR="hostinger-deploy-backup-$(date +%Y%m%d-%H%M%S)"
print_status "Creating backup: $BACKUP_DIR"
cp -r hostinger-deploy $BACKUP_DIR

# Files to KEEP (necessary for hosting)
NECESSARY_FILES=(
    # API files (essential)
    "api/whatsapp-webhook.php"
    "api/whatsapp-proxy.php"
    "api/health.php"
    
    # Configuration files (essential)
    ".htaccess"
    "_redirects"
    "manifest.webmanifest"
    "env-template.txt"
    
    # Main application files (essential)
    "index.html"
    "favicon.ico"
    "favicon.svg"
    "bg-blue-glass.svg"
    
    # PWA files (essential)
    "sw.js"
    "offline.html"
    "manifest.json"
    
    # Documentation (useful)
    "README.md"
    "TROUBLESHOOTING.md"
    "WEBHOOK_SETUP_INSTRUCTIONS.md"
    
    # Directories (essential)
    "assets/"
    "brand-logos/"
    "icons/"
    "logos/"
    "uploads/"
)

# Files to REMOVE (useless for hosting)
USELESS_FILES=(
    # Documentation files (not needed on server)
    "IMMEDIATE_WHATSAPP_FIX.md"
    "WHATSAPP_500_ERROR_FIX.md"
    "WHATSAPP_503_FIX_SUMMARY.md"
    "SERVICE_WORKER_FIX_SUMMARY.md"
    "get-green-api-credentials.md"
    "CHROME_EXTENSION_README.md"
    
    # Test files (not needed on server)
    "test-whatsapp-proxy.php"
    "test-whatsapp-proxy.js"
    "test-whatsapp-db.js"
    "test-webhook.php"
    "test-db-connection.php"
    "whatsapp-connectivity-diagnostic.php"
    
    # Setup/configuration scripts (not needed on server)
    "quick-whatsapp-fix.sh"
    "setup-whatsapp-env.js"
    "update-env-credentials.sh"
    "check-whatsapp-config.js"
    "setup-whatsapp-credentials.js"
    "setup-webhook.php"
    "configure-whatsapp.php"
    
    # SQL files (not needed on server)
    "update-whatsapp-credentials.sql"
    "quick-whatsapp-test.sql"
    "whatsapp-credentials-test.sql"
    
    # HTML test files (not needed on server)
    "whatsapp-status.html"
    "whatsapp-setup.html"
    "webhook.html"
    "popup.html"
    
    # Backup files (not needed on server)
    "sw.js.backup"
    ".htaccess.backup"
    "webhook-config.json"
    "deployment-summary.json"
    
    # System files (not needed on server)
    ".DS_Store"
    "api/.DS_Store"
    
    # Duplicate/old API files (keep only the main ones)
    "api/whatsapp-webhook-debug.php"
    "api/whatsapp-webhook-fixed.php"
    "api/whatsapp-proxy-mock.js"
)

# Step 1: Remove useless files
print_status "Removing useless files..."
for file in "${USELESS_FILES[@]}"; do
    if [ -e "hostinger-deploy/$file" ]; then
        rm -rf "hostinger-deploy/$file"
        print_info "Removed: $file"
    fi
done

# Step 2: Clean up assets directory (remove old builds)
print_status "Cleaning assets directory..."
cd hostinger-deploy/assets

# Keep only the latest build files
LATEST_JS=$(ls -t index-*.js | head -1)
LATEST_CSS=$(ls -t index-*.css | head -1)

# Remove old build files
for file in index-*.js; do
    if [ "$file" != "$LATEST_JS" ]; then
        rm -f "$file"
        print_info "Removed old build: $file"
    fi
done

for file in index-*.css; do
    if [ "$file" != "$LATEST_CSS" ]; then
        rm -f "$file"
        print_info "Removed old build: $file"
    fi
done

# Remove duplicate deviceServices files (keep only the latest)
LATEST_DEVICE_SERVICES=$(ls -t deviceServices-*.js | head -1)
for file in deviceServices-*.js; do
    if [ "$file" != "$LATEST_DEVICE_SERVICES" ]; then
        rm -f "$file"
        print_info "Removed duplicate: $file"
    fi
done

# Remove duplicate ui files (keep only the latest)
LATEST_UI=$(ls -t ui-*.js | head -1)
for file in ui-*.js; do
    if [ "$file" != "$LATEST_UI" ]; then
        rm -f "$file"
        print_info "Removed duplicate: $file"
    fi
done

cd ../..

# Step 3: Verify necessary files still exist
print_status "Verifying necessary files..."
MISSING_FILES=()
for file in "${NECESSARY_FILES[@]}"; do
    if [ ! -e "hostinger-deploy/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_error "Missing necessary files:"
    for file in "${MISSING_FILES[@]}"; do
        print_error "  - $file"
    done
else
    print_status "All necessary files are present!"
fi

# Step 4: Count files and size
print_status "Counting remaining files..."
TOTAL_FILES=$(find hostinger-deploy -type f | wc -l)
TOTAL_SIZE=$(du -sh hostinger-deploy | cut -f1)

print_info "Total files remaining: $TOTAL_FILES"
print_info "Total size: $TOTAL_SIZE"

# Step 5: Create summary of what's left
print_status "Creating cleanup summary..."
cat > hostinger-deploy/CLEANUP_SUMMARY.md << 'EOF'
# Hostinger Deploy - Cleaned Up

## ✅ Files Kept (Necessary for Hosting)

### API Files
- `api/whatsapp-webhook.php` - Main webhook handler
- `api/whatsapp-proxy.php` - WhatsApp API proxy
- `api/health.php` - Health check endpoint

### Configuration Files
- `.htaccess` - Apache configuration
- `_redirects` - Netlify redirects
- `manifest.webmanifest` - PWA manifest
- `env-template.txt` - Environment template

### Application Files
- `index.html` - Main application
- `favicon.ico` / `favicon.svg` - Favicons
- `bg-blue-glass.svg` - Background image

### PWA Files
- `sw.js` - Service worker
- `offline.html` - Offline page
- `manifest.json` - PWA manifest

### Assets
- `assets/` - Latest build assets only
- `brand-logos/` - Brand logos
- `icons/` - Application icons
- `logos/` - Company logos
- `uploads/` - Upload directory

### Documentation
- `README.md` - Main documentation
- `TROUBLESHOOTING.md` - Troubleshooting guide
- `WEBHOOK_SETUP_INSTRUCTIONS.md` - Webhook setup

## 🗑️ Files Removed (Useless for Hosting)

### Documentation Files
- Various fix summaries and guides
- Chrome extension documentation
- Credential setup guides

### Test Files
- All test scripts and diagnostic files
- Database test files
- Webhook test files

### Setup Scripts
- Environment setup scripts
- Credential update scripts
- Configuration scripts

### SQL Files
- Database update scripts
- Test SQL files

### HTML Test Files
- Status pages
- Setup pages
- Test pages

### Backup Files
- Service worker backups
- Configuration backups
- Old webhook configs

### System Files
- .DS_Store files

### Duplicate Assets
- Old build files
- Duplicate JavaScript files
- Multiple CSS versions

## 📊 Results

- **Before**: Multiple old builds and test files
- **After**: Clean, production-ready files only
- **Size Reduction**: Significant reduction in file count
- **Maintainability**: Much easier to manage

## 🚀 Ready for Deployment

This cleaned-up version contains only the files necessary for hosting your WhatsApp Hub application.

---
Generated: $(date)
EOF

# Step 6: Create a deployment-ready package
print_status "Creating deployment-ready package..."
DEPLOY_DIR="hostinger-deploy-clean"
rm -rf $DEPLOY_DIR
cp -r hostinger-deploy $DEPLOY_DIR

# Remove documentation from deployment package
rm -f $DEPLOY_DIR/README.md
rm -f $DEPLOY_DIR/TROUBLESHOOTING.md
rm -f $DEPLOY_DIR/WEBHOOK_SETUP_INSTRUCTIONS.md
rm -f $DEPLOY_DIR/CLEANUP_SUMMARY.md

print_status "Clean deployment package created: $DEPLOY_DIR"

# Final summary
echo ""
print_status "🎉 Hostinger deploy folder cleaned successfully!"
echo ""
print_info "Results:"
echo "  📦 Backup created: $BACKUP_DIR"
echo "  🧹 Cleaned folder: hostinger-deploy/"
echo "  🚀 Deployment package: $DEPLOY_DIR"
echo ""
print_info "Next steps:"
echo "  1. Use $DEPLOY_DIR for hosting (clean, production-ready)"
echo "  2. Keep $BACKUP_DIR as backup (contains all original files)"
echo "  3. Upload files from $DEPLOY_DIR to your hosting server"
echo ""
