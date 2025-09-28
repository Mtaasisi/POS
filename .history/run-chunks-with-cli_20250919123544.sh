#!/bin/bash

echo "🚀 Automatic Customer Update with Supabase CLI"
echo "=============================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "📋 Install it with: npm install -g supabase"
    echo "🔗 Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Not in a Supabase project directory"
    echo "📋 Make sure you're in the right directory or run:"
    echo "   supabase init"
    exit 1
fi

echo "✅ Supabase project detected"
echo ""

# Run each chunk
total_chunks=12
success_count=0
fail_count=0

for i in $(seq 1 $total_chunks); do
    chunk_file="update-customers-chunk-${i}.sql"
    
    if [ ! -f "$chunk_file" ]; then
        echo "❌ File $chunk_file not found"
        fail_count=$((fail_count + 1))
        continue
    fi
    
    echo "📦 Running chunk $i/$total_chunks..."
    echo "   File: $chunk_file"
    
    # Run the SQL file
    if supabase db reset --db-url "$DATABASE_URL" < "$chunk_file" 2>/dev/null || \
       supabase db push --db-url "$DATABASE_URL" < "$chunk_file" 2>/dev/null || \
       psql "$DATABASE_URL" < "$chunk_file" 2>/dev/null; then
        echo "   ✅ Chunk $i completed successfully"
        success_count=$((success_count + 1))
    else
        echo "   ❌ Chunk $i failed"
        fail_count=$((fail_count + 1))
    fi
    
    # Small delay between chunks
    sleep 1
done

echo ""
echo "🎉 All chunks processed!"
echo "========================"
echo "✅ Successful: $success_count chunks"
echo "❌ Failed: $fail_count chunks"

if [ $fail_count -eq 0 ]; then
    echo ""
    echo "🎯 All customers updated successfully!"
    echo "📊 Run run-complete-update.sql to check results"
else
    echo ""
    echo "⚠️  Some chunks failed. Check the errors above."
fi
