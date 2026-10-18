/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      colors: {
        campus: {
          darkest: '#020617', // slate-950
          dark: '#0a0f1d',
          card: '#0f172a',    // slate-900
          border: '#1e293b',  // slate-800
          accent: '#06b6d4',  // cyan-500
          emerald: '#10b981', // emerald-500
          warning: '#f59e0b', // amber-500
          danger: '#ef4444',  // red-500
          rose: '#f43f5e',    // rose-500
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite alternate',
        'glow-red': 'glowRed 1s ease-in-out infinite alternate',
        'radar-sweep': 'radarSweep 3s linear infinite',
        'beacon-ping': 'beaconPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        glowCyan: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.4), 0 0 10px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.8), 0 0 25px rgba(6, 182, 212, 0.4)' },
        },
        glowRed: {
          '0%': { boxShadow: '0 0 6px rgba(239, 68, 68, 0.5), 0 0 12px rgba(239, 68, 68, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.9), 0 0 35px rgba(239, 68, 68, 0.6)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        beaconPing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.9' },
          '50%': { transform: 'scale(1.7)', opacity: '0' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
