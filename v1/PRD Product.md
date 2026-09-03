# PRD_FINAL_V3.md — Product Requirements Document (Production Ready)

## 1. Executive Summary & Core Premises

* **Project Name:** E-Commerce Multi-Theme COD Template (Next.js / DZ Market)
* **Target Audience:** Algerian e-commerce store owners and media buyers using Cash on Delivery (COD).
* **Deployment Model:** **Single-Tenant per client/store instance**. No multi-tenancy overhead, no `tenant_id` partitioning, no data isolation complexity.
* **Primary Core Proposition:** High-converting single-product COD landing pages, integrated 69 Wilayas / 1,541 Communes checkout with dual shipping modes (Home vs Stop Desk), multi-provider logistics integration via unified aggregator APIs (e.g., Ecotrack), itemized pixel tracking per product (Client-Side + Meta CAPI / TikTok Events API), and a global **5-Theme System** switchable via Admin Dashboard with SSR state persistence.

---

## 2. Global 5-Theme Engine Architecture

The site operates on a **Single Active Theme** applied globally across all storefront pages and landing pages. Switching themes from the Admin Dashboard updates the persistent server state (DB `settings` table) to prevent FOUC (Flash of Unstyled Content) during SSR.

Themes inject root CSS variables via the `data-theme` attribute on the `<html>` element.

| Theme Name | Aesthetics & Identity | Target Niches | Color Palette & Tokens | Geometry & Borders |
| :--- | :--- | :--- | :--- | :--- |
| **1. Neumorphism / Soft UI** | Soft 3D extrusions, tactile reliefs, dual soft drop-shadows | Electronics, gadgets, modern software/hardware | BG: `#E0E5EC`<br>Accent: `#4F46E5`<br>Shadow Dark: `#a3b1c6`<br>Shadow Light: `#ffffff` | Smooth rounded (`16px`) |
| **2. Luxury / Dark Gold** | Deep dark canvas, rich serif typography, sharp metallic gold accents | High-end jewelry, watches, premium perfumes, luxury fashion | BG: `#0B090A`<br>Surface: `#161A1D`<br>Accent: `#D4AF37`<br>Text: `#F5F3F4` | Sharp rectangular (`0px`) |
| **3. Vibrant / Streetwear** | High-contrast neon accents, thick borders, heavy bold typography | Streetwear, sneakers, urban accessories, gaming gear | BG: `#0F0F12`<br>Surface: `#1A1A22`<br>Accent: `#CCFF00`<br>Secondary: `#FF0055` | Medium sharp (`4px`), Heavy borders (`2px+`) |
| **4. Organic / Artisan** | Earthy warm tones, soft rounded cards, eco-friendly feel | Embroidery, traditional garments, handmade crafts, bio cosmetics | BG: `#F7F5F0`<br>Surface: `#EFECE6`<br>Accent: `#6B8E23`<br>Secondary: `#C86D51` | Ultra rounded (`24px`) |
| **5. Tech / High-Tech** | Modern dark mode, glassmorphism translucency, subtle glow effects | High-tech accessories, computer hardware, modern devices | BG: `#0A0E17`<br>Surface: `#121824`<br>Accent: `#00E5FF`<br>Border: `#1F293D` | Balanced rounded (`12px`) |

---

## 3. Scope & Page Architecture

### A. Storefront (Customer Facing)
1. **Global Homepage:**
   * Hero section with main promotional banner and CTA.
   * Product showcase grid with category filters.
   * Trust badges (COD guarantee, package inspection before payment, 69 Wilayas delivery).
2. **Single Product COD Landing Page:**
   * Media-rich layout (image carousel, embedded video demo).
   * High-conversion copywriting sections (Benefits, Features, Customer Reviews with photos).
   * **In-Page Express COD Checkout Form:**
     * Variant Selector (e.g., Color / Size) — inactive variants rendered unselectable.
     * Full Name & Phone Number Input (Validated regex: `^0(5|6|7)[0-9]{8}$`).
     * Cascading Dropdowns: **69 Wilayas** $
ightarrow$ **1,541 Communes**.
     * Shipping Mode: **À Domicile (Home Delivery)** vs **Stop Desk (Bureau)**.
     * Dynamic Live Pricing: `Selected Variant Price + Shipping Fee = Grand Total`.
     * Metadata Collection: Client IP and User-Agent captured invisibly at submission for CAPI/EMQ matching.
3. **Thank You Page (Confirmation):**
   * Order summary and tracking ID.
   * Reassurance message: *"Our call center agent will contact you shortly by phone to confirm your order."*

