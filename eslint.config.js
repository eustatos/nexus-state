import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import jsPlugin from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      'coverage/',
      '.turbo/',
      '**/*.config.js',
      'jest.config.js',
      'vitest.config.js',
      'packages/**/eslint.config.js',
      'packages/**/.eslintrc.js',
      // Generated files
      'packages/**/dist/**',
      'report/**',
      // Test files with specific requirements
      'packages/svelte/index.test.ts',
      'packages/vue/index.test.ts',
      'packages/react/index.test.ts',
      'packages/react/dist/**',
      // Test files in root
      'test-*.js',
      // Scripts
      'scripts/*.js',
      // Examples
      'examples/**',
      // E2E tests
      'e2e/**',
      // Tests folder
      'tests/fixtures/**',
      'tests/performance/**',
      'tests/unit/**',
      // DevTools existing code with many warnings
      'packages/devtools/src/atom-name-resolver.ts',
      'packages/devtools/src/types.ts',
      'packages/devtools/src/devtools-plugin.ts',
      // New packages not ready for linting
      'packages/query/**',
      'packages/form/**',
    ],
  },
  // Base JS config
  jsPlugin.configs.recommended,
  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Disable base rule for TypeScript files
      'no-unused-vars': 'off',

      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^__',
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Import organization
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
    },
  },
  // JavaScript/JSX files
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Import organization
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
    },
  },
  // Test files can be less strict
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  // Test files using Jest globals
  {
    files: [
      '**/*.test.jsx',
      '**/*.test.js',
      '**/tests/**/*.js',
      '**/tests/**/*.jsx',
      '**/e2e/**/*.test.js',
    ],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-redeclare': 'off',
    },
  },
  // Files with eslint-disable that may cause warnings
  {
    files: [
      'apps/demo-react/e2e/*.test.js',
      'apps/demo-react/jest.e2e-*.js',
      'apps/demo-react/scripts/run-e2e-tests.js',
      'apps/demo-react/tests/*.js',
    ],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
  // Additional Jest setup files
  {
    files: [
      'apps/demo-react/jest.e2e-environment.js',
      'apps/demo-react/jest.e2e-setup.js',
      'apps/demo-react/jest.e2e-teardown.js',
    ],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
  // Core existing code with many any types - disable no-explicit-any rule
  {
    files: [
      'packages/core/src/store.ts',
      'packages/core/src/time-travel/**',
      'packages/core/src/types.ts',
      'packages/core/src/utils/**',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
