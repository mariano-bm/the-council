/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        council: {
          dark: '#0c0a0e',
          darker: '#06050a',
          card: 'rgba(255, 235, 200, 0.03)',
          border: 'rgba(255, 215, 140, 0.08)',
          'border-hover': 'rgba(255, 215, 140, 0.18)',
        },
        // Paleta medieval/fantasía
        medieval: {
          gold: '#d4a847',
          'gold-light': '#f0d078',
          'gold-dark': '#8b6f2e',
          crimson: '#8b1a1a',
          'crimson-light': '#c42b2b',
          blood: '#5c1010',
          parchment: '#f5e6c8',
          'parchment-dark': '#c4a96a',
          bronze: '#b08d57',
          iron: '#6b7280',
          royal: '#4c1d95',
          'royal-light': '#7c3aed',
          forest: '#1a4d2e',
          'forest-light': '#2d8a4e',
          stone: '#292524',
          'stone-light': '#44403c',
        },
        // Acentos mantener algunos neon para contraste gaming
        neon: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          emerald: '#10b981',
          pink: '#ec4899',
          amber: '#f59e0b',
          red: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['"Cinzel"', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        medieval: ['"Cinzel"', 'serif'],
        display: ['"Cinzel Decorative"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #d4a847, #8b6f2e)',
        'gradient-royal': 'linear-gradient(135deg, #4c1d95, #7c3aed)',
        'gradient-crimson': 'linear-gradient(135deg, #8b1a1a, #c42b2b)',
        'gradient-parchment': 'linear-gradient(135deg, rgba(244,230,200,0.08), rgba(180,150,90,0.04))',
        'gradient-fire': 'linear-gradient(135deg, #c42b2b, #d4a847, #c42b2b)',
        'gradient-neon': 'linear-gradient(135deg, #d4a847, #7c3aed, #2d8a4e)',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'neon-violet': '0 0 20px rgba(139, 92, 246, 0.3)',
        'neon-emerald': '0 0 20px rgba(16, 185, 129, 0.3)',
        'neon-gold': '0 0 20px rgba(212, 168, 71, 0.4)',
        'medieval-glow': '0 0 30px rgba(212, 168, 71, 0.15), 0 0 60px rgba(212, 168, 71, 0.05)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'crimson': '0 0 20px rgba(139, 26, 26, 0.3)',
        'shame': '0 0 30px rgba(139, 26, 26, 0.4), inset 0 0 30px rgba(139, 26, 26, 0.1)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'count-up': 'count-up 1s ease-out',
        'torch-flicker': 'torch-flicker 3s ease-in-out infinite',
        'fire-glow': 'fire-glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'count-up': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'torch-flicker': {
          '0%, 100%': { opacity: '0.7', filter: 'brightness(1)' },
          '25%': { opacity: '0.9', filter: 'brightness(1.1)' },
          '50%': { opacity: '0.6', filter: 'brightness(0.9)' },
          '75%': { opacity: '1', filter: 'brightness(1.15)' },
        },
        'fire-glow': {
          '0%': { boxShadow: '0 0 10px rgba(212,168,71,0.2), 0 0 30px rgba(139,26,26,0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(212,168,71,0.4), 0 0 50px rgba(139,26,26,0.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
