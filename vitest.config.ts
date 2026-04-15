/**
 * Configuration Vitest — Framework de tests unitaires et d'intégration
 *
 * Vitest est compatible avec l'API de Jest mais beaucoup plus rapide
 * car il utilise le même bundler que Vite (transformation ESM native).
 */

import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Configuration du rapport de couverture de code
    // (pourcentage de lignes de code exécutées par les tests)
    coverage: {
      provider: "v8", // Utilise le profiler V8 intégré à Node.js
      reporter: ["text", "html"], // Affichage console + rapport HTML
      include: ["src/lib/**/*.ts"], // Mesurer uniquement le code métier
      exclude: [
        "src/lib/**/*.test.ts", // Exclure les fichiers de tests eux-mêmes
        "src/lib/db/test-helper.ts", // Exclure le helper de tests
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
