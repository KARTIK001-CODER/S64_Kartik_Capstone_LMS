/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        primary: "#2563EB",
        primaryHover: "#1D4ED8",
        accent: "#22C55E",
        textPrimary: "#0F172A",
        textSecondary: "#334155",
        muted: "#64748B",
      },
      fontSize: {
        "course-details-heading-small": ['26px', '36px'],
        "course-details-heading-large": ['36px', '44px'],
        "course-heading-small": ['28px', '34px'],
        "course-heading-large": ['48px', '56px'],
        "default": ['15px', '21px'],
      },
      gridTemplateColums: {
        "auto": "repeat(auto-fit, minmax(200px, 1ft))"
      },
      spacing: {
        'section-height': '500'
      }
    },
  },
  plugins: [],
}