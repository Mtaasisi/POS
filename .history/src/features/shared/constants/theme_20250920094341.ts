// Modern Professional Theme Constants for LATS CHANCE Application
// Updated color scheme with cohesive, accessible, and professional design

export const STATUS_COLORS = {
  // Device Status Colors - Modern Professional Palette
  pending: 'bg-warning-100 text-warning-800 border-warning-200',
  'in-progress': 'bg-primary-100 text-primary-800 border-primary-200',
  completed: 'bg-success-100 text-success-800 border-success-200',
  'repair-complete': 'bg-success-100 text-success-800 border-success-200',
  'returned-to-customer-care': 'bg-primary-100 text-primary-800 border-primary-200',
  done: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  'awaiting-parts': 'bg-warning-100 text-warning-800 border-warning-200',
  'parts-arrived': 'bg-lats-inventory-100 text-lats-inventory-800 border-lats-inventory-200',
  
  // Diagnostic Status Colors
  'submitted_for_review': 'bg-lats-inventory-100 text-lats-inventory-800 border-lats-inventory-200',
  'ready_for_customer_care': 'bg-primary-100 text-primary-800 border-primary-200',
  'repair_required': 'bg-warning-100 text-warning-800 border-warning-200',
  'replacement_required': 'bg-error-100 text-error-800 border-error-200',
  'no_action_required': 'bg-neutral-100 text-neutral-800 border-neutral-200',
  escalated: 'bg-lats-inventory-100 text-lats-inventory-800 border-lats-inventory-200',
  'admin_reviewed': 'bg-primary-100 text-primary-800 border-primary-200',
  
  // Spare Parts Status Colors
  needed: 'bg-warning-100 text-warning-800 border-warning-200',
  ordered: 'bg-primary-100 text-primary-800 border-primary-200',
  accepted: 'bg-lats-inventory-100 text-lats-inventory-800 border-lats-inventory-200',
  received: 'bg-success-100 text-success-800 border-success-200',
  used: 'bg-neutral-100 text-neutral-800 border-neutral-200',
} as const;

export const BUTTON_VARIANTS = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-soft hover:shadow-medium transition-all duration-200',
  secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-800 border border-secondary-200 hover:border-secondary-300 transition-all duration-200',
  success: 'bg-success-500 hover:bg-success-600 text-white shadow-soft hover:shadow-glow-green transition-all duration-200',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-soft hover:shadow-medium transition-all duration-200',
  error: 'bg-error-500 hover:bg-error-600 text-white shadow-soft hover:shadow-glow-red transition-all duration-200',
  outline: 'bg-transparent hover:bg-primary-50 text-primary-600 border border-primary-200 hover:border-primary-300 transition-all duration-200',
  ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 transition-all duration-200',
} as const;

export const BUTTON_SIZES = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
} as const;

export const CARD_VARIANTS = {
  default: 'bg-white border border-neutral-200 shadow-soft hover:shadow-medium transition-shadow duration-200',
  elevated: 'bg-white border border-neutral-200 shadow-medium hover:shadow-large transition-shadow duration-200',
  outlined: 'bg-transparent border border-neutral-300 hover:border-primary-300 transition-colors duration-200',
  filled: 'bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-colors duration-200',
} as const;

export const INPUT_VARIANTS = {
  default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
  error: 'border-error-300 focus:border-error-500 focus:ring-error-500/20',
  success: 'border-success-300 focus:border-success-500 focus:ring-success-500/20',
  warning: 'border-warning-300 focus:border-warning-500 focus:ring-warning-500/20',
} as const;

export const MODULE_COLORS = {
  // Customer Care Module
  'customer-care': {
    primary: 'bg-lats-customer-care-500 hover:bg-lats-customer-care-600',
    light: 'bg-lats-customer-care-50 border-lats-customer-care-200',
    text: 'text-lats-customer-care-700',
    accent: 'text-lats-customer-care-600',
  },
  
  // POS Module
  'pos': {
    primary: 'bg-lats-pos-500 hover:bg-lats-pos-600',
    light: 'bg-lats-pos-50 border-lats-pos-200',
    text: 'text-lats-pos-700',
    accent: 'text-lats-pos-600',
  },
  
  // Inventory Module
  'inventory': {
    primary: 'bg-lats-inventory-500 hover:bg-lats-inventory-600',
    light: 'bg-lats-inventory-50 border-lats-inventory-200',
    text: 'text-lats-inventory-700',
    accent: 'text-lats-inventory-600',
  },
  
  // Analytics Module
  'analytics': {
    primary: 'bg-lats-analytics-500 hover:bg-lats-analytics-600',
    light: 'bg-lats-analytics-50 border-lats-analytics-200',
    text: 'text-lats-analytics-700',
    accent: 'text-lats-analytics-600',
  },
  
  // Finance Module
  'finance': {
    primary: 'bg-lats-finance-500 hover:bg-lats-finance-600',
    light: 'bg-lats-finance-50 border-lats-finance-200',
    text: 'text-lats-finance-700',
    accent: 'text-lats-finance-600',
  },
} as const;

