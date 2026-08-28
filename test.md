# Guide de test local — Projet E-commerce

Ce document explique comment installer, configurer et exécuter l'ensemble des tests du projet e-commerce sur votre machine locale.

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Installation et setup initial](#2-installation-et-setup-initial)
3. [Lancement du serveur de développement](#3-lancement-du-serveur-de-développement)
4. [Tests unitaires (Vitest)](#4-tests-unitaires-vitest)
5. [Tests end-to-end (Playwright)](#5-tests-end-to-end-playwright)
6. [Linting et formatage](#6-linting-et-formatage)
7. [Tests via Docker (optionnel)](#7-tests-via-docker-optionnel)
8. [Créer ses propres tests](#8-créer-ses-propres-tests)
9. [Debugging des tests](#9-debugging-des-tests)
10. [Sécurité et vulnérabilités npm](#10-sécurité-et-vulnérabilités-npm)

---

## 1. Prérequis

| Outil | Version requise | Vérification |
|-------|-----------------|--------------|
| **Node.js** | ≥ 18.18 (LTS recommandée) | `node --version` |
| **npm** | ≥ 9 | `npm --version` |
| **PostgreSQL** | 16 | `psql --version` |
| **Docker** (optionnel) | ≥ 24 | `docker --version` |
| **Docker Compose** (optionnel) | ≥ 2.20 | `docker compose version` |

> **Note** : Docker est optionnel. Si vous disposez déjà de PostgreSQL en local, vous n'avez pas besoin de Docker pour les tests.

---

## 2. Installation et setup initial

### 2.1 Installer les dépendances

Si vous avez reçu les fichiers du projet (zip, copie, etc.) sans accès au dépôt Git :

```bash
# Naviguez vers le dossier du projet
cd /chemin/vers/ecom

# Installer les dépendances
npm install
```

> **Pas de git ?** Pas de problème — le projet fonctionne sans dépôt Git. Seules les commandes `npm` et Node.js sont nécessaires. Si vous avez un dossier `.git/` dans les fichiers reçus, vous pouvez le supprimer sans impact :
>
> ```bash
> rm -rf .git
> ```

### 2.2 Configurer les variables d'environnement

Copiez le fichier d'exemple et adaptez-le :

```bash
cp .env.example .env
```

Le fichier `.env` doit contenir au minimum :

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecom_dz?schema=public"
NEXTAUTH_SECRET="your-secret-here-remplacez-par-une-vraie-cle"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@ecom-dz.com"
ADMIN_PASSWORD="admin123"
```

> **Sécurité** : Ne jamais commiter le fichier `.env`. Assurez-vous qu'il est dans le `.gitignore`.

### 2.3 Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers PostgreSQL
npm run db:push

# (Optionnel) Lancer une migration en mode dev
npm run db:migrate

# Peupler la base avec les données de test
npm run db:seed
```

Pour vérifier que la base est correctement initialisée :

```bash
npm run db:studio
```

Cela ouvre l'interface Prisma Studio sur `http://localhost:5555`.

### 2.4 Notes pour une utilisation sans Git

Le projet ne dépend pas de Git pour fonctionner. Voici ce qu'il faut savoir :

- **Supprimer `.git/` est optionnel** : vous pouvez laisser ou supprimer le dossier `.git/` sans aucune conséquence sur le fonctionnement du projet.
- **Hooks Git non actifs** : sans dépôt Git, les hooks dans `.husky/` ne se déclenchent pas. Les commandes `git commit` ne lanceront pas automatiquement le linting ou le formatage. Pour lint manuellement, utilisez :
  ```bash
  npm run lint
  ```
- **Les scripts npm fonctionnent normalement** : toutes les commandes `npm run ...` disponibles dans ce guide fonctionnent sans Git.
- **Pas besoin de branches** : vous travaillez directement sur les fichiers, pas besoin de créer ou gérer des branches Git.

---

## 3. Lancement du serveur de développement

```bash
npm run dev
```

Le serveur démarre sur **http://localhost:3000**.

> Ce serveur est nécessaire pour les tests E2E (Playwright s'y connecte automatiquement).

---

## 4. Tests unitaires (Vitest)

Le projet utilise **Vitest** avec l'environnement `jsdom` pour simuler le navigateur.

### 4.1 Lancer les tests (mode watch)

```bash
npm run test
```

Les tests s'exécutent automatiquement à chaque modification de fichier. Utile pendant le développement.

### 4.2 Lancer les tests une seule fois

```bash
npx vitest run
```

### 4.3 Interface UI interactive

```bash
npm run test:ui
```

Ouvre une interface web pour naviguer visuellement dans les résultats des tests.

### 4.4 Fichiers de test existants

| Fichier | Description |
|---------|-------------|
| `src/lib/__tests__/utils.test.ts` | Tests des utilitaires |
| `src/lib/__tests__/validators.test.ts` | Tests des validateurs |
| `src/lib/pixels/__tests__/index.test.ts` | Tests du tracking pixel |
| `src/lib/logistics/__tests__/index.test.ts` | Tests de la logistique |
| `src/hooks/__tests__/useDelivery.test.ts` | Hook de livraison |
| `src/hooks/__tests__/useWilaya.test.ts` | Hook wilaya |

### 4.5 Exécuter un seul fichier de test

```bash
npx vitest run src/lib/__tests__/utils.test.ts
```

### 4.6 Exécuter un test par nom

```bash
npx vitest run -t "nom du test"
```

---

## 5. Tests end-to-end (Playwright)

Les tests E2E simulent un utilisateur réel qui navigue dans l'application via un navigateur **Chromium**.

### 5.1 Installer les navigateurs (première fois uniquement)

```bash
npx playwright install chromium
```

### 5.2 Lancer les tests E2E

```bash
npm run test:e2e
```

> Le serveur de développement (`npm run dev`) est automatiquement démarré par Playwright sur `http://localhost:3000` grâce à la configuration `webServer` dans `playwright.config.ts`.

### 5.3 Interface UI interactive

```bash
npm run test:e2e:ui
```

Ouvre le Playwright Test Runner avec une interface graphique pour sélectionner, lancer et déboguer les tests.

### 5.4 Fichiers E2E existants

| Fichier | Description |
|---------|-------------|
| `e2e/storefront.spec.ts` | Tests bout-en-bout de la boutique |

### 5.5 Rapports de test

Après exécution, les rapports sont générés dans le dossier `playwright-report/` :

```bash
# Ouvrir le rapport HTML dans le navigateur
npx playwright show-report
```

---

## 6. Linting et formatage

Le projet utilise **ESLint** pour l'analyse du code et **Prettier** pour le formatage.

### 6.1 Vérifier le linting

```bash
npm run lint
```

### 6.2 Corriger automatiquement les erreurs de linting

```bash
npm run lint:fix
```

### 6.3 Vérifier le formatage

```bash
npm run format:check
```

### 6.4 Formater les fichiers

```bash
npm run format
```

### 6.5 Commande recommandée avant chaque commit

```bash
npm run lint:fix && npm run format
```

---

## 7. Tests via Docker (optionnel)

Si vous préférez ne pas installer PostgreSQL en local, Docker lance l'ensemble de la stack.

### 7.1 Lancer l'application

```bash
docker compose up
```

Cela démarre :
- **PostgreSQL 16** sur le port `5432`
- **Next.js** (serveur dev) sur le port `3000`
- **Nginx** (reverse proxy)

### 7.2 Lancer en arrière-plan

```bash
docker compose up -d
```

### 7.3 Arrêter les conteneurs

```bash
docker compose down
```

### 7.4 Exécuter les tests dans Docker

Une fois les conteneurs lancés, les tests Vitest et Playwright fonctionnent normalement puisque les ports sont identiques :

```bash
# Tests unitaires
npm run test

# Tests E2E (le webServer utilisera le port 3000 déjà occupé par Docker)
npx playwright run --project=chromium
```

> **Note** : Si le serveur dev tourne déjà via Docker, désactivez la section `webServer` du `playwright.config.ts` ou lancez uniquement les tests sans auto-démarrage.

---

## 8. Créer ses propres tests

### 8.1 Conventions de nommage

| Type de test | Emplacement | Convention de nom |
|-------------|-------------|-------------------|
| Tests unitaires (lib, hooks) | `src/**/__tests__/` | `*.test.ts` ou `*.test.tsx` |
| Tests E2E | `e2e/` | `*.spec.ts` |

### 8.2 Exemple de test unitaire (Vitest)

Créez un fichier `src/lib/__tests__/maFonction.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { maFonction } from "../maFonction";

describe("maFonction", () => {
  it("devrait retourner le résultat attendu", () => {
    const resultat = maFonction("entrée");
    expect(resultat).toBe("sortie attendue");
  });

  it("devrait gérer les cas limites", () => {
    expect(() => maFonction("")).toThrow("Erreur");
  });
});
```

### 8.3 Exemple de test React (Vitest + Testing Library)

Créez un fichier `src/components/__tests__/MonComposant.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonComposant } from "../MonComposant";

describe("MonComposant", () => {
  it("devrait afficher le titre", () => {
    render(<MonComposant titre="Bonjour" />);
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
  });
});
```

### 8.4 Exemple de test E2E (Playwright)

Créez un fichier `e2e/mon-test.spec.ts` :

```typescript
import { test, expect } from "@playwright/test";

test("la page d'accueil devrait afficher le logo", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-testid="logo"]')).toBeVisible();
});

test("l'utilisateur devrait pouvoir ajouter un produit au panier", async ({
  page,
}) => {
  await page.goto("/produits");
  await page.click('[data-testid="ajouter-panier"]');
  await expect(page.locator('[data-testid="compteur-panier"]')).toHaveText("1");
});
```

### 8.5 Bonnes pratiques

- **Un test = une assertion logique** : chaque `it` doit vérifier un seul comportement.
- **Nommage descriptif** : le titre du test doit décrire le comportement attendu.
- **Isolation** : chaque test doit être indépendant (pas de dépendance entre tests).
- **`data-testid`** : utilisez des identifiants de test sur vos composants React pour les sélecteurs E2E.
- **Pas de `console.log`** dans les tests : utilisez les assertions.

---

## 9. Debugging des tests

### 9.1 Debug Vitest

```bash
# Lancer en mode watch avec le filtre par nom
npx vitest --reporter=verbose

# Debugger un test spécifique avec le inspecteur Node.js
npx vitest --inspect-brk run src/lib/__tests__/utils.test.ts
```

Dans VS Code, ajoutez un point d'arrêt et lancez la configuration de debug Vitest.

### 9.2 Debug Playwright

```bash
# Mode headed (le navigateur est visible)
npx playwright test --headed

# Mode debug (pas à pas avec inspection)
npx playwright test --debug

# Debug un seul test
npx playwright test --debug e2e/storefront.spec.ts
```

Le mode `--debug` ouvre le **Playwright Inspector** qui permet :
- De voir chaque action en temps réel
- D'inspector les sélecteurs
- De capturer des screenshots à la volée

### 9.3 Capturer un screenshot lors d'un échec

Ajoutez ceci dans `playwright.config.ts` pour capturer automatiquement un screenshot en cas d'échec :

```typescript
export default defineConfig({
  // ...
  use: {
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
});
```

Pour consulter la trace :

```bash
npx playwright show-trace trace.zip
```

### 9.4 Voir les logs du navigateur

Dans les tests Playwright :

```typescript
page.on("console", (msg) => console.log("BROWSER:", msg.text()));
page.on("pageerror", (err) => console.error("PAGE ERROR:", err));
```

---

## 10. Sécurité et vulnérabilités npm

### 10.1 Scripts d'installation approuvés

Le projet utilise le champ `allowScripts` dans `package.json` pour contrôler quels packages peuvent exécuter des scripts d'installation. Si vous voyez des warnings du type :

```
npm warn install-scripts X packages had install scripts blocked
```

Cela signifie que certains scripts d'installation ont été bloqués par npm. Les packages approuvés sont listés dans `package.json` sous le champ `allowScripts`.

> **Note** : Le champ `allowScripts` est déjà configuré dans le projet. En principe, un simple `npm install` suffit.

### 10.2 Vérifier les vulnérabilités

```bash
# Lister les vulnérabilités connues
npm audit

# Correction automatique sans breaking changes (sécuritaire)
npm audit fix

# Correction avec breaking changes (⚠️ risks — nécessite validation manuelle)
npm audit fix --force
```

> **Recommandation** : N'utilisez `npm audit fix --force` qu'après avoir vérifié les changements proposés et testé le projet.

### 10.3 Vulnérabilités connues (août 2026)

| Package | Sévérité | Impact | Fix |
|---------|----------|--------|-----|
| `postcss` (via Next.js) | 🔴 HIGH ×4 | CSS build pipeline | Attendre Next.js 16 |
| `sharp` | 🔴 HIGH | libvips (non utilisé directement) | Upgrader vers 0.35.x ou retirer |
| `deepmerge-ts` (via Prisma) | 🔴 HIGH | Stack overflow théorique | Attendre mise à jour Prisma |
| `esbuild` (via Vitest) | 🟡 MODÉRÉ | Serveur dev uniquement | Attendre Vitest 4.x |
| `uuid` (via node-cron) | 🟡 MODÉRÉ | Non utilisé directement | Upgrader node-cron ou retirer |

> Ces vulnérabilités nécessitent des breaking changes majeures. Elles seront corrigées progressivement lors des prochaines montées de version du framework.

---

## Récapitulatif des commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement (port 3000) |
| `npm run test` | Tests unitaires (Vitest, mode watch) |
| `npm run test:ui` | Tests unitaires avec interface UI |
| `npm run test:e2e` | Tests bout-en-bout (Playwright) |
| `npm run test:e2e:ui` | Tests E2E avec interface UI |
| `npm run lint` | Vérification ESLint |
| `npm run lint:fix` | Correction automatique ESLint |
| `npm run format:check` | Vérification Prettier |
| `npm run format` | Formatage Prettier |
| `npm run db:generate` | Génération du client Prisma |
| `npm run db:push` | Push du schéma vers la DB |
| `npm run db:migrate` | Migrations Prisma |
| `npm run db:seed` | Peuplement de la base |
| `npm run db:studio` | Interface Prisma Studio |
