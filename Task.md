# Task.md — Plan de Développement Détaillé

> **Projet :** E-Commerce Multi-Theme COD Template (Next.js / DZ Market)
> **Cible :** Commerçants algériens — Cash on Delivery — 69 Wilayas — 1541 Communes
> **Dernière mise à jour :** 2026-08-25

---

## Stack Technique

| Technologie | Version recommandée | Usage |
|---|---|---|
| **Next.js** | 15.x (App Router) | Framework fullstack, SSR/SSG, API Routes |
| **React** | 19.x | UI library |
| **TypeScript** | 5.6+ | Typage statique |
| **Prisma** | 6.x | ORM, migrations, seed |
| **PostgreSQL** | 16 | Base de données relationnelle |
| **NextAuth (Auth.js)** | 5.x (beta) | Authentification, sessions JWT |
| **Zustand** | 5.x | State management client |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **next-intl** | 4.x | Internationalisation trilingue (FR/AR/EN) |
| **Zod** | 3.x | Validation schémas côté client & serveur |
| **sharp** | 0.33+ | Compression/redimensionnement images |
| **Playwright** | 1.48+ | Tests E2E |
| **Vitest** | 2.x | Tests unitaires / intégration |
| **Docker** | 27+ | Conteneurisation |
| **Docker Compose** | 2.x | Orchestration multi-conteneurs |
| **Nginx** | 1.27+ | Reverse proxy, static assets, SSL |
| **ESLint** | 9.x (flat config) | Linting |
| **Prettier** | 3.x | Formatage code |
| **Husky** | 9.x | Git hooks |
| **lint-staged** | 15.x | Linting staged files |
| **node-cron** | 3.x | Tâches planifiées (retry commandes) |

### Dépendances npm globales (package.json)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.4",
    "@prisma/client": "^6.0.0",
    "zustand": "^5.0.0",
    "next-intl": "^4.0.0",
    "zod": "^3.23.0",
    "sharp": "^0.33.0",
    "formidable": "^3.5.0",
    "crypto-js": "^4.2.0",
    "node-cron": "^3.0.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "date-fns": "^4.1.0",
    "recharts": "^2.13.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/formidable": "^3.0.0",
    "@types/crypto-js": "^4.2.0",
    "prisma": "^6.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.4.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0"
  }
}
```

---

## Phase 0 : Initialisation du Projet

**Objectif :** Créer le squelette du projet avec toute la tooling en place.

### 0.1 — Création du projet Next.js
- **Complexité :** Facile
- **Commande :** `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- **Vérifications :**
  - [ ] App Router activé (`app/` directory)
  - [ ] `src/` directory configuré
  - [ ] TypeScript strict mode dans `tsconfig.json`
  - [ ] Import alias `@/*` fonctionnel

### 0.2 — Structure de dossiers
- **Complexité :** Facile
- **Arborescence à créer :**

```
src/
├── app/
│   ├── (storefront)/           # Routes publiques (pas de layout admin)
│   │   ├── page.tsx            # Homepage
│   │   ├── product/[slug]/
│   │   │   └── page.tsx        # Landing Page Produit COD
│   │   └── thank-you/
│   │       └── page.tsx        # Page Thank You
│   ├── admin/
│   │   ├── layout.tsx          # Layout admin (sidebar + header)
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── products/
│   │   │   ├── page.tsx        # Liste produits
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Édition produit
│   │   ├── orders/
│   │   │   ├── page.tsx        # Pipeline commandes
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Détail commande
│   │   ├── delivery/
│   │   │   └── page.tsx        # Matrice livraison 69 Wilayas
│   │   ├── pixels/
│   │   │   └── page.tsx        # Multi-Pixel Management
│   │   ├── settings/
│   │   │   ├── page.tsx        # Theme Switcher global
│   │   │   └── users/
│   │   │       └── page.tsx    # User Management (RBAC)
│   │   └── analytics/
│   │       └── page.tsx        # Dashboard analytics
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts    # NextAuth handlers
│   │   ├── products/
│   │   │   ├── route.ts        # GET (list) + POST (create)
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET + PUT + DELETE
│   │   ├── variants/
│   │   │   └── [id]/
│   │   │       └── route.ts    # PUT (toggle active) + DELETE
│   │   ├── orders/
│   │   │   ├── route.ts        # GET (list) + POST (create from storefront)
│   │   │   ├── [id]/
│   │   │   │   └── route.ts    # GET + PATCH (status update)
│   │   │   └── [id]/
│   │   │       └── cancel/
│   │   │           └── route.ts # POST (cancel)
│   │   ├── delivery/
│   │   │   ├── matrix/
│   │   │   │   └── route.ts    # GET + PUT matrice tarifs
│   │   │   └── calculate/
│   │   │       └── route.ts    # POST calcul tarif dynamique
│   │   ├── pixels/
│   │   │   ├── route.ts        # GET + POST pixels
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET + PUT + DELETE
│   │   ├── upload/
│   │   │   └── route.ts        # POST upload médias
│   │   ├── webhooks/
│   │   │   ├── meta/
│   │   │   │   └── route.ts    # Meta CAPI webhook
│   │   │   └── tiktok/
│   │   │       └── route.ts    # TikTok Events API webhook
│   │   ├── wilayas/
│   │   │   └── route.ts        # GET liste Wilayas
│   │   ├── communes/
│   │   │   └── route.ts        # GET communes par wilaya
│   │   └── cron/
│   │       └── retry-orders/
│   │           └── route.ts    # Cron retry commandes
│   ├── layout.tsx              # Root layout (providers, fonts, i18n)
│   └── not-found.tsx           # 404 global
├── components/
│   ├── ui/                     # Composants UI génériques
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx
│   │   └── ThemeSwitcher.tsx
│   ├── storefront/             # Composants publique
│   │   ├── HeroBanner.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ImageCarousel.tsx
│   │   ├── VideoDemo.tsx
│   │   ├── BenefitsSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── ReviewsSection.tsx
│   │   ├── CheckoutForm.tsx
│   │   ├── WilayaSelect.tsx
│   │   ├── CommuneSelect.tsx
│   │   ├── DeliveryModeToggle.tsx
│   │   ├── OrderSummary.tsx
│   │   ├── TrustBadges.tsx
│   │   └── LanguageSwitcher.tsx
│   └── admin/                  # Composants admin
│       ├── Sidebar.tsx
│       ├── AdminHeader.tsx
│       ├── ProductForm.tsx
│       ├── VariantManager.tsx
│       ├── OrderPipeline.tsx
│       ├── DeliveryMatrixTable.tsx
│       ├── PixelManager.tsx
│       └── UserTable.tsx
├── lib/
│   ├── prisma.ts               # Singleton Prisma
│   ├── auth.ts                 # NextAuth config
│   ├── utils.ts                # Helpers généraux
│   ├── constants.ts            # Constantes (wilayas, thèmes, etc.)
│   ├── validators.ts           # Schémas Zod
│   ├── pixels.ts               # Tracking pixel manager
│   ├── encryption.ts           # AES-256 chiffrage tokens
│   └── hash.ts                 # SHA-256 hashing
├── providers/
│   ├── ThemeProvider.tsx        # Contexte thème
│   ├── AuthProvider.tsx         # Session provider
│   ├── IntlProvider.tsx         # i18n provider
│   └── ToastProvider.tsx        # Notifications toast
├── stores/
│   ├── cartStore.ts             # Panier (si applicable)
│   ├── checkoutStore.ts         # État du formulaire checkout
│   └── adminStore.ts            # État admin (sidebar, etc.)
├── hooks/
│   ├── useTheme.ts
│   ├── useWilaya.ts             # Hook cascade wilaya/commune
│   ├── useDelivery.ts           # Calcul tarif dynamique
│   └── usePixel.ts             # Envoi événements pixel
├── i18n/
│   ├── config.ts                # Config next-intl
│   └── request.ts               # Server request config
├── messages/
│   ├── fr.json                  # Traductions FR
│   ├── ar.json                  # Traductions AR
│   └── en.json                  # Traductions EN
├── types/
│   ├── index.ts                 # Types globaux
│   ├── product.ts               # Types produit
│   ├── order.ts                 # Types commande
│   ├── delivery.ts              # Types livraison
│   └── pixel.ts                 # Types pixel/tracking
├── middleware.ts                 # Middleware Next.js (auth + i18n + theme)
└── styles/
    └── themes.css               # CSS variables thèmes
```

### 0.3 — Outils de développement
- **Complexité :** Facile
- **Étapes :**
  - [ ] Configurer ESLint (flat config `eslint.config.mjs`)
  - [ ] Configurer Prettier (`.prettierrc` + `.prettierignore`)
  - [ ] Installer et configurer Husky (`npx husky init`)
  - [ ] Configurer lint-staged dans `package.json`
  - [ ] Ajouter scripts npm dans `package.json` :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "cron:retry-orders": "curl -X POST http://localhost:3000/api/cron/retry-orders"
  }
}
```

### 0.4 — Configuration Git
- **Complexité :** Facile
- **Étapes :**
  - [ ] Créer `.gitignore` complet (node_modules, .env*, .next, uploads, etc.)
  - [ ] Branches : `main` (production), `develop` (intégration), feature branches
  - [ ] Husky pre-commit hook : lint-staged

### 0.5 — Fichier .env.example
- **Complexité :** Facile
- **Contenu :**

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecom_dz?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Admin credentials (for seed)
ADMIN_EMAIL="admin@ecom-dz.com"
ADMIN_PASSWORD="admin123"

# Pixel tokens (encrypted in DB, these are plain for initial setup)
META_PIXEL_ID=""
META_ACCESS_TOKEN=""
TIKTOK_PIXEL_CODE=""
TIKTOK_ACCESS_TOKEN=""

# Encryption key for pixel tokens (AES-256)
ENCRYPTION_KEY="your-32-byte-encryption-key-here"

# Upload config
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="5242880"  # 5MB

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="E-Commerce DZ"
```

**Dépendances npm Phase 0 :** Aucune en plus (tout est dans la stack globale)
**Fichiers créés :** `~50 fichiers` (structure + configs)
**Liens :** —
**Dépendances phases suivantes :** Phase 1 dépend de cette phase

---

## Phase 1 : Schéma de Base de Données & Migrations

