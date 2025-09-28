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

// HD Resolution Optimizations
export const HD_OPTIMIZATIONS = {
  // Product card dimensions for different screen sizes
  productCard: {
    imageHeight: {
      mobile: 'h-40',
      tablet: 'sm:h-48',
      desktop: 'lg:h-56',
      hd: 'xl:h-64'
    },
    padding: {
      mobile: 'p-4',
      desktop: 'lg:p-5',
      hd: 'xl:p-6'
    },
    textSize: {
      title: {
        mobile: 'text-sm',
        tablet: 'sm:text-base',
        desktop: 'lg:text-lg',
        hd: 'xl:text-xl'
      },
      price: {
        mobile: 'text-sm',
        tablet: 'sm:text-base',
        desktop: 'lg:text-lg',
        hd: 'xl:text-xl'
      },
      button: {
        mobile: 'text-sm',
        tablet: 'sm:text-base',
        desktop: 'lg:text-base',
        hd: 'xl:text-lg'
      }
    }
  },
  
  // Grid layouts for different resolutions
  gridLayout: {
    mobile: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-3',
    hd: 'xl:grid-cols-4',
    ultraHd: '2xl:grid-cols-5'
  },
  
  // Spacing for HD displays
  spacing: {
    gap: {
      mobile: 'gap-4',
      desktop: 'lg:gap-6',
      hd: 'xl:gap-8'
    },
    padding: {
      mobile: 'p-4',
      desktop: 'lg:p-6',
      hd: 'xl:p-8'
    }
  }
} as const;