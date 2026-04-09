import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Fast Refresh is a DX-only concern (HMR), not a correctness bug.
      // Downgrading to warn so contexts that idiomatically co-export a
      // Provider + hook (AuthContext, DateRangeContext, Toast, etc) stop
      // blocking CI. The proper long-term fix is to split each into
      // `FooContext.ts` + `FooProvider.tsx` + `useFoo.ts` — tracked in
      // the audit roadmap.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
