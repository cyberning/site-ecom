-- Migration: Add missing columns to existing tables
-- Date: 2026-09-03
-- Purpose: Sync PostgreSQL schema with current Prisma schema without data loss
-- Strategy: Add nullable columns first, backfill data, then add NOT NULL constraints

-- ============================================================================
-- 1. TABLE: wilayas (69 rows)
-- ============================================================================
-- Add name_ar column
ALTER TABLE "wilayas" ADD COLUMN IF NOT EXISTS "name_ar" TEXT;

-- Backfill existing rows with empty string
UPDATE "wilayas" SET "name_ar" = '' WHERE "name_ar" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "wilayas" ALTER COLUMN "name_ar" SET NOT NULL;
ALTER TABLE "wilayas" ALTER COLUMN "name_ar" SET DEFAULT '';


-- ============================================================================
-- 2. TABLE: communes (1541 rows)
-- ============================================================================
-- Add name_ar column
ALTER TABLE "communes" ADD COLUMN IF NOT EXISTS "name_ar" TEXT;

-- Backfill existing rows with empty string
UPDATE "communes" SET "name_ar" = '' WHERE "name_ar" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "communes" ALTER COLUMN "name_ar" SET NOT NULL;
ALTER TABLE "communes" ALTER COLUMN "name_ar" SET DEFAULT '';


-- ============================================================================
-- 3. TABLE: users (2 rows)
-- ============================================================================
-- Add passwordHash column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

-- Backfill with placeholder for existing users
-- Users have a 'password' column; set passwordHash to a placeholder indicating reset needed
UPDATE "users" SET "passwordHash" = 'need-to-reset' WHERE "passwordHash" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "passwordHash" SET DEFAULT '';

-- Add updatedAt column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

-- Backfill with NOW() for existing users
UPDATE "users" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- 4. TABLE: products (2 rows)
-- ============================================================================
-- Add updatedAt column
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

-- Backfill with NOW() for existing products
UPDATE "products" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "products" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- 5. TABLE: variants (4 rows)
-- ============================================================================
-- Add name column (variant name/description, not the product name)
ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Backfill with empty string
UPDATE "variants" SET "name" = '' WHERE "name" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "variants" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "variants" ALTER COLUMN "name" SET DEFAULT '';

-- Add price column (the variant's effective/base price)
ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2);

-- Backfill with 0 for existing variants
UPDATE "variants" SET "price" = 0 WHERE "price" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "variants" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "variants" ALTER COLUMN "price" SET DEFAULT 0;

-- Add updatedAt column
ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

-- Backfill with NOW()
UPDATE "variants" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "variants" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "variants" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- 6. TABLE: orders (1 row)
-- ============================================================================
-- Add customerPhone column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;

-- Backfill from existing phoneNumber column
UPDATE "orders" SET "customerPhone" = "phoneNumber" WHERE "customerPhone" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "customerPhone" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "customerPhone" SET DEFAULT '';

-- Add customerPhoneHash column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerPhoneHash" TEXT;

-- Backfill with empty string (hash not available for legacy data)
UPDATE "orders" SET "customerPhoneHash" = '' WHERE "customerPhoneHash" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "customerPhoneHash" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "customerPhoneHash" SET DEFAULT '';

-- Add fullAddress column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fullAddress" TEXT;

-- Backfill with empty string (no address data in legacy rows)
UPDATE "orders" SET "fullAddress" = '' WHERE "fullAddress" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "fullAddress" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "fullAddress" SET DEFAULT '';

-- Add subtotal column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2);

-- Backfill from totalAmount (best approximation for legacy data)
UPDATE "orders" SET "subtotal" = "totalAmount" WHERE "subtotal" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET DEFAULT 0;

-- Add total column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total" DECIMAL(10,2);

-- Backfill from totalAmount
UPDATE "orders" SET "total" = "totalAmount" WHERE "total" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "total" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "total" SET DEFAULT 0;

-- Add trackingId column (UNIQUE, NOT NULL)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingId" TEXT;

-- Backfill with unique legacy tracking IDs
UPDATE "orders" SET "trackingId" = 'LEGACY-' || "id" WHERE "trackingId" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "trackingId" SET NOT NULL;

-- Add UNIQUE constraint (after data is backfilled to avoid conflicts)
ALTER TABLE "orders" ADD CONSTRAINT "orders_trackingId_key" UNIQUE ("trackingId");

-- Add updatedAt column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

-- Backfill with NOW()
UPDATE "orders" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- 7. TABLE: settings (1 row)
-- ============================================================================
-- Add key column (UNIQUE, NOT NULL)
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "key" TEXT;

-- Backfill existing row with 'app_name' key
UPDATE "settings" SET "key" = 'app_name' WHERE "key" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "settings" ALTER COLUMN "key" SET NOT NULL;

-- Add UNIQUE constraint
ALTER TABLE "settings" ADD CONSTRAINT "settings_key_key" UNIQUE ("key");

-- Add updatedAt column
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

-- Backfill with NOW()
UPDATE "settings" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "settings" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Add value column (JSONB)
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "value" JSONB;

-- Backfill with empty JSON object
UPDATE "settings" SET "value" = '{}'::jsonb WHERE "value" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "settings" ALTER COLUMN "value" SET NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "value" SET DEFAULT '{}'::jsonb;
