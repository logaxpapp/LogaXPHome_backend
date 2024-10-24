// .eslintrc.js
module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'airbnb-typescript',
      'plugin:prettier/recommended',
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    parserOptions: {
      project: './tsconfig.json',
    },
    env: {
      node: true,
      jest: true,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.test.ts', '**/*.spec.ts', '**/jest.setup.ts'] },
      ],
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Add or override rules as needed
    },
  };
  