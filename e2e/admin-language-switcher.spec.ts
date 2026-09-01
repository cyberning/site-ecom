import { test, expect, type Page } from "@playwright/test";

/**
 * E2E : sélecteur de langue du dashboard admin (AdminLanguageSwitcher).
 *
 * Le dashboard admin pilote sa propre langue via le cookie dédié
 * `ADMIN_LOCALE`, indépendamment du cookie `NEXT_LOCALE` du storefront.
 * Le layout admin (`src/app/admin/layout.tsx`) lit `ADMIN_LOCALE` côté
 * serveur et `AdminIntlProvider` synchronise `lang`/`dir` côté client
 * (rtl pour l'arabe), en restaurant lang/dir depuis `NEXT_LOCALE` au
 * démontage.
 *
 * Ces tests valident :
 *  - la bascule fr → en → ar → fr dans l'admin + persistance après reload ;
 *  - l'indépendance totale entre ADMIN_LOCALE et NEXT_LOCALE ;
 *  - la traduction de la page de login selon ADMIN_LOCALE.
 */

// ─────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ecom-dz.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const COOKIE_URL = "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────────
// Helpers cookies
// ─────────────────────────────────────────────────────────────────────
async function getCookie(page: Page, name: string): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === name)?.value;
}

const getAdminLocale = (page: Page) => getCookie(page, "ADMIN_LOCALE");
const getStorefrontLocale = (page: Page) => getCookie(page, "NEXT_LOCALE");

// ─────────────────────────────────────────────────────────────────────
// Helpers UI — admin
// ─────────────────────────────────────────────────────────────────────
// Bouton du switcher admin : aria-label traduit selon la locale admin
// courante ("Changer de langue" / "Change language" / "تغيير اللغة").
// Le regex couvre les trois langues → sélecteur stable après chaque bascule.
// (Le theme switcher a aussi aria-haspopup="true" : filtrer sur ce seul
// attribut ne suffirait pas à distinguer les deux boutons.)
const adminSwitcherButton = (page: Page) =>
  page.locator("header").getByRole("button", { name: /langue|language|اللغة/i });

// Choix dans le menu déroulant (role="menuitem", drapeau + nom).
const adminSwitcherOption = (page: Page, name: string) =>
  page.getByRole("menuitem", { name: new RegExp(name) });

// Lien de la sidebar admin traduit (Tableau de bord / Dashboard / لوحة التحكم).
const adminNavLink = (page: Page, label: string) => page.getByRole("link", { name: label });

// ─────────────────────────────────────────────────────────────────────
// Helpers UI — storefront
// ─────────────────────────────────────────────────────────────────────
const storefrontSwitcherButton = (page: Page) => page.locator("header button").first();
const storefrontSwitcherOption = (page: Page, name: string) =>
  page.locator("header .absolute button", { hasText: name });
const storefrontNavLink = (page: Page, label: string) =>
  page.locator("header nav").getByRole("link", { name: label });

// ─────────────────────────────────────────────────────────────────────
// Helper vérification aria-current (coche/surlignage du switcher)
// ─────────────────────────────────────────────────────────────────────
// L'item sélectionné du menu porte `aria-current="true"` (voir
// AdminLanguageSwitcher). On vérifie l'état de la coche via cet attribut,
// plus robuste que le caractère "✓" (aria-hidden). On cible directement
// l'attribut via un sélecteur CSS (`.filter({ hasAttribute })` s'est avéré
// peu fiable ici) combiné au texte du libellé.
const adminSwitcherOptionCurrent = (page: Page, name: string) =>
  page.locator('[role="menuitem"][aria-current="true"]', { hasText: name });