**Objectif :** Définir tous les modèles Prisma avec relations, index, et enums.

### 1.1 — Enums Prisma
- **Complexité :** Moyen
- **Fichier :** `prisma/schema.prisma`

```prisma
enum UserRole {
  ADMIN
  CALL_AGENT
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

enum OrderFallback {
  NONE
  BORDEREAU_NON_GENERE
}

enum DeliveryMode {
  HOME
  STOP_DESK
}

enum Theme {
  NEUMORPHISM
  LUXURY
  VIBRANT
  ORGANIC
  TECH
}

enum SupportedLocale {
  FR
  AR
  EN
}
```

### 1.2 — Modèle Users
- **Complexité :** Moyen

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String
  role          UserRole  @default(CALL_AGENT)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  orders        Order[]

  @@index([email])
  @@index([role])
  @@map("users")
}
```

### 1.3 — Modèle Categories
- **Complexité :** Facile

```prisma
model Category {
  id          String     @id @default(cuid())
  name        String     // Clé i18n ou JSON {fr, ar, en}
  slug        String     @unique
  isActive    Boolean    @default(true)
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  products    Product[]

  @@index([slug])
  @@index([isActive])
  @@map("categories")
}
```

### 1.4 — Modèle Products
- **Complexité :** Complexe

```prisma
model Product {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  description     String?   // HTML/Markdown riche
  shortDesc       String?   // Description courte (max 160 chars)
  basePrice       Decimal   @db.Decimal(10, 2)  // Prix de base en DZD
  isActive        Boolean   @default(true)
  isFeatured      Boolean   @default(false)
  categoryId      String?
  seoTitle        String?
  seoDescription  String?
  seoKeywords     String?   // JSON array de mots-clés
  sortOrder       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  category        Category?  @relation(fields: [categoryId], references: [id])
  variants        Variant[]
  images          ProductImage[]
  reviews         Review[]
  productPixels   ProductPixel[]

  @@index([slug])
  @@index([isActive])
  @@index([isFeatured])
  @@index([categoryId])
  @@index([createdAt(sort: Desc)])
  @@map("products")
}
```

### 1.5 — Modèle Variants
- **Complexité :** Complexe

```prisma
model Variant {
  id            String    @id @default(cuid())
  productId     String
  name          String    // ex: "Taille M, Rouge"
  sku           String?   @unique
  price         Decimal   @db.Decimal(10, 2)  // Prix DZD (peut différer du base)
  isActive      Boolean   @default(true)     // Toggle Active/Inactive (pas de compteur stock)
  imageId       String?   // Image spécifique à la variante
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  product       Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  image         ProductImage?    @relation(fields: [imageId], references: [id])
  orderItems    OrderItem[]

  @@index([productId])
  @@index([isActive])
  @@index([sku])
  @@map("variants")
}
```

### 1.6 — Modèle ProductImage
- **Complexité :** Facile

```prisma
model ProductImage {
  id          String    @id @default(cuid())
  productId   String
  url         String    // Chemin relatif: /uploads/products/xxx.webp
  alt         String?   @default("")
  isPrimary   Boolean   @default(false)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())

  // Relations
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  variants    Variant[]

  @@index([productId])
  @@map("product_images")
}
```

### 1.7 — Modèle Review
- **Complexité :** Facile

```prisma
model Review {
  id          String    @id @default(cuid())
  productId   String
  authorName  String
  rating      Int       // 1-5
  comment     String?
  imageUrl    String?   // Photo du client (optionnel)
  isApproved  Boolean   @default(false)
  createdAt   DateTime  @default(now())

  // Relations
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([isApproved])
  @@map("reviews")
}
```

### 1.8 — Modèle Orders & OrderItems
- **Complexité :** Complexe

```prisma
model Order {
  id              String          @id @default(cuid())
  trackingId      String          @unique  // ID format: DZ-{timestamp}-{random}
  userId          String?         // Agent qui traite la commande (null si auto)

  // Client info
  customerName    String
  customerPhone   String          // Au format: 0XXXXXXXXX
  customerPhoneHash String        // SHA-256 pour tracking

  // Address
  wilayaCode      String          // Code wilaya (01-69)
  communeCode     String          // Code commune
  fullAddress     String          // Adresse complète libre

  // Delivery
  deliveryMode    DeliveryMode    @default(HOME)
  deliveryFee     Decimal         @db.Decimal(10, 2) @default(0) // Tarif livraison en DZD

  // Pricing
  subtotal        Decimal         @db.Decimal(10, 2) // Somme des items
  total           Decimal         @db.Decimal(10, 2) // subtotal + deliveryFee
  currency        String          @default("DZD")

  // Status
  status          OrderStatus     @default(PENDING)
  fallback        OrderFallback   @default(NONE)
  statusNote      String?         // Note sur le changement de statut

  // Tracking
  ip              String?         // IP capture au submit
  userAgent       String?         // User-Agent capture au submit

  // Metadata
  notes           String?         // Notes internes
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  user            User?           @relation(fields: [userId], references: [id])
  items           OrderItem[]
  statusHistory   OrderStatusHistory[]

  @@index([trackingId])
  @@index([status])
  @@index([wilayaCode])
  @@index([createdAt(sort: Desc)])
  @@index([customerPhoneHash])
  @@map("orders")
}

model OrderItem {
  id          String    @id @default(cuid())
  orderId     String
  variantId   String
  quantity    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(10, 2) // Prix snapshot au moment de la commande
  totalPrice  Decimal   @db.Decimal(10, 2) // unitPrice * quantity
  createdAt   DateTime  @default(now())

  // Relations
  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant     Variant   @relation(fields: [variantId], references: [id])

  @@index([orderId])
  @@index([variantId])
  @@map("order_items")
}

model OrderStatusHistory {
  id          String      @id @default(cuid())
  orderId     String
  fromStatus  OrderStatus?
  toStatus    OrderStatus
  note        String?
  changedById String?     // userId de l'agent
  createdAt   DateTime    @default(now())

  // Relations
  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  changedBy   User?       @relation(fields: [changedById], references: [id])

  @@index([orderId])
  @@map("order_status_history")
}
```

### 1.9 — Modèle DeliveryMatrix
- **Complexité :** Complexe

```prisma
model DeliveryMatrix {
  id              String        @id @default(cuid())
  wilayaCode      String        // Code wilaya (01-69)
  wilayaName      String        // Nom de la wilaya
  homeFee         Decimal       @db.Decimal(10, 2)  // Tarif livraison domicile
  stopDeskFee     Decimal       @db.Decimal(10, 2)  // Tarif livraison stop desk
  estimatedDays   Int           @default(2)          // Jours estimés de livraison
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([wilayaCode])
  @@index([wilayaCode])
  @@map("delivery_matrix")
}
```

### 1.10 — Modèle Settings
- **Complexité :** Moyen

```prisma
model Setting {
  id          String    @id @default(cuid())
  key         String    @unique
  value       Json      // Valeur flexible (string, number, object, array)
  type        String    @default("string") // "string" | "number" | "boolean" | "json"
  category    String    @default("general") // "general" | "theme" | "pixel" | "delivery"
  description String?
  updatedAt   DateTime  @updatedAt

  @@index([key])
  @@index([category])
  @@map("settings")
}
```

### 1.11 — Modèle Pixels & ProductPixels
- **Complexité :** Complexe

```prisma
model Pixel {
  id              String    @id @default(cuid())
  name            String    // Nom descriptif: "Meta Pixel principal"
  type            String    // "meta" | "tiktok"
  pixelId         String    // ID du pixel (ex: Meta Pixel ID ou TikTok Pixel Code)
  accessToken     String?   // Token accès (chiffré AES-256 en DB)
  isActive        Boolean   @default(true)
  isGlobal        Boolean   @default(true)  // true = assigné à tous les produits
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  productPixels   ProductPixel[]

  @@index([type])
  @@index([isActive])
  @@index([isGlobal])
  @@map("pixels")
}

model ProductPixel {
  id          String    @id @default(cuid())
  productId   String
  pixelId     String
  createdAt   DateTime  @default(now())

  // Relations
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  pixel       Pixel     @relation(fields: [pixelId], references: [id], onDelete: Cascade)

  @@unique([productId, pixelId])
  @@index([productId])
  @@index([pixelId])
  @@map("product_pixels")
}
```

### 1.12 — Modèle Wilaya & Commune (seed)
- **Complexité :** Moyen

```prisma
model Wilaya {
  code          String    @id           // "01" à "69"
  name          String
  nameAr        String    @map("name_ar")
  communeCount  Int       @default(0)
  isActive      Boolean   @default(true)

  // Relations
  communes      Commune[]

  @@index([code])
  @@map("wilayas")
}

model Commune {
  id            String    @id @default(cuid())
  code          String    @unique
  name          String
  nameAr        String    @map("name_ar")
  wilayaCode    String
  isActive      Boolean   @default(true)

  // Relations
  wilaya        Wilaya    @relation(fields: [wilayaCode], references: [code])

  @@index([wilayaCode])
  @@index([code])
  @@map("communes")
}
```

### 1.13 — Migration Prisma
- **Complexité :** Facile
- **Étapes :**
  - [ ] Créer `prisma/schema.prisma` avec tout le schéma ci-dessus
  - [ ] `npx prisma generate` → vérifier la génération du client
  - [ ] `npx prisma migrate dev --name init` → créer la migration initiale
  - [ ] Vérifier la migration dans `prisma/migrations/`
  - [ ] `npx prisma db push` pour appliquer en dev

**Dépendances npm Phase 1 :** `@prisma/client` (déjà dans stack globale)
**Fichiers créés :** `prisma/schema.prisma`, `prisma/migrations/`, `src/lib/prisma.ts`
**Dépendances phases suivantes :** Phase 2 dépend de cette phase (auth a besoin de la table User)

---

## Phase 2 : Authentification & RBAC

**Objectif :** Authentification par credentials avec JWT, rôles Admin/Call Agent, middleware de protection.

### 2.1 — Singleton Prisma
- **Complexité :** Facile
- **Fichier :** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 2.2 — Configuration NextAuth v5
- **Complexité :** Complexe
- **Fichier :** `src/lib/auth.ts`
- **Étapes :**
  - [ ] Configurer NextAuth avec `next-auth` v5 (Auth.js)
  - [ ] Provider Credentials (email + password)
  - [ ] Callback `jwt` : injecter `role` et `userId` dans le token
  - [ ] Callback `session` : exposer `role` et `id` depuis le token
  - [ ] Utiliser `@auth/prisma-adapter` si sessions DB souhaitées (sinon JWT pur)
  - [ ] Hashage des mots de passe avec `bcrypt` (installer `bcryptjs` + `@types/bcryptjs`)
  - [ ] Validation Zod des credentials avant lookup

```typescript
// Exemple structure (pas le code complet, juste la logique)
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Valider avec Zod
        // 2. Chercher user par email
        // 3. Comparer password avec bcrypt
        // 4. Vérifier isActive
        // 5. Retourner { id, email, name, role }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});
