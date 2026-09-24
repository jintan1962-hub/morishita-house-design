import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          DEFAULT: "#0C313D",
          light: "#164555",
        },
        teal: {
          DEFAULT: "#237995",
          hover: "#1d6276",
        },
        pink: {
          DEFAULT: "#EB468C",
          hover: "#d13579",
        },
        reno: {
          bg: "#F5F5F5",
          line: "#EAEAEA",
          "line-dark": "#C7C7C7",
          mute: "#B2B2B2",
          "mute-dark": "#707070",
          cream: "#FEF9D3",
        }
      },
      fontFamily: {
        mincho: [
          "游明朝", "YuMincho", "Yu Mincho", "游明朝体", 
          "Hiragino Mincho ProN", "HG明朝E", "serif"
        ],
        gothic: [
          "Noto Sans JP", "Hiragino Kaku Gothic ProN", 
          "Yu Gothic", "Meiryo", "sans-serif"
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
