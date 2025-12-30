import eslint from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "out/**",
      "dist/**",
      "node_modules/**",
      "media/webview/**",
      "webview/**/*.js",
      "webview/**/*.js.map"
    ]
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
  {
    files: ["webview/**/*.ts", "webview/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react,
      "react-hooks": reactHooks
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off"
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended
];