// ─────────────────────────────────────────────────────────────────────
// Helper login admin
// ─────────────────────────────────────────────────────────────────────
// Le login est un client component qui appelle signIn("credentials") puis
// router.push("/admin"). On attend la redirection ET la sidebar visible.
// Les sélecteurs sont tolérants à la langue (fr par défaut dans les tests
// A/B, mais le helper reste utilisable si ADMIN_LOCALE change).
async function loginAsAdmin(page: Page) {
  // Pré-chauffe le route handler NextAuth (/api/auth/[...nextauth]) pour
  // éviter un cold-start du dev server pendant le login, qui peut casser le
  // CSRF token (erreur "MissingCSRF" de NextAuth v5 beta).
  await page.goto("/api/auth/csrf");
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  // getByRole("textbox") exclut le bouton "Afficher le mot de passe" dont
  // l'aria-label contient aussi "mot de passe".
  await page
    .getByRole("textbox", { name: /mot de passe|password|كلمة المرور/i })
    .fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /se connecter|sign in|تسجيل الدخول/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  // La sidebar est traduite selon ADMIN_LOCALE : on attend le lien "Tableau de
  // bord" (fr) OU "Dashboard" (en) OU "لوحة التحكم" (ar) selon la locale admin.
  await expect(
    page.getByRole("link", { name: /Tableau de bord|Dashboard|لوحة التحكم/ })
  ).toBeVisible();
}

// Variante du login pour un dashboard admin en arabe (ADMIN_LOCALE=ar) :
// les labels du formulaire sont traduits ("البريد الإلكتروني", "كلمة
// المرور", "تسجيل الدخول"), donc les sélecteurs fr/en du helper
// `loginAsAdmin` ne matchent pas. On réutilise la même logique (pré-chauffe
// du route handler NextAuth + attente de la sidebar) avec des sélecteurs
// tolérants aux trois langues.
async function loginAsAdminArabic(page: Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/admin/login");
  await page.getByRole("textbox", { name: /email|البريد الإلكتروني/i }).fill(ADMIN_EMAIL);
  await page
    .getByRole("textbox", { name: /mot de passe|password|كلمة المرور/i })
    .fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /se connecter|sign in|تسجيل الدخول/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(adminNavLink(page, "لوحة التحكم")).toBeVisible();
}

