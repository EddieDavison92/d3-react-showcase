import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // Existing D3/hydration patterns trip the React Compiler hook rules
      // shipped with eslint-config-next 16; leave those charts unchanged.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
    },
  },
]);
