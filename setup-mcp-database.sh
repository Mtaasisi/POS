#!/bin/bash

echo "🚀 Setting up MCP Database Connection for LATS CHANCE"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install required packages
echo "📦 Installing required packages..."
npm install @supabase/supabase-js @modelcontextprotocol/sdk

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f "env.template" ]; then
        cp env.template .env
        echo "📝 Please edit .env file with your Supabase credentials"
    else
        echo "❌ env.template not found. Please create .env file manually"
        exit 1
    fi
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

if ! grep -q "VITE_SUPABASE_URL" .env; then
    echo "❌ VITE_SUPABASE_URL not found in .env file"
    exit 1
fi

if ! grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo "❌ VITE_SUPABASE_ANON_KEY not found in .env file"
    exit 1
fi

echo "✅ Environment variables found"

# Make the MCP server executable
chmod +x mcp-supabase-server.js

echo "🎉 MCP Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit your .env file with your Supabase credentials"
echo "2. Add SUPABASE_SERVICE_ROLE_KEY to your .env file for full database access"
echo "3. Test the connection with: node mcp-supabase-server.js"
echo ""
echo "🔧 MCP Configuration:"
echo "- Config file: mcp-config.json"
echo "- Server script: mcp-supabase-server.js"
echo "- Available tools: query_database, get_table_info, list_tables, backup_table, restore_table, get_table_stats"