export const SEMANTIC_COLORS = {
  // Success States
  success: {
    bg: 'bg-success-50',
    border: 'border-success-200',
    text: 'text-success-800',
    icon: 'text-success-600',
    button: 'bg-success-500 hover:bg-success-600',
  },
  
  // Warning States
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    text: 'text-warning-800',
    icon: 'text-warning-600',
    button: 'bg-warning-500 hover:bg-warning-600',
  },
  
  // Error States
  error: {
    bg: 'bg-error-50',
    border: 'border-error-200',
    text: 'text-error-800',
    icon: 'text-error-600',
    button: 'bg-error-500 hover:bg-error-600',
  },
  
  // Info States
  info: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    text: 'text-primary-800',
    icon: 'text-primary-600',
    button: 'bg-primary-500 hover:bg-primary-600',
  },
  
  // Neutral States
  neutral: {
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
    text: 'text-neutral-800',
    icon: 'text-neutral-600',
    button: 'bg-neutral-500 hover:bg-neutral-600',
  },
} as const;

export const GRADIENT_VARIANTS = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
  secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
  success: 'bg-gradient-to-r from-success-500 to-success-600',
  warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
  error: 'bg-gradient-to-r from-error-500 to-error-600',
  
  // LATS Module Gradients
  'customer-care': 'bg-gradient-to-r from-lats-customer-care-500 to-lats-customer-care-600',
  'pos': 'bg-gradient-to-r from-lats-pos-500 to-lats-pos-600',
  'inventory': 'bg-gradient-to-r from-lats-inventory-500 to-lats-inventory-600',
  'analytics': 'bg-gradient-to-r from-lats-analytics-500 to-lats-analytics-600',
  'finance': 'bg-gradient-to-r from-lats-finance-500 to-lats-finance-600',
  
  // Subtle Gradients
  'primary-subtle': 'bg-gradient-to-br from-primary-50 to-primary-100',
  'success-subtle': 'bg-gradient-to-br from-success-50 to-success-100',
  'warning-subtle': 'bg-gradient-to-br from-warning-50 to-warning-100',
  'error-subtle': 'bg-gradient-to-br from-error-50 to-error-100',
} as const;

export const TEXT_COLORS = {
  primary: 'text-neutral-900',
  secondary: 'text-neutral-700',
  tertiary: 'text-neutral-600',
  muted: 'text-neutral-500',
  disabled: 'text-neutral-400',
  
  // Semantic Text Colors
  success: 'text-success-700',
  warning: 'text-warning-700',
  error: 'text-error-700',
  info: 'text-primary-700',
  
  // Brand Text Colors
  'brand-primary': 'text-primary-600',
  'brand-secondary': 'text-secondary-600',
} as const;

export const BACKGROUND_COLORS = {
  primary: 'bg-white',
  secondary: 'bg-neutral-50',
  tertiary: 'bg-neutral-100',
  elevated: 'bg-white shadow-soft',
  
  // Semantic Backgrounds
  success: 'bg-success-50',
  warning: 'bg-warning-50',
  error: 'bg-error-50',
  info: 'bg-primary-50',
  
  // Overlay Backgrounds
  overlay: 'bg-black/50 backdrop-blur-sm',
  'overlay-light': 'bg-white/80 backdrop-blur-sm',
} as const;

// Animation and Transition Classes
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse-slow',
} as const;

export const TRANSITIONS = {
  default: 'transition-all duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
} as const;

export const ANIMATION_DURATIONS = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  slower: 'duration-500',
} as const;

// Typography Classes
export const TYPOGRAPHY = {
  heading: {
    h1: 'text-4xl font-bold text-neutral-900',
    h2: 'text-3xl font-semibold text-neutral-900',
    h3: 'text-2xl font-semibold text-neutral-900',
    h4: 'text-xl font-medium text-neutral-900',
    h5: 'text-lg font-medium text-neutral-900',
    h6: 'text-base font-medium text-neutral-900',
  },
  
  body: {
    large: 'text-lg text-neutral-700',
    base: 'text-base text-neutral-700',
    small: 'text-sm text-neutral-600',
    xsmall: 'text-xs text-neutral-500',
  },
  
  weight: {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
} as const;

// Spacing Classes
export const SPACING = {
  section: 'py-8 px-6',
  container: 'max-w-7xl mx-auto',
  card: 'p-6',
  button: 'px-4 py-2',
  input: 'px-3 py-2',
} as const;

// Border Radius Classes
export const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

// Shadow Classes
export const SHADOWS = {
  none: 'shadow-none',
  soft: 'shadow-soft',
  medium: 'shadow-medium',
  large: 'shadow-large',
  glow: 'shadow-glow',
  'glow-green': 'shadow-glow-green',
  'glow-red': 'shadow-glow-red',
} as const;