### B. Admin Dashboard
1. **Product & Variant Management (CRUD):**
   * Products include variants (Color, Size, etc.) with custom prices or inherited base price.
   * **No inventory counter:** Availability handled manually via an `Active / Inactive` toggle per variant.
   * Media gallery upload, copywriting sections, and manual customer review manager.
2. **Global Theme Switcher:**
   * Preview cards for the 5 themes with instant single-click activation.
   * Stores `active_theme` in DB settings to guarantee consistent SSR rendering.
3. **Delivery Matrix Management (69 Wilayas):**
   * Independent rate fields per Wilaya for both **Home Delivery** and **Stop Desk**.
4. **COD Order Management Pipeline:**
   * Status Workflow: `Pending Confirmation` $
ightarrow$ `Confirmed` $
ightarrow$ `Shipped` $
ightarrow$ `Delivered` / `Cancelled / No Answer`.
   * Triggering `Confirmed` initiates automated API parcel creation with the logistics aggregator (e.g., Ecotrack).
   * **Fallback Mechanism (Option A):** If parcel creation fails (network error, invalid address), the order updates to `Confirmed` with a **"Bordereau Non Généré"** warning badge and a **"Réessayer la Génération"** retry button.
5. **Multi-Pixel Management & Product Assignment:**
   * Supports Meta Pixels & TikTok Pixels stored securely in DB with access tokens encrypted.
   * **Per-Product Mapping:** Admin can assign specific pixels to individual products/landing pages, OR set global default pixels.
   * Client-side JS pixels trigger standard events (`PageView`, `ViewContent`, `InitiateCheckout`).
   * Server-side APIs (Meta CAPI & TikTok Events API) fire the `Purchase` / `CompletePayment` event **ONLY when the agent moves the order status to `Confirmed`**.
   * Transmits hashed phone number (SHA-256), IP, and User-Agent to ensure high Event Match Quality (EMQ).
6. **Role-Based Access Control (RBAC):**
   * **Admin Role:** Full system access (Themes, Delivery Matrix, Pixels, Product CRUD, User Management).
   * **Call Agent Role:** Restricted exclusively to Order Management (viewing orders, calling clients, updating order statuses, triggering manual parcel retries).

---

## 4. Algeria Localization & Territorial Mapping

* **Currency:** DZD (`DA` / `د.ج`).
* **Territorial Coverage:** 69 Wilayas (01 - Adrar to 69 - El Abiodh Sidi Cheikh) and 1,541 Communes based on official Law n° 26-06.
* **Data Source:** Official JSON dataset loaded into database tables during initial seeding.

---

## 5. Technical Stack

* **Framework:** Next.js (App Router, React 19)
* **Styling:** Tailwind CSS + Root CSS Variables
* **Database:** PostgreSQL (via Prisma or Supabase) for storing settings, products, variants, orders, delivery matrix, pixels, and user accounts.
* **State Management:** Zustand / React Context
* **API Integrations:** Logistics Aggregator API (e.g., Ecotrack), Meta Conversions API (CAPI), TikTok Events API.
* **Security:** Tokens encrypted at rest using AES-256; SHA-256 hashing for user PII payload in server-side pixel dispatch.

---

## 6. Implementation Roadmap

1. **Phase 1: DB Schema, Authentication & RBAC**
   * Set up PostgreSQL schema (Users, Products, Variants, Orders, Delivery Matrix, Settings, Pixels).
   * Implement NextAuth / JWT authentication with Admin vs Call Agent roles.
2. **Phase 2: Theme Engine & Global Settings**
   * Build CSS variable layer in `globals.css` and Tailwind config.
   * Build Theme Switcher component writing to DB settings for SSR consistency.
3. **Phase 3: DZ Territorial Matrix & Form Checkout**
   * Seed 69 Wilayas / 1,541 Communes database tables.
   * Build cascading selectors, dynamic price calculation, and IP/User-Agent capture.
4. **Phase 4: Product CRUD & Single-Product Landing Page**
   * Implement Product/Variant manager with manual Active/Inactive toggles.
   * Build high-converting single-product COD landing page layout.
5. **Phase 5: Logistics Aggregator & COD Pipeline**
   * Integrate unified shipping API (e.g., Ecotrack).
   * Implement Option A fallback retry system for parcel waybill generation in Admin.
6. **Phase 6: Multi-Pixel Server-Side Tracking (CAPI)**
   * Implement product-specific pixel assignment logic.
   * Build server-side route firing `Purchase` events with SHA-256 phone, IP, and User-Agent upon phone confirmation
