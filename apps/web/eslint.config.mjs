import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import sharedConfig from '@trackfunds/config/eslint'

export default defineConfig([
  ...sharedConfig,
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores(['.next/**', 'next-env.d.ts']),
])
