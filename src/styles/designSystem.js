/**
 * ChiFere Cebu Design System
 * 
 * This file contains all design tokens, constants, and styling guidelines
 * for the ChiFere marketplace application. It ensures consistency across
 * all components and serves as the single source of truth for design decisions.
 * 
 * @version 1.0.0
 * @created 2025-01-20
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#EFF6FF',   // Very light blue
    100: '#DBEAFE',  // Light blue
    200: '#BFDBFE',  // Lighter blue
    300: '#93C5FD',  // Light blue
    400: '#60A5FA',  // Medium light blue
    500: '#3B82F6',  // Main brand blue
    600: '#2563EB',  // Darker blue
    700: '#1D4ED8',  // Dark blue
    800: '#1E40AF',  // Very dark blue
    900: '#1E3A8A',  // Deepest blue
  },

  // Secondary Colors (Cebu-inspired warm tones)
  secondary: {
    50: '#FFFBEB',   // Very light amber
    100: '#FEF3C7',  // Light amber
    200: '#FDE68A',  // Lighter amber
    300: '#FCD34D',  // Light amber
    400: '#FBBF24',  // Medium amber
    500: '#F59E0B',  // Main secondary
    600: '#D97706',  // Darker amber
    700: '#B45309',  // Dark amber
    800: '#92400E',  // Very dark amber
    900: '#78350F',  // Deepest amber
  },

  // Status Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',  // Main success green
    600: '#059669',
    700: '#047857',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',  // Main error red
    600: '#DC2626',
    700: '#B91C1C',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',  // Main warning amber
    600: '#D97706',
    700: '#B45309',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',  // Main info blue (same as primary)
    600: '#2563EB',
    700: '#1D4ED8',
  },

  // Neutral Grays
  gray: {
    50: '#F9FAFB',   // Very light gray
    100: '#F3F4F6',  // Light gray
    200: '#E5E7EB',  // Lighter gray
    300: '#D1D5DB',  // Light gray
    400: '#9CA3AF',  // Medium gray
    500: '#6B7280',  // Main gray
    600: '#4B5563',  // Darker gray
    700: '#374151',  // Dark gray
    800: '#1F2937',  // Very dark gray
    900: '#111827',  // Deepest gray (almost black)
  },

  // Pure Colors
  white: '#FFFFFF',
  black: '#000000',

  // Background Colors
  background: {
    primary: '#FFFFFF',      // Main content background
    secondary: '#F9FAFB',    // Secondary background
    accent: '#EFF6FF',       // Accent background (light blue)
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', // Primary gradient
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
  },

  // Font Sizes (rem values)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// ============================================================================
// SPACING & SIZING
// ============================================================================

export const spacing = {
  // Base spacing unit: 4px
  px: '1px',
  0: '0px',
  0.5: '2px',   // 0.5 * 4px
  1: '4px',     // 1 * 4px
  1.5: '6px',   // 1.5 * 4px
  2: '8px',     // 2 * 4px
  2.5: '10px',  // 2.5 * 4px
  3: '12px',    // 3 * 4px
  3.5: '14px',  // 3.5 * 4px
  4: '16px',    // 4 * 4px
  5: '20px',    // 5 * 4px
  6: '24px',    // 6 * 4px
  7: '28px',    // 7 * 4px
  8: '32px',    // 8 * 4px
  9: '36px',    // 9 * 4px
  10: '40px',   // 10 * 4px
  11: '44px',   // 11 * 4px
  12: '48px',   // 12 * 4px
  14: '56px',   // 14 * 4px
  16: '64px',   // 16 * 4px
  20: '80px',   // 20 * 4px
  24: '96px',   // 24 * 4px
  28: '112px',  // 28 * 4px
  32: '128px',  // 32 * 4px
  36: '144px',  // 36 * 4px
  40: '160px',  // 40 * 4px
  44: '176px',  // 44 * 4px
  48: '192px',  // 48 * 4px
  52: '208px',  // 52 * 4px
  56: '224px',  // 56 * 4px
  60: '240px',  // 60 * 4px
  64: '256px',  // 64 * 4px
  72: '288px',  // 72 * 4px
  80: '320px',  // 80 * 4px
  96: '384px',  // 96 * 4px
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
};

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: '475px',   // Extra small devices
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large devices
  '2xl': '1536px', // 2X large devices
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// ============================================================================
// ANIMATION & TRANSITIONS
// ============================================================================

export const animations = {
  // Duration
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '750ms',
    slowest: '1000ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Common transitions
  transition: {
    all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================================================
// COMPONENT SPECIFIC TOKENS
// ============================================================================

export const components = {
  // Button variants
  button: {
    // Sizes
    size: {
      xs: {
        padding: `${spacing[1]} ${spacing[2]}`,
        fontSize: typography.fontSize.xs,
        borderRadius: borderRadius.sm,
      },
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.md,
      },
      md: {
        padding: `${spacing[3]} ${spacing[4]}`,
        fontSize: typography.fontSize.base,
        borderRadius: borderRadius.lg,
      },
      lg: {
        padding: `${spacing[4]} ${spacing[6]}`,
        fontSize: typography.fontSize.lg,
        borderRadius: borderRadius.xl,
      },
    },

    // Variants
    variant: {
      primary: {
        background: colors.primary[500],
        color: colors.white,
        border: `1px solid ${colors.primary[500]}`,
        hover: {
          background: colors.primary[600],
          border: `1px solid ${colors.primary[600]}`,
        },
      },
      secondary: {
        background: colors.secondary[500],
        color: colors.white,
        border: `1px solid ${colors.secondary[500]}`,
        hover: {
          background: colors.secondary[600],
          border: `1px solid ${colors.secondary[600]}`,
        },
      },
      outline: {
        background: 'transparent',
        color: colors.primary[500],
        border: `1px solid ${colors.primary[500]}`,
        hover: {
          background: colors.primary[50],
          color: colors.primary[600],
        },
      },
      ghost: {
        background: 'transparent',
        color: colors.gray[700],
        border: '1px solid transparent',
        hover: {
          background: colors.gray[100],
          color: colors.gray[800],
        },
      },
    },
  },

  // Input fields
  input: {
    base: {
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: typography.fontSize.base,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.gray[300]}`,
      background: colors.white,
      focus: {
        borderColor: colors.primary[500],
        boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      },
      error: {
        borderColor: colors.error[500],
        boxShadow: `0 0 0 3px ${colors.error[100]}`,
      },
    },
  },

  // Cards
  card: {
    base: {
      background: colors.white,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.md,
      border: `1px solid ${colors.gray[200]}`,
    },
    elevated: {
      background: colors.white,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.lg,
      border: 'none',
    },
  },

  // Navigation
  navigation: {
    height: '64px', // 16 * 4px
    background: colors.white,
    borderBottom: `1px solid ${colors.gray[200]}`,
    boxShadow: shadows.sm,
  },
};

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const layout = {
  // Container max widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
  },

  // Sidebar widths
  sidebar: {
    collapsed: '64px',
    normal: '256px',
    wide: '320px',
  },

  // Header/Footer heights
  header: {
    mobile: '56px',
    desktop: '64px',
  },

  footer: {
    mobile: '120px',
    desktop: '160px',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color with opacity
 * @param {string} color - Color value
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export const withOpacity = (color, opacity) => {
  // Simple implementation - in production, you might want a more robust color parser
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

/**
 * Get responsive value based on breakpoint
 * @param {object} values - Object with breakpoint keys
 * @param {string} currentBreakpoint - Current breakpoint
 * @returns {any} Value for current breakpoint
 */
export const responsive = (values, currentBreakpoint = 'md') => {
  return values[currentBreakpoint] || values.base || Object.values(values)[0];
};

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animations,
  components,
  layout,
  // Utility functions
  withOpacity,
  responsive,
};

// Export as default for easy importing
export default theme;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example usage in components:

import theme from '@/styles/designSystem';

// Using colors
const buttonStyle = {
  backgroundColor: theme.colors.primary[500],
  color: theme.colors.white,
  padding: theme.spacing[3],
  borderRadius: theme.borderRadius.lg,
  boxShadow: theme.shadows.md,
};

// Using responsive values
const containerStyle = {
  maxWidth: theme.responsive({
    sm: theme.layout.container.sm,
    md: theme.layout.container.md,
    lg: theme.layout.container.lg,
  }, currentBreakpoint),
};

// Using component tokens
const primaryButton = {
  ...theme.components.button.size.md,
  ...theme.components.button.variant.primary,
};
*/

