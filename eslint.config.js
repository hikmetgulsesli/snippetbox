import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['server/**/*.{ts,tsx}'],
    ignores: ['**/*.config.ts', '**/references/', '**/tests/', '**/*.d.ts', '**/dist/', '**/node_modules/'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Enforce .js extension on relative imports for Node.js ESM compatibility (server only)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportDeclaration[source.value=/^\\.\\.?\\/.*(?<!\\.js)$/]',
          message: 'Relative imports must end with .js extension for Node.js ESM compatibility.',
        },
      ],
    },
  },
  {
    files: ['client/**/*.{ts,tsx}'],
    ignores: ['**/*.config.ts', '**/references/', '**/tests/', '**/*.d.ts', '**/dist/', '**/node_modules/'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Client-side uses bundler mode, no .js extension needed
    },
  },
  {
    files: ['**/*.config.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,
      },
    },
  },
  {
    ignores: ['**/dist/', '**/node_modules/', '**/build/', 'references/', '**/tests/', '**/*.d.ts'],
  },
];
