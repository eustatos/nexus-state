 
const {
    defineConfig,
    globalIgnores,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("eslint/config");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tsParser = require("@typescript-eslint/parser");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const globals = require("globals");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const js = require("@eslint/js");

 
const {
    FlatCompat,
// eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
        parserOptions: {},

        globals: {
            ...globals.node,
        },
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": "off",

        "no-console": ["warn", {
            allow: ["warn", "error"],
        }],

        "no-debugger": "error",
        "prefer-const": "error",
        "no-var": "error",
    },
}, {
    files: ["**/*.test.ts", "**/*.spec.ts"],

    rules: {
        "@typescript-eslint/no-explicit-any": "off",
    },
}, globalIgnores(["**/dist/", "**/node_modules/", "**/*.test-d.ts"])]);
