#!/bin/bash

# =====================================================
# REMOVE REPAIR PAYMENT FILES FROM FRONTEND
# =====================================================
# This script removes all repair payment related files
# to clean up the frontend codebase

echo "🗑️  Starting repair payment cleanup..."

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# List of files to remove
FILES_TO_REMOVE=(
    "fix-repair-payment-service.ts"
    "fix-repair-payment-service-complete.ts"
    "src/lib/repairPaymentService.ts"
    "src/hooks/useRepairPayments.ts"
    "fix-repair-payment-button.tsx"
    "src/features/customers/components/RepairPaymentList.tsx"
)

# Remove files and create backups
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        echo "📋 Backing up: $file"
        cp "$file" "$BACKUP_DIR/"
        echo "🗑️  Removing: $file"
        rm "$file"
    else
        echo "⚠️  File not found: $file"
    fi
done

# Search for repair payment references
echo ""
echo "🔍 Searching for repair payment references..."

echo "📋 Files containing 'repairPaymentService':"
grep -r "repairPaymentService" src/ 2>/dev/null || echo "  None found"

echo "📋 Files containing 'useRepairPayments':"
grep -r "useRepairPayments" src/ 2>/dev/null || echo "  None found"

echo "📋 Files containing 'RepairPaymentButton':"
grep -r "RepairPaymentButton" src/ 2>/dev/null || echo "  None found"

echo "📋 Files containing 'RepairPaymentList':"
grep -r "RepairPaymentList" src/ 2>/dev/null || echo "  None found"

echo "📋 Files containing 'repair payment':"
grep -r "repair payment" src/ 2>/dev/null || echo "  None found"

echo "📋 Files containing 'Device repair payment':"
grep -r "Device repair payment" src/ 2>/dev/null || echo "  None found"

# Summary
echo ""
echo "=========================================="
echo "✅ REPAIR PAYMENT CLEANUP COMPLETE"
echo "=========================================="
echo "📁 Backup created in: $BACKUP_DIR"
echo "🗑️  Files removed: ${#FILES_TO_REMOVE[@]}"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo "1. Review the search results above"
echo "2. Remove any remaining import statements"
echo "3. Remove any remaining JSX components"
echo "4. Test your application"
echo "5. Check for build errors"
echo "=========================================="
