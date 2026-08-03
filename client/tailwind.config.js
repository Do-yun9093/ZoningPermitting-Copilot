/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Light theme palette: yellow + white + orange.
        cream: "#FFFBEB",      // amber-50 — page background
        butter: "#FEF3C7",     // amber-100 — soft surfaces
        marigold: "#FCD34D",   // amber-300 — primary yellow
        sunshine: "#F59E0B",   // amber-500 — deeper yellow
        tangerine: "#FB923C",  // orange-400
        pumpkin: "#F97316",    // orange-500 — accent
        ember: "#EA580C"       // orange-600 — hover / strong
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 1px 2px rgba(245, 158, 11, 0.06), 0 4px 12px rgba(245, 158, 11, 0.08)",
        ring: "0 0 0 4px rgba(252, 211, 77, 0.35)"
      }
    }
  },
  plugins: []
};
