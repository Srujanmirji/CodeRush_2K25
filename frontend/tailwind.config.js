/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-dark': '#050510',
                'brand-neon': '#00f7ff',
                'brand-accent': '#7000ff',
            },
            fontFamily: {
                'display': ['Orbitron', 'sans-serif'],
                'body': ['Inter', 'sans-serif'],
            },
            animation: {
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px #00f7ff, 0 0 10px #00f7ff' },
                    '100%': { boxShadow: '0 0 20px #00f7ff, 0 0 40px #00f7ff' },
                }
            }
        },
    },
    plugins: [],
}
