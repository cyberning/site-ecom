import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Le fichier `.env` vit à la racine du repo (partagé, gitignoré), alors que
// Next.js tourne depuis `v1/` et ne charge que les `.env` de son répertoire de
// travail. On charge donc explicitement le `.env` racine pour que le serveur de
// dev (webServer) hérite de DATABASE_URL, NEXTAUTH_SECRET, etc.
const rootEnv = loadEnv({ path: resolve(__dirname, "..", ".env"), quiet: true }).parsed ?? {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // Transmet les variables du `.env` racine au process `npm run dev`.
    env: { ...rootEnv, ...process.env },
  },
});
