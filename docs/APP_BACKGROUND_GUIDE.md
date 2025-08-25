# App Background Pattern Guide

## Overview
All pages in the app should use the app's background system instead of hardcoded backgrounds. This ensures consistency across the application and allows users to customize their background through the settings.

## Standard Page Structure

### ✅ Correct Pattern
```tsx
const MyPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Your page content here */}
        <GlassCard className="p-6">
          {/* Content */}
        </GlassCard>
      </div>
    </div>
  );
};
```

### ❌ Incorrect Patterns
```tsx
// Don't use hardcoded backgrounds
<div className="min-h-screen bg-gray-50 py-8">
<div className="p-4 sm:p-6 h-full overflow-y-auto pt-8 bg-gray-50">
<div className="bg-white min-h-screen">
```

## Key Points

1. **Use the standard container**: `p-4 sm:p-6 h-full overflow-y-auto pt-8`
2. **Use max-width container**: `max-w-4xl mx-auto space-y-4 sm:space-y-6` (or `max-w-6xl` for wider pages)
3. **Use GlassCard components**: These automatically adapt to the app's background system
4. **Don't override page backgrounds**: Let the app's CSS variables handle the background

## Background System

The app uses CSS variables for backgrounds:
- `--bg-primary`: Main background gradient
- `--card-bg`: Card background with transparency
- `--glass-bg`: Glass effect background

These are automatically applied based on the user's theme selection.

## Examples

### Simple Page
```tsx
const SimplePage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <GlassCard className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
          <p className="text-gray-600">Page content goes here</p>
        </GlassCard>
      </div>
    </div>
  );
};
```

### Complex Page with Multiple Sections
```tsx
const ComplexPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <GlassCard className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
        </GlassCard>

        {/* Content Section */}
        <GlassCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content */}
          </div>
        </GlassCard>

        {/* Footer Section */}
        <GlassCard className="p-6">
          {/* Footer content */}
        </GlassCard>
      </div>
    </div>
  );
};
```

## Migration Guide

If you have existing pages with hardcoded backgrounds:

1. Remove `bg-gray-50`, `bg-white`, or other hardcoded backgrounds from the main container
2. Ensure you're using the standard container classes
3. Use `GlassCard` components for content sections
4. Test that the page works with different theme backgrounds

## Testing

To test that your page follows the background pattern:

1. Go to Settings > Appearance
2. Change the background theme
3. Navigate to your page
4. Verify that the background changes appropriately
5. Check that content remains readable on all backgrounds

## Common Mistakes

- ❌ Using `min-h-screen bg-gray-50`
- ❌ Adding `bg-white` to main containers
- ❌ Using hardcoded background colors instead of GlassCard
- ❌ Forgetting the `pt-8` class for proper header spacing

## Benefits

- ✅ Consistent user experience
- ✅ Theme customization support
- ✅ Better accessibility
- ✅ Easier maintenance
- ✅ Professional appearance
