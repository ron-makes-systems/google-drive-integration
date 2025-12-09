module.exports = {
    parser: '@typescript-eslint/parser',
    env: {
        es6: true,
        node: true,
    },
    plugins: ['@typescript-eslint', 'vitest'],
    extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'eslint:recommended',
        'plugin:node/recommended',
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 2021,
    },
    rules: {
        'node/no-missing-import': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/no-explicit-any': 'error',
    },
    ignorePatterns: ['public/**/*', 'node_modules', 'prod_node_modules'],
};
