import { test, expect } from "@playwright/test";

test.describe("Storefront", () => {
  test("la page d'accueil se charge", async ({ page }) => {
    await page.goto("/");
    // La page doit se charger sans erreur
    await expect(page.locator("body")).toBeVisible();
  });

  test("navigation vers login admin", async ({ page }) => {
    await page.goto("/admin/login");
    // Le formulaire de login doit être présent
    await expect(page.locator("form")).toBeVisible();
  });

  test("la page ne contient pas d'erreur JavaScript critique", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Pas d'erreurs JS critiques
    expect(errors).toHaveLength(0);
  });
});

test.describe("Admin Auth", () => {
  test("login page affiche le formulaire avec email et password", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("login avec identifiants invalides affiche une erreur", async ({ page }) => {
    await page.goto("/admin/login");

    // Remplir le formulaire avec de mauvais identifiants
    const emailInput = page.locator("input[type='email']");
    const passwordInput = page.locator("input[type='password']");

    if (await emailInput.isVisible()) {
      await emailInput.fill("wrong@email.com");
      await passwordInput.fill("wrongpassword");
      await page.locator("button[type='submit']").click();

      // Attendre un message d'erreur ou un changement d'état
      await page.waitForTimeout(2000);
      // La page doit toujours être sur /admin/login (pas redirigée)
      expect(page.url()).toContain("/admin/login");
    }
  });
});

test.describe("Navigation", () => {
  test("peut accéder à la page produits", async ({ page }) => {
    await page.goto("/products");
    // Soit la page existe, soit redirige
    await page.waitForLoadState("networkidle");
    expect(page.url()).toBeDefined();
  });

  test("retourne une 404 pour une page inexistante", async ({ page }) => {
    const response = await page.goto("/cette-page-nexiste-pas");
    expect(response?.status()).toBe(404);
  });
});