```

### 2.3 — Route API Auth
- **Complexité :** Facile
- **Fichier :** `src/app/api/auth/[...nextauth]/route.ts`
- **Étapes :**
  - [ ] Exporter `GET` et `POST` depuis `handlers`
  - [ ] `export { handlers as GET, handlers as POST }`

### 2.4 — Page de Login Admin
- **Complexité :** Moyen
- **Fichier :** `src/app/admin/login/page.tsx`
- **Étapes :**
  - [ ] Formulaire email + password avec validation Zod
  - [ ] Utiliser `signIn` de NextAuth
  - [ ] Gestion des erreurs (credentials invalides)
  - [ ] Redirection vers `/admin` après succès
  - [ ] Style thème cohérent

### 2.5 — Type Extension pour Session
- **Complexité :** Facile
- **Fichier :** `src/types/index.ts`

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: "ADMIN" | "CALL_AGENT";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "CALL_AGENT";
    userId: string;
  }
}
```

### 2.6 — Middleware de Protection
- **Complexité :** Complexe
- **Fichier :** `src/middleware.ts`
- **Étapes :**
  - [ ] Protéger toutes les routes `/admin/**`
  - [ ] Rediriger vers `/admin/login` si non authentifié
  - [ ] Vérifier le rôle : seuls `ADMIN` et `CALL_AGENT` accèdent à `/admin`
  - [ ] Protéger les routes API `/api/admin/**` (vérifier le token JWT)
  - [ ] Laisser passer les routes publiques (storefront, api/products, etc.)
  - [ ] Intégrer la logique i18n dans le middleware (Phase 4)

```typescript
// Logique simplifiée
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isApiAdminRoute = req.nextUrl.pathname.startsWith("/api/admin");

  if ((isAdminRoute || isApiAdminRoute) && !req.auth) {
    return Response.redirect(new URL("/admin/login", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

### 2.7 — Hook useSession personnalisé
- **Complexité :** Facile
- **Étapes :**
  - [ ] Créer `src/hooks/useSession.ts` wrapper de `useSession` de NextAuth
  - [ ] Exposer helpers : `isAdmin`, `isAgent`, `isAuthenticated`

### 2.8 — Seed Admin User
- **Complexité :** Moyen
- **Fichier :** `prisma/seed.ts`
- **Étapes :**
  - [ ] Créer le fichier seed avec un admin par défaut
  - [ ] Email/password depuis `.env`
  - [ ] Hash du mot de passe avec bcryptjs
  - [ ] Upsert pour éviter les doublons

**Dépendances npm Phase 2 :** `bcryptjs`, `@types/bcryptjs`
**Fichiers créés :** `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/admin/login/page.tsx`, `src/middleware.ts`, `src/hooks/useSession.ts`, `prisma/seed.ts`
**Dépendances phases suivantes :** Phase 6 dépend de cette phase

---

## Phase 3 : Moteur de Thèmes

**Objectif :** 5 thèmes visuels complets, switcher global, persistance DB, rendu SSR sans flash.

### 3.1 — CSS Variables des 5 thèmes
- **Complexité :** Complexe
- **Fichier :** `src/styles/themes.css`

```css
/* ============================================
   THÈME 1 : NEUMORPHISM / SOFT UI
   ============================================ */
[data-theme="NEUMORPHISM"] {
  --bg-primary: #E0E5EC;
  --bg-secondary: #D1D9E6;
  --bg-card: #E0E5EC;
  --bg-input: #E0E5EC;
  --text-primary: #2D3748;
  --text-secondary: #4A5568;
  --text-muted: #718096;
  --accent: #4F46E5;
  --accent-hover: #4338CA;
  --accent-light: rgba(79, 70, 229, 0.1);
  --border: #CBD5E0;
  --shadow-light: #FFFFFF;
  --shadow-dark: #A3B1C6;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  --shadow-neumorphic: 6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light);
  --shadow-neumorphic-inset: inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light);
  --font-primary: 'Inter', sans-serif;
  --transition: all 0.3s ease;
}

/* ============================================
   THÈME 2 : LUXURY / DARK GOLD
   ============================================ */
[data-theme="LUXURY"] {
  --bg-primary: #0B090A;
  --bg-secondary: #161314;
  --bg-card: #1A1718;
  --bg-input: #221F20;
  --text-primary: #F5F5F5;
  --text-secondary: #D4D4D4;
  --text-muted: #A3A3A3;
  --accent: #D4AF37;
  --accent-hover: #C5A028;
  --accent-light: rgba(212, 175, 55, 0.15);
  --border: #333030;
  --shadow-light: rgba(212, 175, 55, 0.05);
  --shadow-dark: rgba(0, 0, 0, 0.5);
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-full: 0px;
  --shadow-neumorphic: 0 0 20px rgba(212, 175, 55, 0.08);
  --font-primary: 'Playfair Display', serif;
  --transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* ============================================
   THÈME 3 : VIBRANT / STREETWEAR
   ============================================ */
[data-theme="VIBRANT"] {
  --bg-primary: #0F0F12;
  --bg-secondary: #1A1A1F;
  --bg-card: #1E1E24;
  --bg-input: #25252C;
  --text-primary: #FFFFFF;
  --text-secondary: #E0E0E0;
  --text-muted: #8F8F9A;
  --accent: #CCFF00;
  --accent-hover: #B8E600;
  --accent-light: rgba(204, 255, 0, 0.12);
  --border: #2E2E36;
  --shadow-light: rgba(204, 255, 0, 0.06);
  --shadow-dark: rgba(0, 0, 0, 0.6);
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 4px;
  --radius-xl: 8px;
  --radius-full: 4px;
  --shadow-neumorphic: 0 0 30px rgba(204, 255, 0, 0.08);
  --font-primary: 'Space Grotesk', sans-serif;
  --transition: all 0.2s ease;
}

/* ============================================
   THÈME 4 : ORGANIC / ARTISAN
   ============================================ */
[data-theme="ORGANIC"] {
  --bg-primary: #F7F5F0;
  --bg-secondary: #EEEADF;
  --bg-card: #F7F5F0;
  --bg-input: #FFFFFF;
  --text-primary: #3D3B30;
  --text-secondary: #5C5A4E;
  --text-muted: #8A8778;
  --accent: #6B8E23;
  --accent-hover: #5A7A1D;
  --accent-light: rgba(107, 142, 35, 0.1);
  --border: #D4D0C4;
  --shadow-light: #FFFFFF;
  --shadow-dark: #C8C4B8;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-full: 9999px;
  --shadow-neumorphic: 4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light);
  --font-primary: 'Lora', serif;
  --transition: all 0.3s ease;
}

/* ============================================
   THÈME 5 : TECH / HIGH-TECH
   ============================================ */
