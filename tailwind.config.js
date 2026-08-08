/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      // ⚠️ 主题色必须写成 `rgb(var(--xx-rgb) / <alpha-value>)`。
      // 写成裸 `var(--xx)` 时 Tailwind 无法注入 alpha，`bg-accent/20`、`focus:ring-accent/30`、
      // `bg-card/90` 这类透明度变体会被静默丢弃（产物 CSS 里根本不存在对应规则）。
      // 通道值定义在 src/index.css 的 :root 与 html.light 中，两套主题各一份。
      colors: {
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        card: 'rgb(var(--card-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-secondary': '#6C5CE7',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 160, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 229, 160, 0.2)' },
        },
      },
    },
  },
  plugins: [],
};
