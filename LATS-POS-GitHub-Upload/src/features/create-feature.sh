#!/bin/bash

# Script to create a new feature module
# Usage: ./create-feature.sh <feature-name>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <feature-name>"
    echo "Example: $0 notifications"
    exit 1
fi

FEATURE_NAME=$1
FEATURE_DIR="src/features/$FEATURE_NAME"

# Create feature directory structure
mkdir -p "$FEATURE_DIR"/{pages,components,hooks,types,utils}

# Create index.ts file
cat > "$FEATURE_DIR/index.ts" << EOF
// $FEATURE_NAME Feature Module
// Add your exports here

// Pages
// export * from './pages/YourPage';

// Components
// export * from './components/YourComponent';

// Hooks
// export * from './hooks/useYourHook';

// Types
// export * from './types/yourTypes';

// Utils
// export * from './utils/yourUtils';
EOF

# Create README for the feature
cat > "$FEATURE_DIR/README.md" << EOF
# $FEATURE_NAME Feature

## Description
Brief description of what this feature does.

## Structure
- \`pages/\` - Page components
- \`components/\` - Feature-specific components
- \`hooks/\` - Feature-specific hooks
- \`types/\` - Feature-specific types
- \`utils/\` - Feature-specific utilities

## Usage
Describe how to use this feature.

## Dependencies
List any dependencies this feature has.
EOF

# Create a sample component
cat > "$FEATURE_DIR/components/${FEATURE_NAME^}Component.tsx" << EOF
import React from 'react';

interface ${FEATURE_NAME^}ComponentProps {
  // Add your props here
}

export const ${FEATURE_NAME^}Component: React.FC<${FEATURE_NAME^}ComponentProps> = (props) => {
  return (
    <div>
      <h2>${FEATURE_NAME^} Component</h2>
      {/* Add your component content here */}
    </div>
  );
};
EOF

# Create a sample hook
cat > "$FEATURE_DIR/hooks/use${FEATURE_NAME^}.ts" << EOF
import { useState, useEffect } from 'react';

export const use${FEATURE_NAME^} = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add your hook logic here

  return {
    data,
    loading,
    error,
    // Add other return values
  };
};
EOF

# Create a sample type file
cat > "$FEATURE_DIR/types/${FEATURE_NAME}.ts" << EOF
// $FEATURE_NAME types

export interface ${FEATURE_NAME^}Data {
  id: string;
  // Add your type definitions here
}

export interface ${FEATURE_NAME^}State {
  // Add your state types here
}
EOF

# Create a sample utility file
cat > "$FEATURE_DIR/utils/${FEATURE_NAME}Utils.ts" << EOF
// $FEATURE_NAME utilities

export const format${FEATURE_NAME^}Data = (data: any) => {
  // Add your utility functions here
  return data;
};

export const validate${FEATURE_NAME^}Input = (input: any) => {
  // Add your validation functions here
  return true;
};
EOF

echo "✅ Feature '$FEATURE_NAME' created successfully!"
echo "📁 Location: $FEATURE_DIR"
echo ""
echo "Next steps:"
echo "1. Update the main features/index.ts file to include this feature"
echo "2. Add your components, pages, and logic"
echo "3. Update the feature's index.ts file with your exports"
echo "4. Update the main README.md with feature documentation"
