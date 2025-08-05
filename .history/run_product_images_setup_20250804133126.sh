#!/bin/bash

echo "🚀 Setting up Product Images Database..."

# Check if we have the SQL file
if [ ! -f "setup_product_images_table.sql" ]; then
    echo "❌ Error: setup_product_images_table.sql not found"
    exit 1
fi

echo "📋 Running SQL setup..."
echo "Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "=== COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ==="
cat setup_product_images_table.sql
echo "=== END OF SQL ==="
echo ""

echo "✅ SQL script ready to run in Supabase"
echo ""
echo "📝 Next steps:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the SQL above"
echo "4. Run the script"
echo "5. Create a storage bucket named 'product-images' in Supabase Storage"
echo "6. Set the bucket to public"
echo ""
echo "🎉 Product images system will be ready after these steps!" 