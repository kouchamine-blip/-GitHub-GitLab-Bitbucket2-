import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        finland: {
          blue: "#003580",
          "blue-light": "#0047AB",
          "blue-dark": "#002855",
          white: "#FFFFFF",
          "gray-light": "#F5F5F5",
          "gray": "#E0E0E0",
        },
        tarina: {
          amber: "#F59E0B",
          "amber-dark": "#D97706",
          "amber-light": "#FBBF24",
          orange: "#FF6B35",
          "orange-dark": "#E85D2C",
          brown: "#654321",
          "brown-dark": "#4B3821",
          "brown-light": "#8B6F47",
          cream: "#FFF8F0",
          offwhite: "#FFF5E6",
          beige: "#F5E6D3",
          "beige-dark": "#E6D4B8",
          "beige-light": "#FFE5CC",
        },
      },
    },
  },
  plugins: [],
};
export default config;
