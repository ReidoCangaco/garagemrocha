import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: "#22262B",
        "asphalt-2": "#2E333A",
        paper: "#EDEBE3",
        "paper-2": "#F7F6F1",
        signage: "#E8B324",
        ok: "#2F6F4E",
        "ok-bg": "#E4EEE7",
        warn: "#C97A1E",
        "warn-bg": "#F5E8D5",
        late: "#B8433A",
        "late-bg": "#F3E1DE",
        border: "#D8D4C7",
        ink: "#22262B",
        "ink-soft": "#5B6069",
      },
      fontFamily: {
        display: ["Barlow Condensed", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