// ─────────────────────────────────────────────────────────────────────
// Helper collecte d'erreurs console/JS
// ─────────────────────────────────────────────────────────────────────
function collectErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  return { consoleErrors, pageErrors };
}

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────
test.describe("AdminLanguageSwitcher — bascule de langue E2E", () => {
  test("A — bascule fr → en → ar → fr dans l'admin, persistance, sans erreur console", async ({
    page,
  }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    // État initial déterministe : les deux cookies en fr.
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "fr", url: COOKIE_URL },
      { name: "ADMIN_LOCALE", value: "fr", url: COOKIE_URL },
    ]);

    await loginAsAdmin(page);

    // Le bouton switcher existe dans le header (aria-label fr).
    await expect(
      page.locator("header").getByRole("button", { name: "Changer de langue" })
    ).toBeVisible();

    // --- 1. Bascule fr → en ---
    await adminSwitcherButton(page).click();
    await adminSwitcherOption(page, "English").click();

    await expect.poll(() => getAdminLocale(page)).toBe("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(adminNavLink(page, "Dashboard")).toBeVisible();
    await expect(adminNavLink(page, "Tableau de bord")).toHaveCount(0);

    // --- 2. Bascule en → ar (RTL) ---
    await adminSwitcherButton(page).click();
    await adminSwitcherOption(page, "العربية").click();

    await expect.poll(() => getAdminLocale(page)).toBe("ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(adminNavLink(page, "لوحة التحكم")).toBeVisible();

    // --- 3. Bascule ar → fr ---
    await adminSwitcherButton(page).click();
    await adminSwitcherOption(page, "Français").click();

    await expect.poll(() => getAdminLocale(page)).toBe("fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(adminNavLink(page, "Tableau de bord")).toBeVisible();

    // --- 4. Persistance après reload ---
    await adminSwitcherButton(page).click();
    await adminSwitcherOption(page, "English").click();
    await expect(adminNavLink(page, "Dashboard")).toBeVisible();

    await page.reload();
    await expect.poll(() => getAdminLocale(page)).toBe("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(adminNavLink(page, "Dashboard")).toBeVisible();

    // --- 5. Aucune erreur console/JS pendant toute la séquence ---
    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });

  test("B — indépendance admin ↔ storefront (ADMIN_LOCALE vs NEXT_LOCALE)", async ({ page }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "fr", url: COOKIE_URL },
      { name: "ADMIN_LOCALE", value: "fr", url: COOKIE_URL },
    ]);

    await loginAsAdmin(page);

    // --- 1. Bascule admin en ar ---
    await adminSwitcherButton(page).click();
    await adminSwitcherOption(page, "العربية").click();
    await expect.poll(() => getAdminLocale(page)).toBe("ar");
    await expect(adminNavLink(page, "لوحة التحكم")).toBeVisible();

    // ADMIN_LOCALE=ar MAIS NEXT_LOCALE reste fr (indépendance).
    await expect.poll(() => getStorefrontLocale(page)).toBe("fr");

    // --- 2. Storefront toujours en français malgré l'admin en ar ---
    await page.goto("/");
    await expect(storefrontNavLink(page, "Accueil")).toBeVisible();
    await expect(storefrontNavLink(page, "الرئيسية")).toHaveCount(0);
    // Le provider admin restaure lang/dir depuis NEXT_LOCALE au démontage.
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    // --- 3. Bascule storefront en en : NEXT_LOCALE=en, ADMIN_LOCALE reste ar ---
    await storefrontSwitcherButton(page).click();
    await storefrontSwitcherOption(page, "English").click();
    await expect.poll(() => getStorefrontLocale(page)).toBe("en");
    await expect.poll(() => getAdminLocale(page)).toBe("ar");
    await expect(storefrontNavLink(page, "Home")).toBeVisible();

    // --- 4. Retour admin : toujours en arabe malgré le storefront en en ---
    await page.goto("/admin");
    await expect(adminNavLink(page, "لوحة التحكم")).toBeVisible();
    await expect(adminNavLink(page, "Dashboard")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // --- 5. Aucune erreur console/JS pendant toute la séquence ---
    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });

  test("C — la page de login est traduite selon ADMIN_LOCALE", async ({ page }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    // NEXT_LOCALE=fr (storefront) mais ADMIN_LOCALE=en : la page de login
    // (sous le layout admin) doit s'afficher en anglais.
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "fr", url: COOKIE_URL },
      { name: "ADMIN_LOCALE", value: "en", url: COOKIE_URL },
    ]);

    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
    await expect(page.getByText("Connexion Admin")).toHaveCount(0);

    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });

  test("D — la coche/surlignage du switcher suit la bascule (aria-current)", async ({ page }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "fr", url: COOKIE_URL },
      { name: "ADMIN_LOCALE", value: "fr", url: COOKIE_URL },
    ]);

    await loginAsAdmin(page);

    // --- 1. État initial : "Français" est sélectionné (aria-current), pas "English" ---
    await adminSwitcherButton(page).click();
    await expect(adminSwitcherOptionCurrent(page, "Français")).toHaveCount(1);
    await expect(adminSwitcherOptionCurrent(page, "English")).toHaveCount(0);
    await expect(adminSwitcherOptionCurrent(page, "العربية")).toHaveCount(0);

    // --- 2. Bascule vers "English" : la coche/surlignage suit immédiatement ---
    await adminSwitcherOption(page, "English").click();
    await expect.poll(() => getAdminLocale(page)).toBe("en");

    // Rouvre le dropdown : "English" est maintenant sélectionné, "Français" ne l'est plus.
    await adminSwitcherButton(page).click();
    await expect(adminSwitcherOptionCurrent(page, "English")).toHaveCount(1);
    await expect(adminSwitcherOptionCurrent(page, "Français")).toHaveCount(0);
    await expect(adminSwitcherOptionCurrent(page, "العربية")).toHaveCount(0);

    // --- 3. Ferme le dropdown (clic extérieur) ---
    await page.locator("h1").first().click();
    await expect(page.locator("#admin-language-menu")).toHaveCount(0);

    // --- 4. Aucune erreur console/JS ---
    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });

  test("E — restauration lang/dir du storefront après navigation client-side depuis /admin", async ({
    page,
  }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    // Admin en arabe (RTL) alors que le storefront reste en français.
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "fr", url: COOKIE_URL },
      { name: "ADMIN_LOCALE", value: "ar", url: COOKIE_URL },
    ]);

    await loginAsAdminArabic(page);

    // L'admin est en arabe → document en RTL.
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // --- Navigation client-side vers le storefront ---
    // Le lien "Voir le storefront" de la sidebar (admin.nav.viewStorefront) pointe
    // vers "/" mais avec target="_blank" (nouvel onglet, pas une navigation
    // client-side). Pour déclencher une VRAIE navigation client-side (qui démonte
    // AdminIntlProvider et exécute son cleanup), on retire l'attribut target puis
    // on clique programmatiquement sur le lien. Le DOM React survit (pas de
    // rechargement complet), ce qui exerce bien le cleanup du provider admin.
    const link = page.locator('aside a[href="/"]');
    await expect(link).toBeVisible();
    await link.evaluate((el) => el.removeAttribute("target"));
    await link.click();

    // On est revenu sur le storefront (URL "/").
    await expect(page).toHaveURL(/\/$/);

    // Le cleanup du provider admin a restauré lang/dir depuis NEXT_LOCALE=fr :
    // le storefront ne doit PAS rester en RTL après une visite admin en arabe.
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(storefrontNavLink(page, "Accueil")).toBeVisible();

    // --- Aucune erreur console/JS ---
    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });

  test("F — /admin/settings/users suit ADMIN_LOCALE (indépendant de NEXT_LOCALE)", async ({
    page,
  }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    // NEXT_LOCALE=fr (storefront) mais ADMIN_LOCALE=en : la page users doit
    // s'afficher en anglais malgré le storefront en français.
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "fr", url: COOKIE_URL },
      { name: "ADMIN_LOCALE", value: "en", url: COOKIE_URL },
    ]);

    await loginAsAdmin(page);

    // --- 1. ADMIN_LOCALE=en → titre "Users" ---
    await page.goto("/admin/settings/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("Utilisateurs")).toHaveCount(0);

    // --- 2. Bascule ADMIN_LOCALE=ar (cookie + reload) → titre "المستخدمون" ---
    await page.context().addCookies([{ name: "ADMIN_LOCALE", value: "ar", url: COOKIE_URL }]);
    await page.reload();
    await expect(page.getByRole("heading", { name: "المستخدمون" })).toBeVisible();
    await expect(page.getByText("Users")).toHaveCount(0);

    // --- 3. Aucune erreur console/JS ---
    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });

  test("G — fallback sur la locale par défaut quand ADMIN_LOCALE est invalide", async ({
    page,
  }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    // ADMIN_LOCALE=de n'est pas une locale supportée → fallback sur "fr".
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "fr", url: COOKIE_URL },
      { name: "ADMIN_LOCALE", value: "de", url: COOKIE_URL },
    ]);

    await loginAsAdmin(page);

    // L'admin s'affiche en français (fallback defaultLocale).
    await expect(adminNavLink(page, "Tableau de bord")).toBeVisible();

    // Le switcher montre "Français" comme sélectionné (aria-current).
    await adminSwitcherButton(page).click();
    await expect(adminSwitcherOptionCurrent(page, "Français")).toHaveCount(1);
    await expect(adminSwitcherOptionCurrent(page, "English")).toHaveCount(0);
    await expect(adminSwitcherOptionCurrent(page, "العربية")).toHaveCount(0);

    // --- Aucune erreur console/JS ---
    expect(pageErrors, `Erreurs JS: ${pageErrors.join(" | ")}`).toHaveLength(0);
    expect(consoleErrors, `Erreurs console: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });
});
