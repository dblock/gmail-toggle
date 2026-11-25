const js = require("@eslint/js");
const globals = require("globals");
const prettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = [
  {
    ignores: ["build/", "node_modules/"],
  },
  js.configs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        chrome: "readonly",
        gmail: "readonly",
        trustedTypes: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
  {
    files: ["eslint.config.js", "babel.config.js", "config/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
];
