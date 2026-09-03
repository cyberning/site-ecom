import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.{ts,tsx}"],
  },
  esbuild: {
    // Le projet Next.js utilise le JSX runtime automatique (jsx: "preserve").
    // Sans cette option, esbuild compile en mode classique et exige
    // `import React` dans chaque fichier .tsx (y compris les composants).
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
