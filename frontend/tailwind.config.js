/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        casacor: {
          cream: "#F3F0EA",
          "cream-secondary": "#E9E7DB",
          black: "#111111",
          "gray-dark": "#4A4A4A",
          "gray-medium": "#9C9C9C",
          line: "#D8D4CC",
          gold: "#B79B6C",
        },
      },
      fontSize: {
        "heading-lg": ["3.5rem", { lineHeight: "1.1", fontWeight: "300" }],
        "heading-md": ["2rem", { lineHeight: "1.2", fontWeight: "400" }],
        "heading-sm": ["1.25rem", { lineHeight: "1.3", fontWeight: "500" }],
        "body-lg": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5" }],
        caption: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.06em" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      maxWidth: {
        editorial: "1440px",
      },
    },
  },
  plugins: [],
}

