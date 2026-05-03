/**
 * Configuration ESLint, Linter JavaScript/TypeScript
 *
 * Utilise eslint-config-next qui inclut automatiquement :
 * - Regles React (hooks, JSX)
 * - Regles Next.js (next/image, next/link, etc.)
 * - Regles TypeScript
 * - Regles d'accessibilite (jsx-a11y)
 */

import { createRequire } from "module"

const require = createRequire(import.meta.url)
const nextConfig = require("eslint-config-next")

const config = [
  // Ignorer les fichiers generes (coverage, playwright, build)
  { ignores: ["coverage/**", "playwright-report/**", ".next/**"] },
  ...nextConfig,
  // Assouplit les regles React 19 strictes en warnings
  // (ce sont des conseils de performance, pas des bugs critiques).
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]

export default config
