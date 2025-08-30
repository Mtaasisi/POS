#!/bin/bash

echo "🚀 Setting up GreenAPI Credentials for WhatsApp Integration"
echo "=========================================================="
echo ""

# Configuration
INSTANCE_ID="7105284900"
API_TOKEN="b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294"
API_URL="https://7105.api.greenapi.com"
MEDIA_URL="https://7105.media.greenapi.com"

echo "📱 Instance ID: $INSTANCE_ID"
echo "🔗 API URL: $API_URL"
echo "📺 Media URL: $MEDIA_URL"
echo ""

# Step 1: Test credentials directly
echo "1️⃣ Testing GreenAPI credentials..."
node test-new-greenapi-credentials.js

echo ""
echo "2️⃣ Updating database with new credentials..."
echo "   Run this SQL script in your database:"
echo "   psql -d your_database -f update-greenapi-credentials.sql"
echo ""

# Step 3: Test the updated system
echo "3️⃣ Testing updated system..."
echo "   Run this to test your Express server:"
echo "   node test-green-api.js"
echo ""

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Apply the database update"
echo "   2. Generate QR code in your app"
echo "   3. Authorize WhatsApp"
echo "   4. Test sending messages"
echo ""
echo "🔧 Available test commands:"
echo "   - node test-new-greenapi-credentials.js  (Test credentials directly)"
echo "   - node test-green-api.js                 (Test through your server)"
echo "   - psql -d your_database -f update-greenapi-credentials.sql (Update database)"
