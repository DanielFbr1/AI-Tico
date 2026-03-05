/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Lexend', 'sans-serif'],
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "calc(var(--radius) + 4px)",
                "2xl": "calc(var(--radius) + 8px)",
                "3xl": "calc(var(--radius) + 12px)",
            },
            colors: {
                border: "rgb(var(--border))",
                input: "rgb(var(--input))",
                ring: "rgb(var(--ring))",
                background: "rgb(var(--background))",
                foreground: "rgb(var(--foreground))",
                primary: {
                    DEFAULT: "rgb(var(--primary))",
                    foreground: "rgb(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "rgb(var(--secondary))",
                    foreground: "rgb(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "rgb(var(--destructive))",
                    foreground: "rgb(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "rgb(var(--muted))",
                    foreground: "rgb(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "rgb(var(--accent))",
                    foreground: "rgb(var(--accent-foreground))",
                },
                success: {
                    DEFAULT: "rgb(var(--success))",
                    foreground: "rgb(var(--success-foreground))",
                },
                popover: {
                    DEFAULT: "rgb(var(--popover))",
                    foreground: "rgb(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "rgb(var(--card))",
                    foreground: "rgb(var(--card-foreground))",
                },
            },
            animation: {
                'shake': 'shake 0.5s ease-in-out infinite',
            },
            keyframes: {
                'shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-2px) rotate(-1deg)' },
                    '75%': { transform: 'translateX(2px) rotate(1deg)' },
                }
            }
        },
    },
    plugins: [],
}