[data-theme="TECH"] {
  --bg-primary: #0A0E17;
  --bg-secondary: #111827;
  --bg-card: #151D2E;
  --bg-input: #1C2640;
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --text-muted: #64748B;
  --accent: #00E5FF;
  --accent-hover: #00CCE5;
  --accent-light: rgba(0, 229, 255, 0.1);
  --border: #1E293B;
  --shadow-light: rgba(0, 229, 255, 0.05);
  --shadow-dark: rgba(0, 0, 0, 0.7);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  --shadow-neumorphic: 0 0 25px rgba(0, 229, 255, 0.06);
  --font-primary: 'JetBrains Mono', monospace;
  --transition: all 0.25s ease;
}
```

### 3.2 — ThemeProvider (SSR-safe, pas de FOUC)
- **Complexité :** Complexe
- **Fichier :** `src/providers/ThemeProvider.tsx`
- **Étapes :**
  - [ ] Récupérer le thème depuis la DB (table `Setting`, clé `active_theme`) côté serveur
  - [ ] Injecter un `<script>` inline dans le `<head>` pour appliquer `data-theme` AVANT le rendu React
  - [ ] Le script lit le thème depuis un cookie OU un attribut data sur `<html>`
  - [ ] Context React pour le switch client-side
  - [ ] Fonction `setTheme(theme)` qui met à jour le cookie + DB + context
  - [ ] Aucun flash de thème par défaut (FOUC évité)

```typescript
// Logique anti-FOUC
// Dans layout.tsx, injecter dans <head> :
// <script dangerouslySetInnerHTML={{ __html: `
//   const theme = document.cookie.split(';').find(c => c.trim().startsWith('theme='))?.split('=')[1] || 'NEUMORPHISM';
//   document.documentElement.setAttribute('data-theme', theme);
// `}} />
```

### 3.3 — Composant ThemeSwitcher
- **Complexité :** Moyen
- **Fichier :** `src/components/ui/ThemeSwitcher.tsx`
- **Étapes :**
  - [ ] Afficher les 5 thèmes avec preview (couleur accent + BG)
  - [ ] Toggle ou dropdown selon le contexte (admin settings vs storefront)
  - [ ] Appeler l'API `/api/admin/settings` pour sauvegarder le thème global
  - [ ] Mettre à jour le cookie + data-theme attribute en temps réel
  - [ ] Animation de transition fluide

### 3.4 — Composants UI avec variables thème
- **Complexité :** Complexe
- **Étapes :**
  - [ ] Réécrire TOUS les composants UI (`Button`, `Input`, `Card`, etc.) en utilisant `var(--css-variable)`
  - [ ] Plus aucune couleur hardcodée dans les composants
  - [ ] Utiliser Tailwind avec des classes custom `@apply` liées aux variables
  - [ ] Tester chaque composant avec les 5 thèmes

### 3.5 — API Settings pour persistance thème
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Route `GET /api/admin/settings?category=theme` → retourne le thème actif
  - [ ] Route `PUT /api/admin/settings` → met à jour le thème (admin only)
  - [ ] Route publique `GET /api/theme` → retourne le thème actif (pour le storefront)

**Dépendances npm Phase 3 :** Aucune nouvelle
**Fichiers créés :** `src/styles/themes.css`, `src/providers/ThemeProvider.tsx`, `src/components/ui/ThemeSwitcher.tsx`, modification de tous les composants UI
**Dépendances phases suivantes :** Phase 6.3 et Phase 7 utilisent le moteur de thèmes

---

## Phase 4 : Internationalisation (i18n) Trilingue

**Objectif :** Support FR/AR/EN, RTL pour l'arabe, fonts arabe, routing i18n.

### 4.1 — Installation & Configuration next-intl
- **Complexité :** Complexe
- **Dépendances npm :** `next-intl`
- **Étapes :**
  - [ ] `npm install next-intl`
  - [ ] Créer `src/i18n/config.ts` avec les locales supportées
  - [ ] Créer `src/i18n/request.ts` pour le server-side
  - [ ] Configurer le middleware i18n dans `src/middleware.ts`

### 4.2 — Fichiers de traduction
- **Complexité :** Complexe
- **Fichiers :** `src/messages/fr.json`, `src/messages/ar.json`, `src/messages/en.json`
- **Structure recommandée :**

```json
{
  "common": {
    "home": "Accueil",
    "products": "Produits",
    "cart": "Panier",
    "checkout": "Commander",
    "currency": "DA",
    "currencySymbol": "د.ج",
    "loading": "Chargement...",
    "error": "Erreur",
    "success": "Succès"
  },
  "homepage": {
    "heroTitle": "Les meilleurs produits au meilleur prix",
    "heroSubtitle": "Cash on Delivery — Livraison 69 Wilayas",
    "viewProducts": "Voir les produits",
    "featuredProducts": "Produits en vedette",
    "newArrivals": "Nouveautés"
  },
  "product": {
    "addToCart": "Ajouter au panier",
    "buyNow": "Acheter maintenant",
    "selectVariant": "Sélectionner une variante",
    "reviews": "Avis clients",
    "benefits": "Avantages",
    "features": "Caractéristiques",
    "inStock": "En stock",
    "outOfStock": "Rupture de stock"
  },
  "checkout": {
    "fullName": "Nom complet",
    "phone": "Numéro de téléphone",
    "phonePlaceholder": "0XXXXXXXXX",
    "wilaya": "Wilaya",
    "commune": "Commune",
    "address": "Adresse complète",
    "deliveryMode": "Mode de livraison",
    "homeDelivery": "Livraison à domicile",
    "stopDesk": "Stop Desk",
    "orderSummary": "Résumé de la commande",
    "subtotal": "Sous-total",
    "deliveryFee": "Frais de livraison",
    "total": "Total",
    "placeOrder": "Confirmer la commande",
    "phoneValidation": "Le numéro doit commencer par 05, 06 ou 07 et contenir 10 chiffres"
  },
  "thankYou": {
    "title": "Merci pour votre commande !",
    "trackingId": "Votre numéro de suivi",
    "message": "Votre commande a été enregistrée. Un agent va vous contacter pour confirmer.",
    "reassurance": "Paiement Cash on Delivery — Inspection avant paiement"
  },
  "admin": {
    "dashboard": "Tableau de bord",
    "products": "Produits",
    "orders": "Commandes",
    "delivery": "Livraison",
    "pixels": "Pixels",
    "settings": "Paramètres",
    "users": "Utilisateurs"
  },
  "wilayas": {
    "01": "Adrar",
    "02": "Chlef",
    "...": "... (69 wilayas)"
  }
}
```

### 4.3 — Gestion RTL pour l'arabe
- **Complexité :** Complexe
- **Étapes :**
  - [ ] Détection automatique de la direction selon la locale (`fr`/`en` → LTR, `ar` → RTL)
  - [ ] Ajouter `dir="rtl"` sur `<html>` quand la locale est `ar`
  - [ ] Ajouter `dir="ltr"` sur `<html>` quand la locale est `fr` ou `en`
  - [ ] Utiliser des classes Tailwind RTL : `rtl:space-x-reverse`, `rtl:text-right`, etc.
  - [ ] Tester le miroir complet de l'interface en arabe
  - [ ] Flip des icônes directionnelles (flèches, chevrons)

### 4.4 — Fonts arabe
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Installer Google Fonts : `Noto Sans Arabic` (pour le body) + `Noto Kufi Arabic` (titres)
  - [ ] Configurer dans `next/font` dans le root layout
  - [ ] Appliquer la font arabe uniquement quand `locale === 'ar'`
  - [ ] Garder Inter/Playfair/Space Grotesk/Lora/JetBrains Mono pour les autres locales

### 4.5 — Language Switcher
- **Complexité :** Moyen
- **Fichier :** `src/components/ui/LanguageSwitcher.tsx`
- **Étapes :**
  - [ ] Dropdown avec 3 options : 🇫🇷 Français, 🇩🇿 العربية, 🇬🇧 English
  - [ ] Changement de locale via `next-intl` (mise à jour du cookie + URL)
  - [ ] Persistance de la langue选择 dans un cookie `NEXT_LOCALE`

### 4.6 — Routing i18n
- **Complexité :** Complexe
- **Étapes :**
  - [ ] Configurer le middleware pour analyser la locale depuis l'URL ou le cookie
  - [ ] Structure d'URL : `/fr/product/xxx`, `/ar/product/xxx`, `/en/product/xxx`
  - [ ] Redirect automatique vers la bonne locale
  - [ ] API routes non affectées par le routing i18n

**Dépendances npm Phase 4 :** `next-intl`, `@formatjs/intl-localematcher`
**Fichiers créés :** `src/i18n/config.ts`, `src/i18n/request.ts`, `src/messages/{fr,ar,en}.json`, `src/components/ui/LanguageSwitcher.tsx`
**Dépendances phases suivantes :** Toutes les phases UI dépendent de cette phase

---

## Phase 5 : Seed Data & Matrice Territoriale

**Objectif :** Peupler la DB avec les 69 Wilayas, 1541 Communes, et un admin par défaut.

### 5.1 — Script Seed Prisma
- **Complexité :** Complexe
- **Fichier :** `prisma/seed.ts`
- **Dépendances npm :** `tsx` (devDependency, pour exécuter le seed TS)
- **Étapes :**
  - [ ] Installer `tsx` : `npm install -D tsx`
  - [ ] Créer `prisma/seed.ts`
  - [ ] Seed : Admin user par défaut (email + password depuis .env)
  - [ ] Seed : Wilayas (69 entrées)
  - [ ] Seed : Communes (1541 entrées, liées aux Wilayas)
  - [ ] Seed : Settings par défaut (theme: NEUMORPHISM, etc.)
  - [ ] Seed : DeliveryMatrix avec tarifs par défaut (vide, à remplir par l'admin)
  - [ ] Upsert partout pour pouvoir relancer le seed sans erreurs

### 5.2 — Structure JSON des Wilayas & Communes
- **Complexité :** Complexe
- **Fichier :** `prisma/data/wilayas-communes.json`
- **Format :**

```json
[
  {
    "code": "01",
    "name": "Adrar",
    "nameAr": "أدرار",
    "communes": [
      {
        "code": "0101",
        "name": "Adrar",
        "nameAr": "أدرار"
      },
      {
        "code": "0102",
        "name": "Timimoun",
        "nameAr": "تيميمون"
      }
    ]
  },
  {
    "code": "02",
    "name": "Chlef",
    "nameAr": "الشلف",
    "communes": [
      {
        "code": "0201",
        "name": "Chlef",
        "nameAr": "الشلف"
      }
    ]
  }
]
```

> **Note :** Les données JSON exactes des 69 Wilayas et 1541 Communes selon la Loi n° 26-06 seront fournies ultérieurement. Le script seed est prêt à recevoir ce JSON.

### 5.3 — Configuration du seed dans prisma
- **Complexité :** Facile
- **Étape :** Ajouter dans `package.json` :

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 5.4 — Exécution du seed
- **Complexité :** Facile
- **Commandes :**
  - [ ] `npx prisma db seed` → seed initial
  - [ ] Vérifier que les 69 Wilayas + 1541 Communes sont en DB
  - [ ] Vérifier que l'admin est créé
  - [ ] Script `npm run db:seed` fonctionnel

### 5.5 — API Routes pour les Wilayas/Communes
- **Complexité :** Moyen
- **Étapes :**
  - [ ] `GET /api/wilayas` → retourne la liste des 69 Wilayas
  - [ ] `GET /api/communes?wilayaCode=01` → retourne les communes d'une wilaya
  - [ ] Cache des résultats (les données ne changent quasiment jamais)
  - [ ] Ces routes sont publiques (utilisées par le formulaire checkout)

**Dépendances npm Phase 5 :** `tsx`
**Fichiers créés :** `prisma/seed.ts`, `prisma/data/wilayas-communes.json`, `src/app/api/wilayas/route.ts`, `src/app/api/communes/route.ts`
**Dépendances phases suivantes :** Phase 8 dépend de cette phase (formulaire checkout utilise les Wilayas)

---

## Phase 6 : Admin Dashboard

**Objectif :** Dashboard admin complet avec CRUD produits, gestion commandes, thèmes, livraison, pixels, users.

### 6.1 — Layout & Navigation Admin
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Créer `src/app/admin/layout.tsx` avec sidebar + header
  - [ ] Sidebar responsive (hamburger sur mobile)
  - [ ] Navigation : Dashboard, Produits, Commandes, Livraison, Pixels, Paramètres, Utilisateurs
  - [ ] Header : nom de l'utilisateur, bouton déconnexion, lien storefront
  - [ ] Sélectionner la bonne couleur accent du thème actif
  - [ ] Vérifier l'authentification dans le layout (redirect si non auth)
  - [ ] Sous-layout admin login (pas de sidebar)

### 6.2 — CRUD Produits & Variants
- **Complexité :** Complexe
- **Dépendances :** Phase 1 (schéma DB), Phase 2 (auth), Phase 3 (thèmes)
- **Étapes :**
  - [ ] **Liste produits** (`/admin/products`) :
    - Table avec colonnes : Image, Nom, Prix, Catégorie, Statut, Actions
    - Recherche par nom
    - Filtre par catégorie, statut actif/inactif
    - Pagination (20 items/page)
    - Bouton "Nouveau produit"
    - Actions : Éditer, Supprimer (confirm modal)
  - [ ] **Formulaire création/édition produit** (`/admin/products/[id]`) :
    - Champs : Name, Slug (auto-généré), Description (textarea), Short Desc, Base Price (DZD), Category (select), SEO Title, SEO Description, SEO Keywords
    - Toggle Is Active, Is Featured
    - Section Variant Manager (voir ci-dessous)
    - Section Images Upload (voir Phase 12)
    - Validation Zod complète côté client et serveur
    - Bouton Sauvegarder / Annuler
  - [ ] **Variant Manager** (composant intégré) :
    - Liste des variants du produit
    - Bouton "Ajouter une variante"
    - Chaque variante : Name, SKU, Price (optionnel, override du base), Toggle Active/Inactive (❌ pas de compteur stock)
    - Drag & drop pour réordonner (sortOrder)
    - Bouton supprimer variante (confirm)
    - L'ordre d'affichage dans le storefront suit le sortOrder
  - [ ] **API Routes** :
    - `GET /api/products` → liste paginée avec filtres
    - `POST /api/products` → création
    - `GET /api/products/[id]` → détail
    - `PUT /api/products/[id]` → mise à jour
    - `DELETE /api/products/[id]` → suppression
    - `PUT /api/variants/[id]` → toggle active/inactive, mise à jour
    - `DELETE /api/variants/[id]` → suppression

### 6.3 — Theme Switcher Global (Admin Settings)
- **Complexité :** Moyen
- **Dépendances :** Phase 3 (moteur thèmes)
- **Étapes :**
  - [ ] Page `/admin/settings` avec section "Apparence"
  - [ ] Afficher les 5 thèmes avec preview visuel (miniature)
  - [ ] Bouton radio ou cards sélectionnables
  - [ ] Bouton "Appliquer le thème" → met à jour la DB + cookie + data-theme en temps réel
  - [ ] Option de preview live avant sauvegarde
  - [ ] Sauvegarde dans table `Setting` (clé: `active_theme`)

### 6.4 — Matrice de Livraison (69 Wilayas)
- **Complexité :** Complexe
- **Étapes :**
  - [ ] Page `/admin/delivery` avec tableau matrice
  - [ ] Colonnes : Code Wilaya, Nom Wilaya, Tarif Domicile (DA), Tarif Stop Desk (DA), Jours estimés, Statut
  - [ ] Édition inline (cliquer sur une cellule pour éditer)
  - [ ] Édition en masse : sélectionner plusieurs wilayas + modifier tarif
  - [ ] Filtre par wilaya (search)
  - [ ] Toggle actif/inactif par wilaya
  - [ ] Export CSV de la matrice
  - [ ] **API Routes** :
    - `GET /api/delivery/matrix` → retourne la matrice complète
    - `PUT /api/delivery/matrix` → met à jour la matrice (batch update)
    - `POST /api/delivery/calculate` → calcule le tarif pour une wilaya + mode donné

### 6.5 — Pipeline Commandes COD
- **Complexité :** Complexe
- **Dépendances :** Phase 1 (schéma Order), Phase 2 (auth)
- **Étapes :**
  - [ ] **Page `/admin/orders`** :
    - Vue pipeline Kanban ou tableau avec statuts
    - Colonnes : Tracking ID, Client, Téléphone, Wilaya, Total (DA), Statut, Date, Actions
    - Filtres : par statut, par wilaya, par date range, par recherche
    - Pagination
    - Nombre de commandes par statut en header (badges)
  - [ ] **Détail commande** (`/admin/orders/[id]`) :
    - Résumé complet : client info, items, prix, livraison
    - Historique des changements de statut (timeline)
    - Actions de changement de statut :
      - `PENDING → CONFIRMED` : Bouton "Confirmer" (⚠️ déclenche pixel Purchase event server-side)
      - `CONFIRMED → SHIPPED` : Bouton "Expédier" (optionnel : entrer numéro bordereau)
      - `SHIPPED → DELIVERED` : Bouton "Livrée"
      - `* → CANCELLED` : Bouton "Annuler" avec raison obligatoire
    - Fallback "Bordereau Non Généré" avec bouton Retry
    - Notes internes (texte libre)
  - [ ] **Pipeline Status Flow** :
    ```
    PENDING → CONFIRMED → SHIPPED → DELIVERED
       ↓          ↓          ↓
    CANCELLED  CANCELLED  CANCELLED
    ```
  - [ ] **Retry Logic** :
    - Commandes avec fallback `BORDEREAU_NON_GENERE`
    - Cron job ou bouton retry
    - Tentatives max : 3
    - Log de chaque tentative
  - [ ] **API Routes** :
    - `GET /api/orders` → liste paginée avec filtres
    - `GET /api/orders/[id]` → détail avec historique
    - `PATCH /api/orders/[id]` → mise à jour statut (déclenche pixel si CONFIRMED)
    - `POST /api/orders/[id]/cancel` → annulation avec raison
    - `POST /api/cron/retry-orders` → retry commandes en fallback

### 6.6 — Multi-Pixel Management
- **Complexité :** Complexe
- **Dépendances :** Phase 1 (schéma Pixel), Phase 11 (tracking server-side)
- **Étapes :**
  - [ ] **Page `/admin/pixels`** :
    - Liste des pixels configurés
    - Colonnes : Nom, Type (Meta/TikTok), Pixel ID, Statut (actif/inactif), Portée (Global/Produit), Actions
    - Bouton "Ajouter un pixel"
  - [ ] **Formulaire pixel** :
    - Champs : Name, Type (select: Meta/Tiktok), Pixel ID, Access Token (masked)
    - Toggle Is Active
    - Toggle Is Global (si actif → assigné à tous les produits)
    - Si non-global : sélecteur multi-produits pour assignation
  - [ ] **Chiffrement des tokens** :
    - Les access tokens sont chiffrés en AES-256 avant stockage en DB
    - Déscription : uniquement au moment de l'envoi server-side
  - [ ] **API Routes** :
    - `GET /api/pixels` → liste des pixels
    - `POST /api/pixels` → création (chiffrage token)
    - `GET /api/pixels/[id]` → détail
    - `PUT /api/pixels/[id]` → mise à jour
    - `DELETE /api/pixels/[id]` → suppression

### 6.7 — User Management (RBAC)
- **Complexité :** Moyen
- **Dépendances :** Phase 2 (auth, rôles)
- **Étapes :**
  - [ ] Page `/admin/settings/users` (accessible uniquement aux ADMIN)
  - [ ] Liste des utilisateurs avec : Nom, Email, Rôle, Statut, Date création, Actions
  - [ ] CRUD Utilisateurs :
    - Créer : Nom, Email, Password, Rôle (Admin/Call Agent)
    - Éditer : Nom, Email, Rôle, Reset password
    - Désactiver (au lieu de supprimer)
  - [ ] Un ADMIN ne peut pas se supprimer lui-même
  - [ ] Un CALL_AGENT ne peut pas accéder à cette page
  - [ ] API Routes : CRUD `/api/admin/users`

**Dépendances npm Phase 6 :** Aucune nouvelle
**Fichiers créés :** `src/app/admin/**` (toutes les pages admin), `src/components/admin/**`, `src/app/api/admin/**`
**Dépendances phases suivantes :** Phase 8 utilise l'API produits et delivery ; Phase 11 utilise les pixels

---

## Phase 7 : Storefront — Homepage

**Objectif :** Page d'accueil publique avec hero, grille produits, filtres, badges confiance.

### 7.1 — Layout Storefront
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Créer `src/app/(storefront)/layout.tsx`
  - [ ] Header : Logo, Navigation (Accueil, Catégories), Language Switcher, Panier
  - [ ] Footer : Liens utiles, Infos COD, 69 Wilayas, Contact
  - [ ] Responsive (mobile-first)

### 7.2 — Hero Banner
- **Complexité :** Moyen
- **Fichier :** `src/components/storefront/HeroBanner.tsx`
- **Étapes :**
  - [ ] Bannière pleine largeur avec image de fond (configurable via Settings)
  - [ ] Titre + Sous-titre dynamiques (i18n)
  - [ ] CTA "Voir les produits" → ancre vers la grille
  - [ ] Badges de confiance intégrés au hero :
    - 💵 Cash on Delivery
    - 🔍 Inspection avant paiement
    - 🚚 Livraison 69 Wilayas
  - [ ] Animations subtiles (fade-in, parallax optionnel)

### 7.3 — Trust Badges
- **Complexité :** Facile
- **Fichier :** `src/components/storefront/TrustBadges.tsx`
- **Étapes :**
  - [ ] Bandeau sous le hero avec 3-4 badges confiance
  - [ ] Icons Lucide : `Banknote`, `Search`, `Truck`, `Shield`
  - [ ] Texte i18n pour chaque badge

### 7.4 — Grille Produits avec Filtres
- **Complexité :** Complexe
- **Étapes :**
  - [ ] **Composant ProductGrid** :
    - Grille responsive : 1 col mobile, 2 col tablet, 3-4 col desktop
    - Chargement des produits via Server Component + `prisma.product.findMany()`
    - Filtrage par catégorie (onglets ou sidebar)
    - Tri : Prix croissant, Décroissant, Nouveautés
    - Pagination ou infinite scroll
  - [ ] **Composant ProductCard** :
    - Image (première image du produit)
    - Nom du produit
    - Prix en DZD (format : "2 500 DA")
    - Badge catégorie
    - Lien vers `/product/[slug]`
    - Hover effect selon le thème
  - [ ] **Filtres** :
    - Catégories : onglets horizontaux au-dessus de la grille
    - Prix : slider ou inputs min/max
    - Statut : en stock uniquement (variants actifs)
  - [ ] **API ou Server Component** :
    - Récupérer les produits depuis la DB
    - Filtrer par catégorie, disponibilité (au moins 1 variant actif)
    - Inclure la première image, le prix minimum des variants

### 7.5 — Page Homepage
- **Complexité :** Moyen
- **Fichier :** `src/app/(storefront)/page.tsx`
- **Étapes :**
  - [ ] Server Component qui compose tout
  - [ ] Hero → Trust Badges → Grille Produits
  - [ ] Meta tags SEO (title, description, og:image)
  - [ ] JSON-LD pour le SEO (Organization, WebSite)

**Dépendances npm Phase 7 :** `lucide-react` (déjà dans stack)
**Fichiers créés :** `src/app/(storefront)/layout.tsx`, `src/components/storefront/{HeroBanner,ProductGrid,ProductCard,TrustBadges}.tsx`
**Dépendances phases suivantes :** Phase 8 étend le storefront

---

## Phase 8 : Landing Page Produit COD

**Objectif :** Page produit immersive avec carousel, vidéo, sections copy, et formulaire checkout express in-page.

### 8.1 — Carousel Images
- **Complexité :** Moyen
- **Fichier :** `src/components/storefront/ImageCarousel.tsx`
- **Étapes :**
  - [ ] Carousel swipable (touch-friendly mobile)
  - [ ] Thumbnail navigation en bas
  - [ ] Zoom on hover/click
  - [ ] Lazy loading des images
  - [ ] Support variant-specific images (changer image quand variante sélectionnée)

### 8.2 — Section Vidéo Démo
- **Complexité :** Moyen
- **Fichier :** `src/components/storefront/VideoDemo.tsx`
- **Étapes :**
  - [ ] Lecteur vidéo HTML5 responsive
  - [ ] URL vidéo configurable par produit (champ dans le formulaire admin)
  - [ ] Autoplay muted en boucle (optionnel)
  - [ ] Fallback image si pas de vidéo

### 8.3 — Sections Copy (Benefits / Features / Reviews)
- **Complexité :** Moyen
- **Fichiers :** `BenefitsSection.tsx`, `FeaturesSection.tsx`, `ReviewsSection.tsx`
- **Étapes :**
  - [ ] **BenefitsSection** : 3-6 icônes + titre + description (bénéfices produit, stockés en JSON dans le produit)
  - [ ] **FeaturesSection** : Liste des caractéristiques techniques du produit
  - [ ] **ReviewsSection** :
    - Liste des avis clients (approuvés uniquement)
    - Rating étoiles
    - Photo du client (optionnel)
    - Moyenne des notes
    - Formulaire d'ajout d'avis (nom, note, commentaire, photo)

### 8.4 — Formulaire Checkout Express In-Page
- **Complexité :** Complexe
- **Dépendances :** Phase 1 (schéma Order), Phase 5 (Wilayas/Communes)
- **Fichier :** `src/components/storefront/CheckoutForm.tsx`
- **Étapes :**
  - [ ] **Formulaire unique tout-en-un** (pas de page séparée) :
    - Sélecteur de variante (buttons, pas de dropdown si < 5 options)
    - Input Nom complet (obligatoire)
    - Input Téléphone avec validation regex `^0(5|6|7)[0-9]{8}$` :
      - Commence par 0
      - Deuxième chiffre : 5, 6 ou 7
      - 10 chiffres au total
      - Afficher un message d'erreur clair en i18n
    - **Cascade Wilaya → Commune** :
      - Dropdown Wilaya (69 options, avec recherche)
      - Dropdown Commune (se remplit dynamiquement selon la wilaya sélectionnée)
      - Utiliser le hook `useWilaya` qui appelle `GET /api/communes?wilayaCode=XX`
    - Input Adresse complète (texte libre)
    - Toggle Domicile vs Stop Desk (deux cards cliquables)
    - **Pricing Dynamique Live** :
      - Afficher le prix du produit (variant sélectionné)
      - Afficher les frais de livraison (calculés via `POST /api/delivery/calculate`)
      - Afficher le total en temps réel
      - Les frais changent quand on change la wilaya ou le mode
    - Bouton "Confirmer la commande"
  - [ ] **Capture côté serveur au submit** :
    - IP du client (headers `x-forwarded-for` ou `x-real-ip`)
    - User-Agent (header `user-agent`)
  - [ ] **Validation complète** :
    - Tous les champs obligatoires
    - Validation Zod côté client ET serveur (API route)
    - Retour d'erreurs clairs
  - [ ] **API Route** : `POST /api/orders` :
    - Valider le payload avec Zod
    - Créer l'order avec statut `PENDING`
    - Créer les `OrderItem` avec snapshot du prix
    - Retourner `trackingId` + données commande

### 8.5 — Page Produit
- **Complexité :** Moyen
- **Fichier :** `src/app/(storefront)/product/[slug]/page.tsx`
- **Étapes :**
  - [ ] Server Component : fetch produit par slug
  - [ ] Compose : ImageCarousel → VideoDemo → Info Produit → Benefits → Features → CheckoutForm → Reviews
  - [ ] SEO : Dynamic metadata (title, description, og:image, og:title)
  - [ ] JSON-LD : Product schema
  - [ ] 404 si produit non trouvé ou inactif
  - [ ] Redirection si produit n'a aucun variant actif

### 8.6 — Hooks & API Checkout
- **Complexité :** Complexe
- **Étapes :**
  - [ ] Hook `useWilaya` : charge les wilayas + gère la cascade commune
  - [ ] Hook `useDelivery` : calcule les frais en temps réel
  - [ ] Hook `useCheckout` : gère la soumission du formulaire, loading, erreurs
  - [ ] Store Zustand `checkoutStore` : état du formulaire persisté

**Dépendances npm Phase 8 :** Aucune nouvelle
**Fichiers créés :** `src/app/(storefront)/product/[slug]/page.tsx`, `src/components/storefront/{ImageCarousel,VideoDemo,BenefitsSection,FeaturesSection,ReviewsSection,CheckoutForm,WilayaSelect,CommuneSelect,DeliveryModeToggle,OrderSummary}.tsx`, `src/hooks/{useWilaya,useDelivery}.ts`, `src/stores/checkoutStore.ts`
**Dépendances phases suivantes :** Phase 9 dépend de cette phase (after checkout redirect)

---

## Phase 9 : Page Thank You

**Objectif :** Page de confirmation après commande avec réassurance.

### 9.1 — Page Thank You
- **Complexité :** Facile
- **Fichier :** `src/app/(storefront)/thank-you/page.tsx`
- **Étapes :**
  - [ ] Récupérer `trackingId` depuis les search params (`?tracking=DZ-xxx`)
  - [ ] Afficher :
    - Message de remerciement (i18n)
    - Numéro de suivi (trackingId) en grand
    - Résumé de la commande (items, total, adresse)
    - Message réassurance : "Paiement Cash on Delivery", "Inspectez avant de payer", "Un agent vous contactera"
    - Timeline estimée de traitement
  - [ ] Partage : bouton WhatsApp pour partager le tracking ID
  - [ ] Retour à l'accueil : bouton
  - [ ] Meta tags SEO (noindex pour éviter l'indexation)
  - [ ] Si trackingId invalide ou manquant → redirect vers homepage

**Dépendances npm Phase 9 :** Aucune
**Fichiers créés :** `src/app/(storefront)/thank-you/page.tsx`
**Dépendances phases suivantes :** Aucune (page indépendante)

---

## Phase 10 : Intégration Logistique Multi-Provider

**Objectif :** Abstraction layer pour les providers de livraison, avec fallback retry.

### 10.1 — Interface Commune Provider
- **Complexité :** Complexe
- **Fichier :** `src/lib/logistics/types.ts`

```typescript
export interface LogisticProvider {
  name: string;
  createShipment(order: OrderData): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingResult>;
  cancelShipment(trackingNumber: string): Promise<boolean>;
}

export interface OrderData {
  orderId: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  wilayaCode: string;
  communeCode: string;
  address: string;
  deliveryMode: "HOME" | "STOP_DESK";
  totalAmount: number;
  codAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface ShipmentResult {
  success: boolean;
  providerTrackingId?: string;
  bordereauNumber?: string;
  error?: string;
}

export interface TrackingResult {
  status: string;
  location?: string;
  timestamp: Date;
}
```

### 10.2 — Provider Ecotrack (exemple)
- **Complexité :** Complexe
- **Fichier :** `src/lib/logistics/providers/ecotrack.ts`
- **Étapes :**
  - [ ] Implémenter l'interface `LogisticProvider`
  - [ ] Créer shipment via API Ecotrack
  - [ ] Parser la réponse
  - [ ] Gestion des erreurs (API down, réponse invalide)
  - [ ] Logging des requêtes

### 10.3 — Factory & Abstraction Layer
- **Complexité :** Moyen
- **Fichier :** `src/lib/logistics/index.ts`
- **Étapes :**
  - [ ] Fonction `getProvider(name: string): LogisticProvider`
  - [ ] Configuration des providers via table `Setting` (clé: `active_logistics_provider`)
  - [ ] Fallback automatique : si le provider principal échoue, logger le fallback
  - [ ] Retry logic : max 3 tentatives avec backoff exponentiel

### 10.4 — Intégration avec Pipeline Commandes
- **Complexité :** Complexe
- **Étapes :**
  - [ ] Quand un agent passe une commande à `CONFIRMED` → appeler `createShipment`
  - [ ] Si succès → mettre à jour la commande avec `providerTrackingId`
  - [ ] Si échec → définir fallback `BORDEREAU_NON_GENERE`, logger l'erreur
  - [ ] Le retry cron (Phase 6.5) réessaie pour les commandes en fallback

**Dépendances npm Phase 10 :** `axios` (pour les API externes)
**Fichiers créés :** `src/lib/logistics/{types,index}.ts`, `src/lib/logistics/providers/ecotrack.ts`
**Dépendances phases suivantes :** Phase 6.5 utilise l'abstraction logistique

---

## Phase 11 : Tracking Multi-Pixels (Server-Side)

**Objectif :** Envoi d'événements Meta CAPI + TikTok Events API côté serveur, chiffrage des tokens.

### 11.1 — Module d'Encryption
- **Complexité :** Moyen
- **Fichier :** `src/lib/encryption.ts`
- **Étapes :**
  - [ ] Chiffrer avec AES-256-CBC : `encrypt(plainText) → cipherText`
  - [ ] Déchiffrer : `decrypt(cipherText) → plainText`
  - [ ] Utiliser la clé `ENCRYPTION_KEY` depuis `.env`
  - [ ] IV aléatoire pour chaque opération

### 11.2 — Module de Hashing SHA-256
- **Complexité :** Facile
- **Fichier :** `src/lib/hash.ts`
- **Étapes :**
  - [ ] Fonction `hashPhone(phone: string): string` → SHA-256 du numéro
  - [ ] Utiliser `crypto` natif de Node.js (pas besoin de `crypto-js`)
  - [ ] Normaliser le numéro avant hash (supprimer espaces, espaces insécables)

### 11.3 — Meta CAPI Integration
- **Complexité :** Complexe
- **Fichier :** `src/lib/pixels/meta.ts`
- **Étapes :**
  - [ ] Envoi d'événements à l'API Meta Conversions (CAPI)
  - [ ] Événements supportés :
    - `PageView` : appelé côté client (embed script)
    - `ViewContent` : appelé côté client quand on visite une page produit
    - `InitiateCheckout` : appelé côté client quand on commence le checkout
    - `Purchase` : appelé CÔTÉ SERVEUR quand la commande passe à CONFIRMED
  - [ ] Payload `Purchase` :
    ```json
    {
      "event_name": "Purchase",
      "event_time": "timestamp",
      "user_data": {
        "em": ["sha256_hashed_email_ou_phone"],
        "ph": ["sha256_hashed_phone"],
        "client_ip_address": "192.168.1.1",
        "client_user_agent": "Mozilla/5.0..."
      },
      "custom_data": {
        "currency": "DZD",
        "value": 2500,
        "content_ids": ["variant_id_1", "variant_id_2"],
        "content_type": "product",
        "num_items": 2
      }
    }
    ```
  - [ ] Utiliser le pixel ID + access token (déchiffré depuis DB)
  - [ ] Gestion des erreurs (token invalide, réseau)

### 11.4 — TikTok Events API Integration
- **Complexité :** Complexe
- **Fichier :** `src/lib/pixels/tiktok.ts`
- **Étapes :**
  - [ ] Même structure que Meta mais adaptée à TikTok Events API
  - [ ] Événements : `ViewContent`, `InitiateCheckout`, `CompletePayment` (= Purchase)
  - [ ] Endpoint : `https://business-api.tiktok.com/open_api/v1.3/event/track/`
  - [ ] Payload similaire avec `ph`, `ip`, `user_agent`

### 11.5 — Pixel Manager (orchestrateur)
- **Complexité :** Complexe
- **Fichier :** `src/lib/pixels/index.ts`
- **Étapes :**
  - [ ] Fonction `trackEvent(eventName, data, context)` qui :
    - Récupère les pixels actifs depuis la DB (global + assignés au produit)
    - Pour chaque pixel actif : appelle le bon provider (Meta ou TikTok)
    - En cas d'erreur : log mais ne bloque pas
  - [ ] Fonction `getActivePixels(productId?)` → retourne les pixels à déclencher
  - [ ] Intégration avec le pipeline : quand `CONFIRMED` → appeler `trackEvent("Purchase", ...)`

### 11.6 — Client-side Pixel Embed
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Composant `<PixelScript />` qui injecte les scripts Meta/TikTok dans le `<head>`
  - [ ] Seulement pour les pixels actifs et globaux
  - [ ] Script Meta : `fbq('init', pixelId); fbq('track', 'PageView');`
  - [ ] Script TikTok : `!function(w,d,t){...}(window,document,tiktokPixel);`
  - [ ] Événements `ViewContent` et `InitiateCheckout` déclenchés côté client via `usePixel` hook

**Dépendances npm Phase 11 :** `axios`
**Fichiers créés :** `src/lib/encryption.ts`, `src/lib/hash.ts`, `src/lib/pixels/{meta,tiktok,index}.ts`, `src/hooks/usePixel.ts`
**Dépendances phases suivantes :** Phase 6.6 configure les pixels ; Phase 8 utilise usePixel

---

## Phase 12 : Stockage Médias & Upload

**Objectif :** Upload d'images, stockage local VPS, compression, service Nginx.

### 12.1 — Route API Upload
- **Complexité :** Moyen
- **Fichier :** `src/app/api/upload/route.ts`
- **Dépendances npm :** `formidable` (déjà dans stack), `@types/formidable`
- **Étapes :**
  - [ ] Accepter les uploads via `formidable`
  - [ ] Valider le type MIME (jpg, png, webp, gif, mp4)
  - [ ] Valider la taille max (5 MB par défaut, configurable)
  - [ ] Générer un nom unique : `{timestamp}-{random}.{ext}`
  - [ ] Déplacer vers `public/uploads/products/` (ou sous-dossier par produit)
  - [ ] Retourner l'URL relative : `/uploads/products/xxx.webp`
  - [ ] Auth requise (admin uniquement)
  - [ ] Limiter à 1 upload à la fois

### 12.2 — Compression d'Images
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Utiliser `sharp` pour compresser les images uploadées
  - [ ] Convertir en WebP si pas déjà WebP
  - [ ] Redimensionner max 2000px de largeur
  - [ ] Qualité 80% pour un bon ratio taille/qualité
  - [ ] Créer un thumbnail 400px pour les cards produits

### 12.3 — Configuration Nginx pour Static Assets
- **Complexité :** Facile
- **Étapes :**
  - [ ] Servir `/uploads/` via Nginx (pas via Next.js)
  - [ ] Cache headers : `Cache-Control: public, max-age=31536000, immutable`
  - [ ] Compression gzip/br pour les images

### 12.4 — Composant Upload dans Admin
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Drag & drop zone pour upload
  - [ ] Preview des images sélectionnées
  - [ ] Upload multiple (jusqu'à 10 images par produit)
  - [ ] Réordonner les images (drag & drop)
  - [ ] Supprimer une image
  - [ ] Définir l'image principale

**Dépendances npm Phase 12 :** `sharp`, `formidable` (déjà dans stack)
**Fichiers créés :** `src/app/api/upload/route.ts`, composant d'upload dans admin
**Dépendances phases suivantes :** Phase 6.2 utilise l'upload pour les produits

---

## Phase 13 : Docker & Déploiement VPS

**Objectif :** Conteneuriser l'application, configurer Nginx reverse proxy, SSL Let's Encrypt.

### 13.1 — Dockerfile
- **Complexité :** Complexe
- **Fichier :** `Dockerfile`

```dockerfile
# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copier les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 13.2 — Configuration Next.js pour Docker
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Ajouter `output: "standalone"` dans `next.config.ts`
  - [ ] Configurer `images.unoptimized: true` (si images via Nginx)
  - [ ] Créer `.dockerignore` (node_modules, .git, .env, etc.)

### 13.3 — docker-compose.yml
- **Complexité :** Complexe
- **Fichier :** `docker-compose.yml`

```yaml
version: "3.8"

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads_data:/app/public/uploads
    networks:
      - ecom-network

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ecom_dz
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - ecom-network

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - uploads_data:/uploads:ro
    depends_on:
      - app
    networks:
      - ecom-network

volumes:
  postgres_data:
  uploads_data:

networks:
  ecom-network:
    driver: bridge
```

### 13.4 — Configuration Nginx Reverse Proxy
- **Complexité :** Complexe
- **Fichier :** `nginx/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Upstream Next.js
    upstream nextjs {
        server app:3000;
    }

    server {
        listen 80;
        server_name ${DOMAIN};

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${DOMAIN};

        # SSL (Let's Encrypt)
        ssl_certificate     /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;

        # Static uploads (bypass Next.js)
        location /uploads/ {
            alias /uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Everything else → Next.js
        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### 13.5 — SSL Let's Encrypt
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Installer certbot sur le VPS
  - [ ] `certbot certonly --nginx -d ${DOMAIN}`
  - [ ] Mount les certificats dans le conteneur Nginx
  - [ ] Cron de renouvellement : `certbot renew --quiet`
  - [ ] Redémarrer Nginx après renouvellement

### 13.6 — Scripts de Déploiement
- **Complexité :** Moyen
- **Fichier :** `scripts/deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement E-Commerce DZ..."

# Pull dernière version
git pull origin main

# Build et démarrer
docker compose down
docker compose build --no-cache
docker compose up -d

# Migrations
docker compose exec app npx prisma migrate deploy

# Seed (si première fois)
# docker compose exec app npx prisma db seed

echo "✅ Déploiement terminé !"
```

### 13.7 — Backup Scripts
- **Complexité :** Moyen
- **Fichier :** `scripts/backup.sh`
- **Étapes :**
  - [ ] Dump PostgreSQL : `pg_dump` vers fichier horodaté
  - [ ] Copier les uploads
  - [ ] Rotation des backups (garder 7 derniers jours)
  - [ ] Cron quotidien

**Dépendances npm Phase 13 :** Aucune (outils système)
**Fichiers créés :** `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `nginx/nginx.conf`, `scripts/{deploy,backup}.sh`
**Dépendances phases suivantes :** Toutes les phases finales

---

## Phase 14 : Tests

**Objectif :** Couverture de tests unitaires, intégration, et E2E.

### 14.1 — Configuration Vitest
- **Complexité :** Moyen
- **Dépendances npm :** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- **Étapes :**
  - [ ] Créer `vitest.config.ts`
  - [ ] Configurer les aliases (`@/`)
  - [ ] Setup file : `tests/setup.ts`

### 14.2 — Tests Unitaires
- **Complexité :** Moyen
- **Étapes :**
  - [ ] `tests/unit/validators.test.ts` : tester les schémas Zod (phone regex, email, etc.)
  - [ ] `tests/unit/encryption.test.ts` : chiffrer/déchiffrer
  - [ ] `tests/unit/hash.test.ts` : SHA-256 hashing
  - [ ] `tests/unit/utils.test.ts` : helpers généraux

### 14.3 — Tests d'Intégration
- **Complexité :** Complexe
- **Étapes :**
  - [ ] `tests/integration/api/products.test.ts` : CRUD produits
  - [ ] `tests/integration/api/orders.test.ts` : création + statut update
  - [ ] `tests/integration/api/auth.test.ts` : login/logout
  - [ ] `tests/integration/api/delivery.test.ts` : calcul tarif
  - [ ] Utiliser une DB de test (SQLite ou PostgreSQL de test)
  - [ ] Mock Prisma avec `vitest` pour les tests isolés

### 14.4 — Tests E2E avec Playwright
- **Complexité :** Complexe
- **Dépendances npm :** `@playwright/test`
- **Étapes :**
  - [ ] `tests/e2e/homepage.spec.ts` : chargement homepage, affichage produits
  - [ ] `tests/e2e/product-page.spec.ts` : navigation vers produit, sélection variante
  - [ ] `tests/e2e/checkout.spec.ts` : remplir formulaire, soumettre, voir thank-you
  - [ ] `tests/e2e/admin-login.spec.ts` : login admin, accès dashboard
  - [ ] `tests/e2e/admin-products.spec.ts` : CRUD produits
  - [ ] `tests/e2e/admin-orders.spec.ts` : pipeline commandes
  - [ ] Configurer `playwright.config.ts` (baseURL, headless, etc.)

### 14.5 — CI Pipeline (optionnel mais recommandé)
- **Complexité :** Moyen
- **Fichier :** `.github/workflows/ci.yml`
- **Étapes :**
  - [ ] Lint → TypeCheck → Unit Tests → Integration Tests → Build → E2E Tests
  - [ ] Parallelisation des jobs indépendants

**Dépendances npm Phase 14 :** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`
**Fichiers créés :** `vitest.config.ts`, `tests/setup.ts`, `tests/unit/**`, `tests/integration/**`, `tests/e2e/**`, `playwright.config.ts`, `.github/workflows/ci.yml`
**Dépendances phases suivantes :** Phase 15 optimise avant mise en prod

---

## Phase 15 : Optimisations & Mise en Production

**Objectif :** Performance, SEO, security hardening, monitoring.

### 15.1 — Performance
- **Complexité :** Complexe
- **Étapes :**
  - [ ] Analyser le bundle avec `@next/bundle-analyzer`
  - [ ] Lazy loading des composants lourds (`dynamic` import)
  - [ ] Image optimization (Sharp, responsive images, srcset)
  - [ ] Cache des requêtes fréquentes (Wilayas, Produits populaires)
  - [ ] Compression Brotli via Nginx
  - [ ] Minification CSS/JS (Next.js le fait en prod)
  - [ ] Core Web Vitals : LCP < 2.5s, FID < 100ms, CLS < 0.1

### 15.2 — SEO
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Metadata dynamique pour chaque page (`generateMetadata`)
  - [ ] Sitemap.xml dynamique (produits, catégories)
  - [ ] Robots.txt
  - [ ] JSON-LD structs (Product, Organization, WebSite, BreadcrumbList)
  - [ ] Open Graph images dynamiques (optionnel)
  - [ ] Canonical URLs
  - [ ] `noindex` sur les pages admin et thank-you
  - [ ] Meta description unique par produit

### 15.3 — Security Hardening
- **Complexité :** Moyen
- **Étapes :**
  - [ ] CSP (Content Security Policy) headers dans Nginx
  - [ ] Rate limiting sur les routes sensibles (login, checkout)
  - [ ] SQL injection protection (Prisma gère ça nativement)
  - [ ] XSS protection (React échappe par défaut, CSP en backup)
  - [ ] CSRF tokens pour les formulaires admin
  - [ ] Brute-force protection sur le login (max 5 tentatives / 15 min)
  - [ ] Audit des dépendances : `npm audit`
  - [ ] Secrets jamais en dur (tout dans `.env`)

### 15.4 — Monitoring & Logging
- **Complexité :** Moyen
- **Étapes :**
  - [ ] Structured logging avec `pino` (optionnel) ou console avec format JSON
  - [ ] Logs des erreurs API
  - [ ] Logs des pixel sends (succès/échec)
  - [ ] Logs des commandes (création, changement de statut)
  - [ ] Health check endpoint : `GET /api/health` → `{ status: "ok", db: "connected" }`

### 15.5 — Documentation Finale
- **Complexité :** Facile
- **Étapes :**
  - [ ] Mettre à jour `README.md` avec instructions complètes
  - [ ] Documenter les endpoints API
  - [ ] Documenter les variables d'environnement
  - [ ] Guide de déploiement
  - [ ] Guide de contribution

### 15.6 — Checklists Pré-production
- **Complexité :** Facile
- **Étapes :**
  - [ ] Tous les tests passent (unit + integration + E2E)
  - [ ] Build de production成功 (`npm run build`)
  - [ ] Docker build成功
  - [ ] SSL actif et fonctionnel
  - [ ] Seed des 69 Wilayas + 1541 Communes en DB prod
  - [ ] Admin par défaut configuré
  - [ ] Thème par défaut configuré
  - [ ] Delivery matrix initialisée
  - [ ] Pixels configurés (Meta + TikTok)
  - [ ] Backup automatique configuré
  - [ ] Monitoring en place

**Dépendances npm Phase 15 :** `pino` (optionnel), `@next/bundle-analyzer` (dev)
**Fichiers créés :** Configurations diverses, `README.md`, docs
**Dépendances phases suivantes :** — (phase finale)

---

## Matrice de Priorité

| Phase | Tâche | Priorité | Complexité | Dépendances | Estimation |
|-------|-------|----------|------------|-------------|------------|
| **0** | Setup Next.js + structure | **P0** | Facile | — | 1 jour |
| **0** | Config ESLint/Prettier/Husky | **P1** | Facile | 0.1 | 0.5 jour |
| **0** | .env.example | **P1** | Facile | 0.1 | 0.5 jour |
| **1** | Schéma Prisma complet | **P0** | Complexe | 0.1 | 2 jours |
| **1** | Migration initiale | **P0** | Facile | 1.1 | 0.5 jour |
| **2** | NextAuth v5 + Credentials | **P0** | Complexe | 1 | 2 jours |
| **2** | Middleware protection RBAC | **P0** | Complexe | 2.1-2.5 | 1 jour |
| **2** | Login page admin | **P0** | Moyen | 2.1 | 1 jour |
| **2** | Seed admin user | **P1** | Moyen | 2.1 | 0.5 jour |
| **3** | CSS variables 5 thèmes | **P0** | Complexe | 0.1 | 2 jours |
| **3** | ThemeProvider (anti-FOUC) | **P0** | Complexe | 3.1 | 1.5 jours |
| **3** | Composants UI refactor | **P0** | Complexe | 3.1-3.2 | 3 jours |
| **4** | Configuration next-intl | **P0** | Complexe | 0.1 | 1 jour |
| **4** | Fichiers traduction FR/AR/EN | **P0** | Complexe | 4.1 | 2 jours |
| **4** | RTL + Fonts arabe | **P0** | Complexe | 4.2 | 1.5 jours |
| **4** | Language Switcher | **P1** | Moyen | 4.1 | 0.5 jour |
| **5** | Script seed Prisma | **P0** | Complexe | 1 | 2 jours |
| **5** | JSON Wilayas/Communes | **P0** | Complexe | 1 | 2 jours |
| **5** | API Wilayas/Communes | **P1** | Moyen | 5.2 | 0.5 jour |
| **6.1** | Layout Admin | **P0** | Moyen | 2, 3 | 1 jour |
| **6.2** | CRUD Produits & Variants | **P0** | Complexe | 1, 2, 3 | 5 jours |
| **6.3** | Theme Switcher Admin | **P1** | Moyen | 3, 6.1 | 1 jour |
| **6.4** | Matrice Livraison 69 Wilayas | **P0** | Complexe | 1, 2, 5 | 3 jours |
| **6.5** | Pipeline Commandes COD | **P0** | Complexe | 1, 2 | 4 jours |
| **6.6** | Multi-Pixel Management | **P1** | Complexe | 1, 2, 11 | 3 jours |
| **6.7** | User Management RBAC | **P1** | Moyen | 2 | 1 jour |
| **7** | Homepage (Hero + Grid + Filtres) | **P0** | Complexe | 1, 3, 4 | 3 jours |
| **8** | Landing Page Produit COD | **P0** | Complexe | 1, 3, 4, 5 | 5 jours |
| **8** | Formulaire Checkout Express | **P0** | Complexe | 5, 8 | 4 jours |
| **9** | Page Thank You | **P1** | Facile | 8 | 0.5 jour |
| **10** | Logistique Multi-Provider | **P1** | Complexe | 1 | 3 jours |
| **11** | Tracking Server-Side Pixels | **P1** | Complexe | 1, 6.6 | 4 jours |
| **12** | Stockage Médias Upload | **P0** | Moyen | 6.2 | 2 jours |
| **13** | Docker + Docker Compose | **P0** | Complexe | 0 | 2 jours |
| **13** | Nginx Reverse Proxy + SSL | **P0** | Complexe | 13.1 | 2 jours |
| **13** | Scripts Deploy + Backup | **P1** | Moyen | 13.1-13.5 | 1 jour |
| **14** | Tests unitaires | **P1** | Moyen | 1, 2, 3 | 2 jours |
| **14** | Tests intégration | **P1** | Complexe | 14.1 | 3 jours |
| **14** | Tests E2E Playwright | **P2** | Complexe | 14.1 | 3 jours |
| **15** | Performance optimization | **P1** | Complexe | — | 2 jours |
| **15** | SEO | **P1** | Moyen | — | 1 jour |
| **15** | Security hardening | **P0** | Moyen | — | 1 jour |
| **15** | Monitoring & Logging | **P2** | Moyen | — | 1 jour |
| **15** | Documentation finale | **P2** | Facile | — | 1 jour |

### Résumé des Priorités

| Priorité | Nombre de tâches | Description |
|----------|------------------|-------------|
| **P0** | 18 | Bloquantes — doivent être faites en premier |
| **P1** | 16 | Important — à faire après les P0 |
| **P2** | 4 | Souhaitable — peut être fait en dernier |

### Estimation Totale

| Métrique | Valeur |
|----------|--------|
| **Nombre de phases** | 16 (Phase 0 à 15) |
| **Nombre de sous-tâches** | 108 |
| **Estimation totale** | ~85-100 jours (1 développeur full-time) |
| **Ordre recommandé** | P0 → P1 → P2 (respecter les dépendances) |

### Chemin Critique

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6.1 → Phase 7 → Phase 8 → Phase 9
                                    ↓
                              Phase 12 → Phase 6.2
                                    ↓
                              Phase 10 → Phase 6.5
                                    ↓
                              Phase 11 → Phase 6.6
```

---

> **Ce document est la référence unique pour le développement. Toute modification doit être mise à jour ici.**
> **Dernière révision : 2026-08-25**
