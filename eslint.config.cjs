const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const nodePlugin = require("eslint-plugin-n");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        parser: tsParser,

        globals: {
            ...globals.node,
        },

        ecmaVersion: 2021,
        parserOptions: {},
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "n": nodePlugin,
    },

    extends: compat.extends(
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "eslint:recommended",
        "plugin:n/recommended",
        "prettier",
    ),

    rules: {
        "n/no-missing-import": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-empty-object-type": "off",
    },
}, globalIgnores(["public/**/*", "**/node_modules", "**/prod_node_modules", "build/**/*", "**/examples", "eslint.config.cjs"])]);
