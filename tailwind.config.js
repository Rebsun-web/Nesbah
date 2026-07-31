import flowbiteReact from "flowbite-react/plugin/tailwindcss";

/* @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', ".flowbite-react/class-list.json"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans Arabic", "sans-serif"],
        // `font-display` in the reference implementation's markup.
        display: ["IBM Plex Sans Arabic", "Cairo", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      // Design tokens for public landing pages (ported from Lovable)
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        border: 'hsl(var(--border))',
        // Aliases matching the reference implementation's class names (text-ink,
        // bg-violet, border-hairline, bg-cream…) so its markup ports verbatim.
        // They resolve to the same tokens as the semantic names above.
        ink: {
          DEFAULT: 'hsl(var(--foreground))',
          soft: 'hsl(var(--ink-soft))',
        },
        violet: {
          DEFAULT: 'hsl(var(--primary))',
          soft: 'hsl(var(--primary-soft))',
        },
        hairline: 'hsl(var(--border))',
        cream: 'hsl(var(--background))',
        paper: 'hsl(var(--paper))',
        secondary: 'hsl(var(--secondary))',
        mint: 'hsl(var(--mint))',
        destructive: 'hsl(var(--destructive))',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      keyframes: {
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        // The reference implementation's floating hero satellites.
        float: 'float-y 6s ease-in-out infinite',
      },
    },
  },
  plugins: [flowbiteReact],
}