/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#8b5cf6",
                secondary: "#3b82f6",
                accent: "#ec4899",
                dark: "#0f172a",
            }
        },
    },
    plugins: [],
}
