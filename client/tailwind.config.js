/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rock-black': '#0A0A0A',
        'rock-red': '#FF2E2E',
        'rock-gold': '#FFD700',
        'rock-purple': '#6B46C1',
        'rock-gray': '#2D2D2D',
        'rock-light': '#CCCCCC',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 10px #FF2E2E, 0 0 20px #FF2E2E, 0 0 30px #FF2E2E' 
          },
          '50%': { 
            boxShadow: '0 0 20px #FF2E2E, 0 0 30px #FF2E2E, 0 0 40px #FF2E2E' 
          },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 