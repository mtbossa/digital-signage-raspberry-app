module.exports = {
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  plugins: ["simple-import-sort"],
  rules: {
    "simple-import-sort/imports": ["error"],
    "simple-import-sort/exports": ["error"],
  },
  ignorePatterns: ["**/*.js", "node_modules", ".turbo", "dist", "coverage"],
};
