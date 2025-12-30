import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  darkMode: ["class"],
  content: [
    path.resolve(__dirname, "index.html"),
    path.resolve(__dirname, "src/**/*.{ts,tsx}")
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--pc-bg)",
        foreground: "var(--pc-text)",
        muted: "var(--pc-panel)",
        "muted-foreground": "var(--pc-muted)",
        border: "var(--pc-border)",
        input: "var(--vscode-input-background, rgba(255, 255, 255, 0.08))",
        ring: "var(--vscode-focusBorder, #0078d4)",
        primary: {
          DEFAULT: "var(--pc-accent)",
          foreground: "var(--vscode-button-foreground, #ffffff)"
        },
        secondary: {
          DEFAULT: "var(--vscode-button-secondaryBackground, #3a3d41)",
          foreground: "var(--vscode-button-secondaryForeground, #ffffff)"
        },
        destructive: {
          DEFAULT: "var(--pc-danger)",
          foreground: "var(--vscode-input-foreground, #ffffff)"
        },
        popover: "var(--pc-panel)",
        "popover-foreground": "var(--pc-text)"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  },
  plugins: []
};
