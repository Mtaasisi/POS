// LATS Module CSS Tokens
export const LATS_TOKENS = {
  // Color tokens
  colors: {
    primary: 'hsl(220, 100%, 50%)',
    primaryHover: 'hsl(220, 100%, 45%)',
    surface: 'rgba(255, 255, 255, 0.1)',
    surfaceHover: 'rgba(255, 255, 255, 0.15)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    glassShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    text: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(48, 96%, 53%)',
    error: 'hsl(0, 84%, 60%)',
    info: 'hsl(199, 89%, 48%)'
  },
  
  // Spacing tokens
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  // Border radius tokens
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  },
  
  // Typography tokens
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    }
  }
} as const;

// Generate CSS variables string
export const generateLatsCSSVars = () => {
  const vars: string[] = [];
  
  // Color variables
  Object.entries(LATS_TOKENS.colors).forEach(([key, value]) => {
    vars.push(`--lats-${key}: ${value};`);
  });
  
  // Spacing variables
  Object.entries(LATS_TOKENS.spacing).forEach(([key, value]) => {
    vars.push(`--lats-spacing-${key}: ${value};`);
  });
  
  // Border radius variables
  Object.entries(LATS_TOKENS.borderRadius).forEach(([key, value]) => {
    vars.push(`--lats-radius-${key}: ${value};`);
  });
  
  // Typography variables
  vars.push(`--lats-font-family: ${LATS_TOKENS.typography.fontFamily};`);
  Object.entries(LATS_TOKENS.typography.fontSize).forEach(([key, value]) => {
    vars.push(`--lats-font-size-${key}: ${value};`);
  });
  
  return vars.join('\n  ');
};

// CSS variables string for injection
export const LATS_CSS_VARS = `
  ${generateLatsCSSVars()}
`;

// Tailwind classes using LATS tokens
export const LATS_CLASSES = {
  // Glass effects
  glass: 'bg-lats-surface border border-lats-glass-border backdrop-blur-sm shadow-lats-glass-shadow',
  glassHover: 'hover:bg-lats-surface-hover hover:border-lats-glass-border/30',
  
  // Buttons
  button: 'px-4 py-2 rounded-lats-radius-md font-medium transition-all duration-200',
  buttonPrimary: 'bg-lats-primary hover:bg-lats-primary-hover text-white',
  buttonSecondary: 'bg-lats-surface hover:bg-lats-surface-hover text-lats-text border border-lats-glass-border',
  
  // Cards
  card: 'bg-lats-surface border border-lats-glass-border rounded-lats-radius-lg backdrop-blur-sm shadow-lats-glass-shadow',
  
  // Inputs
  input: 'bg-lats-surface border border-lats-glass-border rounded-lats-radius-md px-3 py-2 text-lats-text placeholder-lats-text-secondary focus:outline-none focus:ring-2 focus:ring-lats-primary/50',
  
  // Status badges
  badge: 'px-2 py-1 rounded-lats-radius-sm text-xs font-medium',
  badgeSuccess: 'bg-lats-success/20 text-lats-success border border-lats-success/30',
  badgeWarning: 'bg-lats-warning/20 text-lats-warning border border-lats-warning/30',
  badgeError: 'bg-lats-error/20 text-lats-error border border-lats-error/30',
  badgeInfo: 'bg-lats-info/20 text-lats-info border border-lats-info/30'
} as const;
