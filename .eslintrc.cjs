// ESLint configuration (T-004)
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { tsconfigRootDir: __dirname, sourceType: 'module', project: ['./tsconfig.base.json'] },
  plugins: ['@typescript-eslint','import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  settings: {
    'import/resolver': {
      // Use tsconfig paths without full type-aware resolution to reduce false positives before build outputs exist
      typescript: { project: ['./tsconfig.base.json'], alwaysTryTypes: true }
    }
  },
  rules: {
  'import/order': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error','interface'],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  '@typescript-eslint/require-await': 'off'
  },
  ignorePatterns: ['dist','node_modules']
};
