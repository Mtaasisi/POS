// Basic theme constants for LATS CHANCE Application

export const STATUS_COLORS = {
  // Device Status Colors
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  'repair-complete': 'bg-green-100 text-green-800 border-green-200',
  'returned-to-customer-care': 'bg-blue-100 text-blue-800 border-blue-200',
  done: 'bg-gray-100 text-gray-800 border-gray-200',
  'awaiting-parts': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'parts-arrived': 'bg-purple-100 text-purple-800 border-purple-200',
  
  // Diagnostic Status Colors
  'submitted_for_review': 'bg-purple-100 text-purple-800 border-purple-200',
  'ready_for_customer_care': 'bg-blue-100 text-blue-800 border-blue-200',
  'repair_required': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'replacement_required': 'bg-red-100 text-red-800 border-red-200',
  'no_action_required': 'bg-gray-100 text-gray-800 border-gray-200',
  escalated: 'bg-purple-100 text-purple-800 border-purple-200',
  'admin_reviewed': 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Spare Parts Status Colors
  needed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ordered: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-purple-100 text-purple-800 border-purple-200',
  received: 'bg-green-100 text-green-800 border-green-200',
  used: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export const BUTTON_VARIANTS = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 hover:border-gray-300 transition-all duration-200',
  success: 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm hover:shadow-md transition-all duration-200',
  error: 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md transition-all duration-200',
  outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-300 transition-all duration-200',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-all duration-200',
} as const;

export const BUTTON_SIZES = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
} as const;

export const CARD_VARIANTS = {
  default: 'bg-white border border-gray-200 shadow-sm rounded-lg',
  elevated: 'bg-white border border-gray-200 shadow-md rounded-lg',
  outlined: 'bg-transparent border-2 border-gray-200 rounded-lg',
  filled: 'bg-gray-50 border border-gray-200 rounded-lg',
} as const;

export const INPUT_VARIANTS = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
  success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
  warning: 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500',
} as const;

export const GRADIENT_VARIANTS = {
  subtle: 'bg-gradient-to-r from-blue-50 to-indigo-50',
  bold: 'bg-gradient-to-r from-blue-500 to-indigo-600',
} as const;

export const ANIMATION_DURATIONS = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
} as const;

export const BORDER_RADIUS = {
  xs: 'rounded-sm',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
} as const;

export const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const;

export const CARD_COLORS = {
  default: 'bg-white border-gray-200',
  primary: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
} as const;

// Dynamic Responsive Optimizations
export const RESPONSIVE_OPTIMIZATIONS = {
  // Product card dimensions for different screen sizes
  productCard: {
    imageHeight: {
      mobile: 'h-36',
      tablet: 'sm:h-40',
      desktop: 'lg:h-44',
      hd: 'xl:h-48',
      compact: 'h-32'
    },
    padding: {
      mobile: 'p-3',
      tablet: 'sm:p-3',
      desktop: 'lg:p-4',
      hd: 'xl:p-4',
      compact: 'p-2'
    },
    textSize: {
      title: {
        mobile: 'text-sm',
        tablet: 'sm:text-base',
        desktop: 'lg:text-base',
        hd: 'xl:text-lg',
        compact: 'text-sm'
      },
      price: {
        mobile: 'text-sm',
        tablet: 'sm:text-base',
        desktop: 'lg:text-base',
        hd: 'xl:text-lg',
        compact: 'text-sm'
      },
      button: {
        mobile: 'text-sm',
        tablet: 'sm:text-sm',
        desktop: 'lg:text-sm',
        hd: 'xl:text-base',
        compact: 'text-sm'
      },
      sku: {
        mobile: 'text-xs',
        tablet: 'sm:text-sm',
        desktop: 'lg:text-sm',
        hd: 'xl:text-sm',
        compact: 'text-xs'
      }
    }
  },
  
  // Optimized grid layouts for better readability
  gridLayout: {
    // Base responsive breakpoints - optimized for 3-column layout
    mobile: 'grid-cols-1',
    smallMobile: 'grid-cols-2',
    tablet: 'sm:grid-cols-2 md:grid-cols-3',
    desktop: 'lg:grid-cols-3 xl:grid-cols-3',
    hd: 'xl:grid-cols-3 2xl:grid-cols-3',
    ultraHd: '2xl:grid-cols-3 3xl:grid-cols-4',
    // Adaptive sizing for different screen widths - prioritizing readability
    adaptive: {
      xs: 'grid-cols-1',      // < 640px
      sm: 'grid-cols-2',      // 640px - 768px
      md: 'grid-cols-3',      // 768px - 1024px
      lg: 'grid-cols-3',      // 1024px - 1280px
      xl: 'grid-cols-3',      // 1280px - 1536px
      '2xl': 'grid-cols-3',   // 1536px - 1920px
      '3xl': 'grid-cols-4',   // 1920px - 2560px
      '4xl': 'grid-cols-4'    // > 2560px
    }
  },
  
  // Spacing for different displays - more compact
  spacing: {
    gap: {
      mobile: 'gap-2',
      tablet: 'sm:gap-3',
      desktop: 'lg:gap-4',
      hd: 'xl:gap-4',
      compact: 'gap-2'
    },
    padding: {
      mobile: 'p-3',
      tablet: 'sm:p-4',
      desktop: 'lg:p-4',
      hd: 'xl:p-5',
      compact: 'p-2'
    }
  },

  // Button sizes for different screens
  buttonSizes: {
    mobile: 'py-2 px-3',
    tablet: 'sm:py-2 sm:px-3',
    desktop: 'lg:py-2 lg:px-4',
    hd: 'xl:py-3 xl:px-4',
    compact: 'py-1 px-2'
  },

  // Search bar sizing
  searchBar: {
    mobile: 'py-2 px-3',
    tablet: 'sm:py-3 sm:px-4',
    desktop: 'lg:py-3 lg:px-4',
    hd: 'xl:py-3 xl:px-4',
    compact: 'py-2 px-3'
  }
} as const;