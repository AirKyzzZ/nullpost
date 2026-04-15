/**
 * Configuration ESLint — Linter JavaScript/TypeScript
 *
 * Utilise eslint-config-next qui inclut automatiquement :
 * - Règles React (hooks, JSX)
 * - Règles Next.js (next/image, next/link, etc.)
 * - Règles TypeScript
 * - Règles d'accessibilité (jsx-a11y)
 */

import { createRequire } from "module"

const require = createRequire(import.meta.url)
const nextConfig = require("eslint-config-next")

export default [
  // Ignorer les fichiers générés (coverage, playwright, build)
  { ignores: ["coverage/**", "playwright-report/**", ".next/**"] },
  ...nextConfig,
]
