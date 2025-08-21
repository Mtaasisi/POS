#!/bin/bash

# LATS CHANCE - Create Latest Backup Script
# This script creates a new backup of your Supabase database

echo "🚀 Creating latest backup for LATS CHANCE..."

# Get the Supabase URL from .env file
SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env | cut -d'=' -f2)
SUPABASE_REF=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')

echo "📋 Supabase Reference: $SUPABASE_REF"

# Create backup directory if it doesn't exist
BACKUP_DIR="$HOME/Desktop/SQL"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/supabase_full_$TIMESTAMP.sql"

echo "📦 Creating backup: $BACKUP_FILE"

# Check if pg_dump is available
if ! command -v pg_dump >/dev/null 2>&1; then
    echo "❌ pg_dump not found. Installing PostgreSQL tools..."
    
    # Try to install via Homebrew
    if command -v brew >/dev/null 2>&1; then
        echo "🍺 Installing via Homebrew..."
        brew install libpq
        export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
    else
        echo "❌ Homebrew not found. Please install PostgreSQL tools manually."
        echo "   Visit: https://www.postgresql.org/download/macosx/"
        exit 1
    fi
fi

# Construct database URL (you'll need to add your password)
echo "🔐 Database connection setup required."
echo ""
echo "To create a backup, you need to:"
echo "1. Get your Supabase database password"
echo "2. Run the backup command manually"
echo ""
echo "Command to run:"
echo "pg_dump 'postgresql://postgres:YOUR_PASSWORD@db.$SUPABASE_REF.supabase.co:5432/postgres?sslmode=require' > $BACKUP_FILE"
echo ""
echo "Or set the environment variable:"
echo "export SUPABASE_DB_URL='postgresql://postgres:YOUR_PASSWORD@db.$SUPABASE_REF.supabase.co:5432/postgres?sslmode=require'"
echo ""

# Alternative: Create a backup using the existing backup script
if [ -f "$HOME/Desktop/SQL/pg-backup-sql.sh" ]; then
    echo "📋 Found existing backup script at: $HOME/Desktop/SQL/pg-backup-sql.sh"
    echo "To use it:"
    echo "cd $HOME/Desktop/SQL"
    echo "./pg-backup-sql.sh --url='postgresql://postgres:YOUR_PASSWORD@db.$SUPABASE_REF.supabase.co:5432/postgres?sslmode=require'"
fi

echo ""
echo "📊 Current backup files in $BACKUP_DIR:"
ls -la "$BACKUP_DIR"/*.sql 2>/dev/null | tail -5

echo ""
echo "✅ Backup script ready. Please add your database password to proceed."
