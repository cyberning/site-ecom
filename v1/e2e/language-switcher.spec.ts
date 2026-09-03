import { test, expect, type Page } from "@playwright/test";

/**
 * E2E : bascule de langue de bout en bout via le LanguageSwitcher.
 *
 * Le switcher est un bouton (drapeau + nom de langue) dans le header du
 * storefront. Le menu déroulant contient 3 boutons : "Français", "العربية",
 * "English". La bascule écrit le cookie NEXT_LOCALE, met à jour
 * document.documentElement.lang/dir (rtl pour ar), puis router.refresh().
 * Le IntlProvider re-lit le cookie toutes les 1s et recharge les messages :
 * les assertions Playwright (retry automatique) absorbent ce délai.
 */

// Bouton du switcher (drapeau + nom de langue courante) — seul bouton du header.
const switcherButton = (page: Page) => page.locator("header button").first();

// Choix dans le menu déroulant (boutons en position absolue sous le header).
const switcherOption = (page: Page, name: string) =>
  page.locator("header .absolute button", { hasText: name });

// Lien de navigation traduit (Accueil / Home / الرئيسية) dans la nav du header.
const navLink = (page: Page, label: string) =>
  page.locator("header nav").getByRole("link", { name: label });

// Valeur du cookie NEXT_LOCALE via l'API cookies du contexte.
async function getLocaleCookie(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === "NEXT_LOCALE")?.value;
}

test.describe("LanguageSwitcher — bascule de langue E2E", () => {
  test("bascule fr → en → ar → fr, persistance après reload, sans erreur console", async ({
    page,
  }) => {
    // Collecte des erreurs console/JS pendant toute la séquence.
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // --- État initial : fr (défaut) ---
    // Chromium envoie Accept-Language "en" par défaut : le middleware poserait
    // donc NEXT_LOCALE=en. On force explicitement le cookie à "fr" avant la
    // navigation pour garantir un point de départ déterministe.
    await page
      .context()
      .addCookies([{ name: "NEXT_LOCALE", value: "fr", url: "http://localhost:3000" }]);
    await page.goto("/");
    await expect(navLink(page, "Accueil")).toBeVisible();
    await expect(switcherButton(page)).toHaveText(/Français/);

    // --- 1. Bascule fr → en ---
    await switcherButton(page).click();
    await switcherOption(page, "English").click();

    // (a) cookie posé
    await expect.poll(() => getLocaleCookie(page)).toBe("en");
    // (b) lang
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // (c) dir
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    // (d) contenu traduit : "Home" visible, "Accueil" absent
    await expect(navLink(page, "Home")).toBeVisible();
    await expect(navLink(page, "Accueil")).toHaveCount(0);
    // (e) le bouton du switcher reflète la langue courante
    await expect(switcherButton(page)).toHaveText(/English/);

    // --- 2. Bascule en → ar (RTL) ---
    await switcherButton(page).click();
    await switcherOption(page, "العربية").click();

    await expect.poll(() => getLocaleCookie(page)).toBe("ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    // dir rtl — CRITIQUE pour l'arabe
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(navLink(page, "الرئيسية")).toBeVisible();
    await expect(switcherButton(page)).toHaveText(/العربية/);

    // --- 3. Bascule ar → fr (retour au français) ---
    await switcherButton(page).click();
    await switcherOption(page, "Français").click();

    await expect.poll(() => getLocaleCookie(page)).toBe("fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(navLink(page, "Accueil")).toBeVisible();

    // --- 4. Persistance après reload ---
    await switcherButton(page).click();
    await switcherOption(page, "English").click();
    await expect(navLink(page, "Home")).toBeVisible();

    await page.reload();
    await expect.poll(() => getLocaleCookie(page)).toBe("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(navLink(page, "Home")).toBeVisible();

    // --- 5. Aucune erreur console/JS pendant toute la séquence ---
    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });
});
