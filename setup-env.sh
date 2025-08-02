#!/bin/bash

echo "🔧 Setting up environment variables for your Clean App..."

# Create .env file with correct Supabase credentials
cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw

# Optional: Analytics (if using)
# VITE_ANALYTICS_ID=your-analytics-id

# Optional: Feature flags
# VITE_ENABLE_PWA=true
# VITE_ENABLE_OFFLINE=true
EOF

echo "✅ Environment file created: .env"
echo "📋 Supabase URL: https://jxhzveborezjhsmzsgbc.supabase.co"
echo "🔑 Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw"

echo ""
echo "🚀 Next steps:"
echo "1. Restart your development server"
echo "2. The Supabase connection error should be resolved"
echo "3. Your app should now connect to the database properly" 