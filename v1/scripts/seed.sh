#!/bin/bash
# Seed the database
set -e

echo "Seeding database..."
docker compose exec app npx tsx prisma/seed.ts
echo "Seed complete!"
