/** Static Tailwind build — replaces the cdn.tailwindcss.com runtime.
    Theme mirrors the old inline `tailwind.config` exactly. Content scans
    HTML *and* main.js so dynamically-toggled classes aren't purged. */
module.exports = {
  content: ['./*.html', './main.js'],
  safelist: [
    'bg-paper/85', 'backdrop-blur-md', 'border-b', 'border-charcoal/10', 'py-4',
    'bg-transparent', 'py-7', 'rotate-180', 'hidden', 'flex',
    'bg-burgundy', 'bg-transparent', 'drawn', 'in',
    /* carousel controls are built in main.js, so Tailwind can't see them */
    'cf-ctl', 'cf-ctls', 'cf-count',
  ],
  theme: {
    extend: {
      /* `gold` stays the decorative brand accent — rules, borders, bullets,
         and anything sitting on a dark surface. Text on the light surfaces
         uses `gold-ink`, which clears 4.5:1 on cream (the plain gold is
         ~2.6:1 and was failing WCAG everywhere it carried words). */
      colors: { paper: '#FFFFFF', cream: '#FAF8F4', charcoal: '#1A1A1A', burgundy: '#9E1B32', 'burgundy-deep': '#6E1224', crimson: '#C4223F', ink: '#0B0B0D', smoke: '#151518', gold: '#C8A96E', 'gold-lit': '#DcC08A', 'gold-deep': '#A6864B', 'gold-ink': '#8A6D3B' },
      fontFamily: { sans: ['Heebo', 'system-ui', 'sans-serif'], mono: ['"Space Mono"', 'ui-monospace', 'monospace'] },
      fontWeight: { 100: '100', 200: '200', 300: '300', 400: '400', 500: '500', 600: '600', 700: '700', 800: '800', 900: '900' },
    },
  },
  plugins: [],
};
