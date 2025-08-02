#!/bin/bash

# Apply Inventory Tables to Supabase
# This script applies the inventory tables setup to your Supabase database

echo "🔧 Setting up inventory tables in Supabase..."

# Get the Supabase URL and key from the environment or use defaults
SUPABASE_URL=${VITE_SUPABASE_URL:-"https://jxhzveborezjhsmzsgbc.supabase.co"}
SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw"}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Create a temporary SQL file with the connection string
TEMP_SQL=$(mktemp)

cat > "$TEMP_SQL" << EOF
-- Connect to Supabase and apply inventory tables
\set ON_ERROR_STOP on

-- Apply the inventory tables setup
$(cat setup_inventory_tables.sql)
EOF

echo "📊 Applying inventory tables to Supabase..."
echo "URL: $SUPABASE_URL"

# Apply the SQL using psql
PGPASSWORD=postgres psql -h db.jxhzveborezjhsmzsgbc.supabase.co -U postgres -d postgres -f "$TEMP_SQL"

if [ $? -eq 0 ]; then
    echo "✅ Inventory tables created successfully!"
    echo "📋 Tables created:"
    echo "  - inventory_categories"
    echo "  - suppliers"
    echo "  - products"
    echo "  - product_variants"
    echo "  - stock_movements"
    echo ""
    echo "🎉 Your inventory system is now ready!"
else
    echo "❌ Failed to create inventory tables"
    echo "Please check your Supabase connection and try again"
fi

# Clean up
rm "$TEMP_SQL"

echo ""
echo "🔗 You can now access your inventory tables at:"
echo "https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor" 