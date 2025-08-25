#!/bin/bash

# WhatsApp Hub - Hosting Preparation Script (with Debug Feature)
# This script prepares the application for hosting while keeping debug functionality

echo "🚀 Preparing WhatsApp Hub for hosting with debug features..."

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

# Step 1: Build the application
print_status "Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Build completed successfully!"
else
    print_error "Build failed! Please fix errors before hosting."
    exit 1
fi

# Step 2: Create hosting directory
HOSTING_DIR="hosting-ready"
print_status "Creating hosting directory: $HOSTING_DIR"
rm -rf $HOSTING_DIR
mkdir -p $HOSTING_DIR

# Step 3: Copy build files
print_status "Copying build files..."
cp -r dist/* $HOSTING_DIR/

# Step 4: Copy essential API files
print_status "Copying API files..."
mkdir -p $HOSTING_DIR/api
cp hostinger-deploy/api/whatsapp-webhook.php $HOSTING_DIR/api/
cp hostinger-deploy/api/whatsapp-proxy.php $HOSTING_DIR/api/
cp hostinger-deploy/api/health.php $HOSTING_DIR/api/ 2>/dev/null || echo "Health API not found, skipping..."

# Step 5: Copy configuration files
print_status "Copying configuration files..."
cp hostinger-deploy/.htaccess $HOSTING_DIR/
cp hostinger-deploy/_redirects $HOSTING_DIR/
cp hostinger-deploy/manifest.webmanifest $HOSTING_DIR/

# Step 6: Create environment template
print_status "Creating environment template..."
cat > $HOSTING_DIR/env-template.txt << 'EOF'
# WhatsApp Hub Environment Configuration
# Copy this file to .env and fill in your values

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# WhatsApp Green API Configuration
WHATSAPP_INSTANCE_ID=your_instance_id_here
WHATSAPP_API_TOKEN=your_api_token_here
WHATSAPP_API_URL=https://api.green-api.com

# Webhook Configuration
WEBHOOK_URL=https://your-domain.com/api/whatsapp-webhook.php
HOSTINGER_TOKEN=your_hostinger_token_here

# Debug Configuration (Keep these for debug features)
DEBUG_MODE=true
DEBUG_LOGGING=true
DEBUG_WEBHOOK=true

# Production Settings
NODE_ENV=production
VITE_APP_ENV=production
EOF

# Step 7: Create deployment instructions
print_status "Creating deployment instructions..."
cat > $HOSTING_DIR/DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# WhatsApp Hub - Production Deployment (with Debug Features)

## 🚀 Quick Deployment

### Step 1: Upload Files
Upload all files from this directory to your hosting server's `public_html/` folder.

### Step 2: Configure Environment
1. Copy `env-template.txt` to `.env`
2. Fill in your actual values:
   - Supabase credentials
   - WhatsApp Green API credentials
   - Your domain URL

### Step 3: Set Permissions
```bash
chmod 644 public_html/api/*.php
chmod 644 public_html/.htaccess
chmod 644 public_html/_redirects
```

### Step 4: Configure Green API Webhook
Set webhook URL to: `https://your-domain.com/api/whatsapp-webhook.php`

## 🔧 Debug Features Included

The debug panel is fully functional in production and includes:

### Connection Testing
- Database connectivity tests
- WhatsApp API connectivity tests
- Webhook configuration tests
- Proxy health checks
- Instance state verification

### Real-time Monitoring
- Connection status indicators
- Performance metrics
- Error logging and reporting
- Export functionality

### Access Debug Panel
1. Navigate to: `https://your-domain.com/dashboard`
2. Use the admin panel to verify system connections
3. Check system diagnostics and health status

## 📊 Monitoring

### Debug Logs (if enabled)
- `/api/debug_log.txt` - Comprehensive debug information
- `/api/webhook_log.txt` - Webhook activity
- `/api/auto_reply_log.txt` - Auto-reply activity

### Check Debug Logs
```bash
curl -s https://your-domain.com/api/debug_log.txt | tail -20
```

## 🔍 Troubleshooting

### If debug panel shows errors:
1. Check environment variables are set correctly
2. Verify Supabase connection
3. Ensure WhatsApp credentials are configured
4. Check webhook URL is accessible

### Common Issues:
- **Database connection failed**: Check Supabase credentials
- **WhatsApp API failed**: Verify Green API credentials
- **Webhook not working**: Check webhook URL configuration

## 📞 Support

For issues:
1. Use the debug panel first (most comprehensive)
2. Check debug logs
3. Verify environment configuration
4. Test individual components

---
Generated: $(date)
EOF

# Step 8: Create a quick test script
print_status "Creating test script..."
cat > $HOSTING_DIR/test-deployment.sh << 'EOF'
#!/bin/bash

# Quick deployment test script
echo "🧪 Testing deployment..."

# Test if main page loads
echo "Testing main page..."
curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/ | grep -q "200" && echo "✅ Main page loads" || echo "❌ Main page failed"

# Test Dashboard
echo "Testing Dashboard..."
curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/dashboard | grep -q "200" && echo "✅ Dashboard loads" || echo "❌ Dashboard failed"

# Test API endpoints
echo "Testing API endpoints..."
curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/health.php | grep -q "200" && echo "✅ Health API works" || echo "❌ Health API failed"

echo "🎉 Deployment test completed!"
EOF

chmod +x $HOSTING_DIR/test-deployment.sh

# Step 9: Create a backup script
print_status "Creating backup script..."
cat > $HOSTING_DIR/backup-current.sh << 'EOF'
#!/bin/bash

# Backup current deployment
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup: $BACKUP_DIR"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup current files (if they exist)
if [ -d "public_html" ]; then
    cp -r public_html/* $BACKUP_DIR/
    echo "✅ Backup created: $BACKUP_DIR"
else
    echo "⚠️  No existing public_html directory found"
fi
EOF

chmod +x $HOSTING_DIR/backup-current.sh

# Step 10: Create a summary file
print_status "Creating deployment summary..."
cat > $HOSTING_DIR/DEPLOYMENT_SUMMARY.md << 'EOF'
# WhatsApp Hub - Deployment Summary

## 📦 What's Included

### Frontend Application
- ✅ Complete React application with debug features
- ✅ WhatsApp Hub with prominent debug tab
- ✅ All UI components and functionality
- ✅ PWA support and offline capabilities

### API Endpoints
- ✅ WhatsApp webhook handler
- ✅ WhatsApp proxy for Green API
- ✅ Health check endpoint
- ✅ Debug logging capabilities

### Configuration Files
- ✅ Environment template
- ✅ Apache .htaccess configuration
- ✅ Netlify _redirects
- ✅ PWA manifest

### Debug Features
- ✅ Comprehensive debug panel (first tab)
- ✅ Connection testing for all components
- ✅ Real-time status monitoring
- ✅ Export and logging capabilities
- ✅ Error handling and reporting

## 🎯 Key Features

### Debug Panel (Prominent Position)
- **Location**: First tab in WhatsApp Hub
- **Features**: 8 comprehensive connection tests
- **Status**: Real-time connection indicators
- **Export**: Copy/download test results

### Connection Tests
1. Database Connection
2. WhatsApp API Connection
3. WhatsApp Proxy Health
4. Webhook Configuration
5. Webhook Endpoint Test
6. WhatsApp Instance State
7. API Settings Retrieval
8. Message Sending Test

## 📁 File Structure

```
hosting-ready/
├── index.html                 # Main application
├── assets/                    # Compiled assets
├── api/                       # API endpoints
│   ├── whatsapp-webhook.php
│   ├── whatsapp-proxy.php
│   └── health.php
├── .htaccess                  # Apache configuration
├── _redirects                 # Netlify redirects
├── manifest.webmanifest       # PWA manifest
├── env-template.txt           # Environment template
├── DEPLOYMENT_INSTRUCTIONS.md # Deployment guide
├── test-deployment.sh         # Test script
└── backup-current.sh          # Backup script
```

## 🚀 Ready for Deployment

All files are prepared and ready for hosting. The debug panel will be immediately accessible and functional in production.

---
Generated: $(date)
EOF

# Step 11: Create a package summary
print_status "Creating package summary..."
cat > $HOSTING_DIR/PACKAGE_SUMMARY.json << EOF
{
  "application": "WhatsApp Hub",
  "version": "1.0.0",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "features": {
    "debugPanel": {
      "enabled": true,
      "position": "first-tab",
      "tests": 8,
      "status": "prominent"
    },
    "whatsapp": {
      "webhook": true,
      "proxy": true,
      "autoReply": true,
      "debug": true
    },
    "pwa": true,
    "offline": true
  },
  "files": {
    "total": $(find $HOSTING_DIR -type f | wc -l),
    "size": "$(du -sh $HOSTING_DIR | cut -f1)"
  },
  "readyForDeployment": true
}
EOF

# Step 12: Final verification
print_status "Verifying deployment package..."

# Check if essential files exist
ESSENTIAL_FILES=(
    "$HOSTING_DIR/index.html"
    "$HOSTING_DIR/api/whatsapp-webhook.php"
    "$HOSTING_DIR/api/whatsapp-proxy.php"
    "$HOSTING_DIR/.htaccess"
    "$HOSTING_DIR/DEPLOYMENT_INSTRUCTIONS.md"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found: $(basename "$file")"
    else
        print_error "Missing: $(basename "$file")"
    fi
done

# Count files
TOTAL_FILES=$(find $HOSTING_DIR -type f | wc -l)
TOTAL_SIZE=$(du -sh $HOSTING_DIR | cut -f1)

print_status "Deployment package created successfully!"
print_info "Total files: $TOTAL_FILES"
print_info "Total size: $TOTAL_SIZE"
print_info "Location: $HOSTING_DIR/"

echo ""
print_status "🎉 WhatsApp Hub is ready for hosting with debug features!"
echo ""
print_info "Next steps:"
echo "1. Upload all files from '$HOSTING_DIR/' to your hosting server"
echo "2. Configure environment variables (see env-template.txt)"
echo "3. Set up Green API webhook"
echo "4. Test the admin dashboard at /dashboard"
echo ""
print_info "Debug panel will be prominently displayed as the first tab!"
echo ""
