#!/bin/bash
# SSL Setup with Let's Encrypt
# Usage: ./nginx/ssl/setup-ssl.sh yourdomain.dz admin@email.com

set -e

DOMAIN=${1:-yourdomain.dz}
EMAIL=${2:-admin@ecom-dz.com}

echo "Setting up SSL for $DOMAIN..."

# Create certbot directory
mkdir -p nginx/ssl

# Run certbot via Docker
docker run --rm -it \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email

echo "SSL certificates generated!"
echo "Edit nginx/conf.d/default.conf to uncomment SSL lines"
echo "Restart nginx: docker compose restart nginx"
