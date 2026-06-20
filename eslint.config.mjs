import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      // Pin the React version. The default "detect" makes eslint-plugin-react
      // 7.37.5 call context.getFilename(), which ESLint 10 removed — that
      // crashes the linter. Pinning skips autodetection (and is faster).
      react: { version: '19' },
    },
  },
  // Override default ignores of eslint-config-next + skip non-source tooling.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.agents/**',
    '.claude/**',
    '.cursor/**',
  ]),
])

export default eslintConfig
