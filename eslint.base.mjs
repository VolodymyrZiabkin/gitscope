// Shared ESLint config for the TypeScript packages (api, shared). The web app extends eslint-config-next instead.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @param {string} tsconfigRootDir */
export function createConfig(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ['dist/**', 'coverage/**', 'fixtures/**'] },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      },
    },
    {
      files: ['**/*.{js,mjs}'],
      ...tseslint.configs.disableTypeChecked,
    },
  );
}
