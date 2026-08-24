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
      /* Palette per Yoav (Aug 24): primary accent is terracotta #A95142
         (the old bordo was too close to "הסטודיו"), gold is retired — the
         `gold*` tokens now resolve to neutral greys so every former gold
         accent falls back to white/black/grey depending on surface.
         `graphite` (#454545) is the dark section surface that alternates
         with cream instead of white. */
      colors: { paper: '#FFFFFF', cream: '#FAF8F4', charcoal: '#1A1A1A', graphite: '#454545', 'graphite-deep': '#3A3A3A', burgundy: '#A95142', 'burgundy-deep': '#7E3A2F', crimson: '#BC6450', ink: '#0B0B0D', smoke: '#151518', gold: '#9C9C9C', 'gold-lit': '#DDDDDD', 'gold-deep': '#6E6E6E', 'gold-ink': '#565656' },
      fontFamily: { sans: ['Heebo', 'system-ui', 'sans-serif'], mono: ['"Space Mono"', 'ui-monospace', 'monospace'] },
      fontWeight: { 100: '100', 200: '200', 300: '300', 400: '400', 500: '500', 600: '600', 700: '700', 800: '800', 900: '900' },
    },
  },
  plugins: [],
};
