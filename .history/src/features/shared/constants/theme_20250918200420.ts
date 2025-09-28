// Theme constants for consistent UI styling across customer care components

export const STATUS_COLORS = {
  // Device Status Colors
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  'repair-complete': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'returned-to-customer-care': 'bg-teal-100 text-teal-800 border-teal-200',
  done: 'bg-gray-100 text-gray-800 border-gray-200',
  'awaiting-parts': 'bg-orange-100 text-orange-800 border-orange-200',
  'parts-arrived': 'bg-purple-100 text-purple-800 border-purple-200',
  
  // Diagnostic Status Colors
  'submitted_for_review': 'bg-purple-100 text-purple-800 border-purple-200',
  'ready_for_customer_care': 'bg-blue-100 text-blue-800 border-blue-200',
  'repair_required': 'bg-orange-100 text-orange-800 border-orange-200',
  'replacement_required': 'bg-red-100 text-red-800 border-red-200',
  'no_action_required': 'bg-gray-100 text-gray-800 border-gray-200',
  escalated: 'bg-purple-100 text-purple-800 border-purple-200',
  'admin_reviewed': 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Spare Parts Status Colors
  needed: 'bg-orange-100 text-orange-800 border-orange-200',
  ordered: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-purple-100 text-purple-800 border-purple-200',
  received: 'bg-green-100 text-green-800 border-green-200',
  used: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export const BUTTON_VARIANTS = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  warning: 'bg-orange-500 hover:bg-orange-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  purple: 'bg-purple-500 hover:bg-purple-600 text-white',
  teal: 'bg-teal-500 hover:bg-teal-600 text-white',
} as const;

export const BUTTON_SIZES = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm sm:px-3 sm:py-2',
  lg: 'px-6 py-4 text-base',
} as const;

export const CARD_COLORS = {
  primary: 'bg-white/90',
  secondary: 'bg-gray-50/90',
  success: 'bg-green-50/90',
  warning: 'bg-orange-50/90',
  danger: 'bg-red-50/90',
  info: 'bg-blue-50/90',
} as const;

export const GRADIENT_COLORS = {
  primary: 'from-blue-500/20 to-blue-400/10',
  success: 'from-emerald-500/20 to-emerald-400/10',
  warning: 'from-orange-500/20 to-orange-400/10',
  danger: 'from-red-500/20 to-red-400/10',
  info: 'from-teal-500/20 to-cyan-400/10',
  purple: 'from-purple-500/20 to-purple-400/10',
} as const;

export const ICON_COLORS = {
  primary: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-orange-500',
  danger: 'text-red-500',
  info: 'text-blue-500',
  purple: 'text-purple-500',
  teal: 'text-teal-500',
  gray: 'text-gray-500',
} as const;

export const ANIMATION_DURATIONS = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  slower: 'duration-500',
} as const;

export const SPACING = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
} as const;

export const BORDER_RADIUS = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
} as const;

export const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;
