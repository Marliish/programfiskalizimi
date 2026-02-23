/**
 * Animation utilities for consistent micro-interactions
 */

export const animations = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-150',
  
  // Slide animations
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in duration-200',
  scaleOut: 'animate-out zoom-out duration-150',
  
  // Success animation
  successPulse: 'animate-pulse',
  successBounce: 'animate-bounce',
  
  // Error shake
  errorShake: 'animate-shake',
} as const;

// Tailwind config additions for custom animations
export const tailwindAnimations = {
  theme: {
    extend: {
      keyframes: {
        // Shake animation for errors
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        // Slide down for dropdowns
        slideDown: {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        slideUp: {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Progress bar
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Shimmer effect for skeletons
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        // Toast slide in
        toastSlideIn: {
          from: { transform: 'translateX(calc(100% + 1rem))' },
          to: { transform: 'translateX(0)' },
        },
        toastSlideOut: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(100% + 1rem))' },
        },
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
        slideDown: 'slideDown 200ms ease-out',
        slideUp: 'slideUp 200ms ease-out',
        progress: 'progress 1s ease-in-out infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
        toastSlideIn: 'toastSlideIn 150ms ease-out',
        toastSlideOut: 'toastSlideOut 150ms ease-in',
      },
    },
  },
};

// Hover and focus utilities
export const interactionStates = {
  button: 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2',
  card: 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
  input: 'transition-all duration-150 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  link: 'transition-colors duration-150 hover:text-primary-600 hover:underline',
} as const;

// Loading states
export const loadingStates = {
  spinner: 'animate-spin',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
  progress: 'animate-progress',
} as const;
