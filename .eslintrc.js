module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'airbnb-typescript',
        'plugin:prettier/recommended',
        'prettier',
    ],
    plugins: ['react', '@typescript-eslint', 'prettier'],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
        project: './tsconfig.json',
    },
    rules: {
        'prettier/prettier': 'error',
        'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: ['**/*.test.tsx', '**/*.test.ts'] },
        ],
        'import/prefer-default-export': 'off',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    env: {
        browser: true,
        node: true,
        es6: true,
    },
};
