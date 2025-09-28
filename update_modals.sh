#!/bin/bash

# Script to update modals to use createPortal and higher z-index
# This will update the most commonly used modals

echo "Updating modals to use createPortal..."

# Function to update a file
update_file() {
    local file="$1"
    echo "Updating $file..."
    
    # Add createPortal import if not present
    if ! grep -q "createPortal" "$file"; then
        sed -i '' '1i\
import { createPortal } from '\''react-dom'\'';
' "$file"
    fi
    
    # Replace z-50 with inline style and add createPortal
    sed -i '' 's/fixed inset-0.*z-50/fixed inset-0/g' "$file"
    sed -i '' 's/fixed inset-0 bg-black/fixed inset-0 bg-black/g' "$file"
    
    # Add style={{ zIndex: 99999 }} to fixed inset-0 divs
    sed -i '' 's/<div className="fixed inset-0/<div className="fixed inset-0" style={{ zIndex: 99999 }}/g' "$file"
    
    # Wrap return statements with createPortal
    # This is more complex and would need manual editing for each file
}

# List of most important modals to update
important_modals=(
    "src/features/customers/components/forms/AddCustomerModal.tsx"
    "src/features/customers/components/CustomerDetailModal.tsx"
    "src/features/lats/components/pos/CustomerSelectionModal.tsx"
    "src/features/lats/components/pos/CreateCustomerModal.tsx"
    "src/features/lats/components/pos/POSSettingsModal.tsx"
    "src/features/lats/components/inventory/EditProductModal.tsx"
    "src/features/lats/components/inventory/CategoryFormModal.tsx"
    "src/features/lats/components/purchase-order/AddProductModal.tsx"
    "src/features/lats/components/purchase-order/AddSupplierModal.tsx"
    "src/features/repair/components/SparePartsSelector.tsx"
)

# Update each file
for file in "${important_modals[@]}"; do
    if [ -f "$file" ]; then
        update_file "$file"
    else
        echo "File not found: $file"
    fi
done

echo "Modal updates completed!"
