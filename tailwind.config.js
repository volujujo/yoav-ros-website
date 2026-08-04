/** Static Tailwind build — replaces the cdn.tailwindcss.com runtime.
    Theme mirrors the old inline `tailwind.config` exactly. Content scans
    HTML *and* main.js so dynamically-toggled classes aren't purged. */
module.exports = {
  content: ['./*.html', './main.js'],
  safelist: [
    'bg-paper/85', 'backdrop-blur-md', 'border-b', 'border-charcoal/10', 'py-4',
    'bg-transparent', 'py-7', 'rotate-180', 'hidden', 'flex',
    'bg-burgundy', 'bg-transparent', 'drawn', 'in',
  ],
  theme: {
    extend: {
      colors: { paper: '#FFFFFF', cream: '#FAF8F4', charcoal: '#1A1A1A', burgundy: '#800020', crimson: '#9B111E', ink: '#0B0B0D', smoke: '#151518', gold: '#C8A96E', 'gold-lit': '#DcC08A', 'gold-deep': '#A6864B' },
      fontFamily: { sans: ['Heebo', 'system-ui', 'sans-serif'], mono: ['"Space Mono"', 'ui-monospace', 'monospace'] },
      fontWeight: { 100: '100', 200: '200', 300: '300', 400: '400', 500: '500', 600: '600', 700: '700', 800: '800', 900: '900' },
    },
  },
  plugins: [],
};
