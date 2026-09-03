#!/bin/sh
# =============================================================================
# eCom DZ v2 — Script d'entrée du conteneur
#
# Ordre d'exécution :
#   1. `prisma db push`  -> crée / met à jour le schéma SQLite
#   2. `tsx prisma/seed.ts` -> seed idempotent (upsert / deleteMany)
#   3. `node server.js`  -> démarre le serveur Next.js standalone
#
# Le seed est idempotent (utilise upsert / deleteMany), il peut donc être
# exécuté à chaque démarrage sans risque de doublons.
# =============================================================================
set -e

echo "==> [1/3] Prisma db push (création / migration du schéma SQLite)..."
npx prisma db push --skip-generate

echo "==> [2/3] Seed de la base (idempotent)..."
# On lance le seed via tsx directement (équivalent à `npm run db:seed`).
# NB : on n'utilise pas `prisma db seed` car la config `prisma.seed` n'est pas
# déclarée dans package.json ; `tsx prisma/seed.ts` est la méthode fiable.
npx tsx prisma/seed.ts

echo "==> [3/3] Démarrage du serveur Next.js standalone..."
exec node server.js
