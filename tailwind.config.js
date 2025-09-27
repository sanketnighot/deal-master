/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "!./DND-main/**/*",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      colors: {
        "neon-magenta": "rgb(var(--neon-magenta))",
        "neon-cyan": "rgb(var(--neon-cyan))",
        "neon-yellow": "rgb(var(--neon-yellow))",
        "dark-purple": "rgb(var(--dark-purple))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
      },
      boxShadow: {
        "neon-glow-magenta":
          "0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff",
        "neon-glow-cyan":
          "0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff",
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px -5px rgba(99, 102, 241, 0.4)",
        "glow-lg": "0 0 40px -10px rgba(99, 102, 241, 0.3)",
        primary: "0 0 20px -5px hsl(var(--primary) / 0.4)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "neon-glow-magenta":
          "0 0 20px rgb(255, 0, 255), 0 0 40px rgb(255, 0, 255)",
        "neon-glow-cyan":
          "0 0 20px rgb(0, 255, 255), 0 0 40px rgb(0, 255, 255)",
        "neon-glow-yellow":
          "0 0 20px rgb(255, 255, 0), 0 0 40px rgb(255, 255, 0)",
      },
      keyframes: {
        glitch: {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-3px, 3px)" },
          "40%": { transform: "translate(-3px, -3px)" },
          "60%": { transform: "translate(3px, 3px)" },
          "80%": { transform: "translate(3px, -3px)" },
          "100%": { transform: "translate(0)" },
        },
        "text-flicker": {
          "0%": { opacity: "0.1" },
          "2%": { opacity: "1" },
          "8%": { opacity: "0.1" },
          "9%": { opacity: "1" },
          "12%": { opacity: "0.1" },
          "20%": { opacity: "1" },
          "25%": { opacity: "0.3" },
          "30%": { opacity: "1" },
          "70%": { opacity: "0.7" },
          "72%": { opacity: "0.2" },
          "77%": { opacity: "0.9" },
          "100%": { opacity: "0.9" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        glitch: "glitch 0.3s linear 3",
        "text-flicker": "text-flicker 3s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-gentle": "bounceGentle 0.6s ease-in-out",
      },
    },
  },
  plugins: [],
};
