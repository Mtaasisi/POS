#!/bin/bash

echo "Setting up spare part categories..."

# Run the SQL script
echo "Running SQL setup..."
psql -h localhost -U postgres -d postgres -f setup_spare_part_categories.sql

echo "Spare part categories setup complete!"
echo ""
echo "Next steps:"
echo "1. Run the SQL script in your Supabase SQL Editor"
echo "2. Update your spare parts to use the new category system"
echo "3. Access the new category management page at /spare-part-category-management" 