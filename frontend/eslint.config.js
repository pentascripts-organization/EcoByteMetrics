import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/app/**',
            '@/features/**',
            '@/components/**',
            '@/contexts/**',
            '@/hooks/**',
            '@/providers/**',
            '@/services/**',
            '@/utils/**',
            '@/home/**',
            '@/data/**',
          ],
          message: 'shared deve permanecer independente de app e features.',
        }],
      }],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/components/**',
            '@/contexts/**',
            '@/hooks/**',
            '@/providers/**',
            '@/services/**',
            '@/utils/**',
            '@/home/**',
            '@/data/**',
          ],
          message: 'app deve compor features e shared, sem importar as pastas legadas da raiz.',
        }],
      }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/app/**',
            '@/components/**',
            '@/contexts/**',
            '@/hooks/**',
            '@/providers/**',
            '@/services/**',
            '@/utils/**',
            '@/home/**',
            '@/data/**',
          ],
          message: 'Features nao importam app nem as pastas legadas da raiz; use shared ou dependencias explicitas da feature.',
        }],
      }],
    },
  },
  { files: ['*.{js,mjs,ts}', 'scripts/**/*.{js,mjs,ts}'], languageOptions: { globals: globals.node } },
);
