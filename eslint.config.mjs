import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["out/**", "dist/**", "node_modules/**"]
  },
  {
    files: ["media/**/*.js"],
    languageOptions: {
      globals: {
        acquireVsCodeApi: "readonly",
        document: "readonly",
        window: "readonly"
      }
    }
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly"
      }
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended
];
