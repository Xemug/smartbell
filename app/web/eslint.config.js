import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'playwright-report', 'test-results', 'src/api/schema.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // index.ts carries every icon; app code imports the ones it uses from glyphs.ts.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/pages/DevIconsPage*', 'src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)icons(/index)?$|^\\./index$',
              allowTypeImports: true,
              message: 'Import icons from glyphs.ts, or every icon ships in the bundle.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
