import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginJest from "eslint-plugin-jest";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest }
    },
    plugins: { jest: pluginJest },
  },
  pluginJs.configs.recommended,
  eslintConfigPrettier
];