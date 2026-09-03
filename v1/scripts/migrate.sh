#!/bin/bash
# Run Prisma migrations inside the Docker container
set -e

echo "Running Prisma migration..."
docker compose exec app npx prisma db push --accept-data-loss
echo "Migration complete!"
