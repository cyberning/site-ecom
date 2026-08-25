# requirements.md — Prérequis Système (sudo)

> Ce document liste toutes les dépendances système à installer sur un VPS Ubuntu/Debian avant de pouvoir développer et déployer le projet e-commerce.
>
> **Cible :** Ubuntu 24.04 LTS (ou Debian 12 Bookworm)
> **Dernière mise à jour :** 2026-08-25

---

## 1. Mise à jour du système

Commencez toujours par mettre à jour le système pour disposer des dernières versions de sécurité.

```bash
sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y
```

Vérifiez la version de votre OS :

```bash
lsb_release -a
# Ubuntu 24.04.x LTS (Noble Numbat) attendu
```

> **Debian 12 :** Les commandes sont identiques. Remplacez uniquement les références à `noble` par `bookworm` si besoin.

---

## 2. Node.js 20 LTS

### Option A — Via NodeSource (recommandé pour les serveurs)

```bash
# Installer curl si absent
sudo apt install -y curl

# Ajouter le dépôt NodeSource pour Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Installer Node.js
sudo apt install -y nodejs
```

### Option B — Via nvm (utile pour la gestion multi-versions)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Recharger le shell
source ~/.bashrc

# Installer Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20
```

### Vérification

```bash
node -v   # v20.x.x attendu
npm -v    # 10.x.x attendu
```

> **pnpm (optionnel) :** Si le projet utilise pnpm au lieu de npm :
> ```bash
> sudo npm install -g pnpm
> pnpm -v
> ```

---

## 3. Git

```bash
sudo apt install -y git
```

Configuration basique (à adapter avec votre nom/email) :

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
git config --global init.defaultBranch main
```

Vérification :

```bash
git --version
# git version 2.x.x attendu
```

---

## 4. PostgreSQL 16

### Installation

```bash
# Ajouter le dépôt officiel PostgreSQL ( nécessaire pour la version 16 sur Ubuntu 22.04 )
sudo apt install -y curl ca-certificates gnupg

# Installer les clés GPG
sudo install -d /usr/share/postgresql-common/pgdg
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
  sudo gpg --dearmor -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg

# Ajouter le dépôt
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
  sudo tee /etc/apt/sources.list.d/pgdg.list

# Installer PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16
```

> **Ubuntu 24.04 :** PostgreSQL 16 est déjà dans les dépôts officiels, donc l'étape du dépôt externe peut être simplifiée :
> ```bash
> sudo apt install -y postgresql-16 postgresql-client-16
> ```

### Vérification du service

```bash
sudo systemctl status postgresql
# Devrait afficher "active (running)"
```

> **Si psql ne se lance pas :** Vérifiez que PostgreSQL tourne avec `sudo systemctl status postgresql`. Si le service est arrêté : `sudo systemctl start postgresql`.

### Création de la base de données et de l'utilisateur

```bash
# Passer en utilisateur postgres (par défaut)
sudo -u postgres psql
```

Dans le prompt psql :

```sql
-- Créer l'utilisateur de l'application (remplacez les valeurs)
CREATE USER ecommerce_user WITH PASSWORD 'votre_mot_de_passe_securise';

-- Créer la base de données
CREATE DATABASE ecommerce_db OWNER ecommerce_user;

-- Donner tous les privilèges sur la base
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;

-- Quitter psql
\q
```

### Configuration de l'authentification

Éditez le fichier `pg_hba.conf` pour activer l'authentification par mot de passe :

```bash
# Localiser le fichier (adaptez la version)
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Assurez-vous que ces lignes existent :

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   ecommerce_db    ecommerce_user                          scram-sha-256
host    ecommerce_db    ecommerce_user    127.0.0.1/32         scram-sha-256
host    ecommerce_db    ecommerce_user    ::1/128              scram-sha-256
```

> **Important :** Utilisez `scram-sha-256` (pas `md5`) pour une meilleure sécurité.

Redémarrez PostgreSQL après modification :

```bash
sudo systemctl restart postgresql
```

### Test de connexion

```bash
psql -U ecommerce_user -d ecommerce_db -h 127.0.0.1
# Entrez le mot de passe quand demandé
```

### Initialisation via Prisma (une fois le projet installé)

```bash
# depuis la racine du projet
npx prisma migrate dev
# ou en production :
npx prisma migrate deploy
```

---

## 5. Docker & Docker Compose

### Installation de Docker Engine

```bash
# Supprimer les anciennes versions (optionnel)
sudo apt remove -y docker docker-engine docker.io containerd runc

# Installer les dépendances
sudo apt install -y ca-certificates curl gnupg

# Ajouter la clé GPG officielle Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

> **Debian 12 :** Remplacez `ubuntu` par `debian` dans l'URL du dépôt Docker.

### Ajout de l'utilisateur au groupe docker

```bash
sudo usermod -aG docker $USER

# IMPORTANT : déconnexion/reconnexion nécessaire pour que le groupe prenne effet
# Ou exécutez :
newgrp docker
```

> **⚠️ Sécurité :** Ajouter un utilisateur au groupe `docker` lui donne des droits équivalents à `root` sur le démon Docker. Ne le faites que sur des serveurs de développement ou si vous comprenez les implications.

### Vérification

```bash
docker --version
# Docker version 24.x.x ou 25.x.x

docker compose version
# Docker Compose version v2.x.x

# Test
docker run hello-world
```

### Démarrage automatique de Docker

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 6. Nginx

### Installation

```bash
sudo apt install -y nginx
```

### Activation et démarrage

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Vérification

```bash
sudo systemctl status nginx
# Devrait afficher "active (running)"

nginx -v
# nginx version: nginx/1.x.x
```

### Pare-feu — Ouvrir les ports

```bash
# Si UFW est installé
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status

# Ou manuellement
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Configuration de base du site

Créez un fichier de configuration pour le projet :

```bash
sudo nano /etc/nginx/sites-available/ecommerce
```

Exemple de configuration (à adapter) :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection HTTP → HTTPS (décommenter après installation du certificat)
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3000;  # Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Fichiers statiques Next.js (optionnel, pour servir via Nginx)
    location /_next/static/ {
        alias /var/www/ecommerce/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Fichiers uploadés
    location /uploads/ {
        alias /var/www/ecommerce/uploads/;
        expires 7d;
    }

    # Gestion des erreurs
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

Activez le site et testez la configuration :

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/

# Supprimer la config par défaut (optionnel)
sudo rm /etc/nginx/sites-enabled/default

# Tester la syntaxe
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 7. Certbot & SSL Let's Encrypt

### Installation de Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtention d'un certificat SSL

```bash
# Avec le plugin Nginx (configure automatiquement Nginx)
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# OU sans modifier Nginx (mode standalone)
sudo certbot certonly --standalone -d votre-domaine.com -d www.votre-domaine.com
```

### Renouvellement automatique

Certbot installe un timer systemd par défaut. Vérifiez :

```bash
sudo systemctl status certbot.timer
```

Testez le renouvellement :

```bash
sudo certbot renew --dry-run
```

> **Si le renouvellement échoue :** Vérifiez que le port 80 est accessible depuis l'extérieur et que Nginx n'est pas en mode standalone pendant le renouvellement.

---

## 8. Librairies système pour Sharp (libvips)

Sharp est utilisé pour la compression et le traitement des images. Il nécessite `libvips` et ses dépendances.

### Ubuntu 24.04 / Debian 12

```bash
sudo apt install -y \
  libvips-dev \
  libvips42 \
  build-essential \
  python3 \
  g++
```

### Vérification

```bash
pkg-config --modversion vips
# 8.x.x attendu
```

> **En cas d'erreur lors de `npm install` liée à Sharp :**
> - Vérifiez que `build-essential` est installé
> - Essayez `npm install --build-from-source sharp`
> - Consultez les logs : `npm install sharp 2>&1 | tail -20`

---

## 9. Librairies système pour Playwright (Chromium)

Playwright utilise Chromium pour les tests E2E. Les librairies système suivantes sont nécessaires :

### Installation des dépendances Chromium

```bash
sudo apt install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libatspi2.0-0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libwayland-client0
```

### Installation des navigateurs Playwright

```bash
# Depuis le dossier du projet (après npm install)
npx playwright install

# Installer uniquement Chromium (plus léger)
npx playwright install chromium

# Installer les dépendances système des navigateurs
npx playwright install-deps
```

> **Important :** `npx playwright install-deps` nécessite les droits sudo. Exécutez-le dans un terminal avec accès root.
>
> **Sur un serveur sans interface graphique :** N'installez que Chromium :
> ```bash
> npx playwright install --with-deps chromium
> ```

### Vérification

```bash
npx playwright --version
```

---

## 10. Outils complémentaires

```bash
sudo apt install -y \
  curl \
  wget \
  unzip \
  zip \
  build-essential \
  python3 \
  make \
  g++ \
  jq \
  htop \
  tree \
  net-tools \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common \
  apt-transport-https
```

Description rapide :

| Outil | Usage |
|-------|-------|
| `curl` / `wget` | Téléchargements HTTP |
| `unzip` / `zip` | Archives |
| `build-essential` | Compilation native (gcc, make, etc.) |
| `python3` | Requis par certains modules npm natifs |
| `jq` | Manipulation JSON en ligne de commande |
| `htop` | Monitoring système interactif |
| `tree` | Affichage de l'arborescence |
| `net-tools` | Diagnostic réseau (`netstat`, etc.) |
| `software-properties-common` | Gestion des dépôts PPA |

---

## 11. Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
# ============================================
# Base de données
# ============================================
DATABASE_URL="postgresql://ecommerce_user:votre_mot_de_passe_securise@localhost:5432/ecommerce_db?schema=public"

# ============================================
# Application
# ============================================
NODE_ENV="production"
NEXTAUTH_URL="https://votre-domaine.com"
NEXTAUTH_SECRET="generer_ici_un_secret_aleatoire_au_moins_32_caracteres"

# ============================================
# Upload de fichiers
# ============================================
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# ============================================
# Email (optionnel — pour les emails transactionnels)
# ============================================
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@votre-domaine.com"

# ============================================
# Clé API Stripe (optionnel — pour les paiements)
# ============================================
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ============================================
# Docker / Nginx
# ============================================
APP_PORT="3000"
POSTGRES_PORT="5432"
NGINX_PORT="80"
```

### Génération d'un secret NextAuth

```bash
# Méthode 1 : openssl
openssl rand -base64 32

# Méthode 2 : node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> **⚠️ Sécurité :** Ne commitez jamais le fichier `.env` dans Git. Assurez-vous que `.gitignore` contient bien `*.env` et `.env*`.

---

## 12. Commande résumé (Quick Start)

Ce script installe toutes les dépendances d'un coup sur Ubuntu 24.04 LTS.

```bash
#!/bin/bash
# ============================================
# Script d'installation complète — VPS Ubuntu 24.04
# Usage : sudo bash setup-vps.sh
# ============================================

set -euo pipefail

echo "🔧 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

echo "📦 Installation des outils de base..."
sudo apt install -y \
  curl wget unzip zip \
  build-essential python3 make g++ \
  jq htop tree net-tools \
  ca-certificates gnupg lsb-release \
  software-properties-common apt-transport-https

echo "🟢 Installation de Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "🔧 Installation de Git..."
sudo apt install -y git
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"

echo "🐘 Installation de PostgreSQL 16..."
sudo apt install -y postgresql-16 postgresql-client-16
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "🐳 Installation de Docker & Docker Compose..."
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
sudo systemctl enable docker

echo "🌐 Installation de Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo ufw allow 'Nginx Full' 2>/dev/null || true

echo "🔒 Installation de Certbot..."
sudo apt install -y certbot python3-certbot-nginx

echo "🖼️  Installation des librairies Sharp (libvips)..."
sudo apt install -y libvips-dev libvips42

echo "🎭 Installation des dépendances Playwright..."
sudo apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libdbus-1-3 libxkbcommon0 \
  libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
  libasound2 libwayland-client0

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Déconnectez-vous et reconnexion pour que le groupe docker prenne effet"
echo "   2. Clonez le projet : git clone <url-du-repo>"
echo "   3. Installez les dépendances : npm install"
echo "   4. Configurez votre fichier .env (voir requirements.md §11)"
echo "   5. Créez la base de données et l'utilisateur PostgreSQL (voir requirements.md §4)"
echo "   6. Lancez les migrations : npx prisma migrate deploy"
echo "   7. Démarrez l'application : npm run build && npm start"
echo "   8. Configurez Nginx (voir requirements.md §6)"
echo "   9. Obtenez un certificat SSL : sudo certbot --nginx -d votre-domaine.com"
echo ""
```

> **Utilisation :**
> ```bash
> curl -o setup-vps.sh https://votre-domaine.com/setup-vps.sh  # ou copiez le script
> sudo bash setup-vps.sh
> ```

---

## 13. Vérification post-installation

Exécutez ces commandes pour vous assurer que tout est correctement installé :

```bash
echo "=== Vérification des prérequis ==="
echo ""

# Node.js
echo "🟢 Node.js :"
node -v && npm -v
echo ""

# Git
echo "🔧 Git :"
git --version
echo ""

# PostgreSQL
echo "🐘 PostgreSQL :"
psql --version
sudo systemctl status postgresql --no-pager | head -5
echo ""

# Docker
echo "🐳 Docker :"
docker --version
docker compose version
echo ""

# Nginx
echo "🌐 Nginx :"
nginx -v 2>&1
sudo systemctl status nginx --no-pager | head -5
echo ""

# Sharp / libvips
echo "🖼️  libvips :"
pkg-config --modversion vips 2>/dev/null || echo "⚠️  libvips non trouvé — installez libvips-dev"
echo ""

# Playwright
echo "🎭 Playwright :"
npx playwright --version 2>/dev/null || echo "⚠️  Playwright non trouvé — exécutez npx playwright install"
echo ""

# Build tools
echo "🔨 Build tools :"
gcc --version 2>/dev/null | head -1 || echo "⚠️  gcc non trouvé — installez build-essential"
echo ""

# Certbot
echo "🔒 Certbot :"
certbot --version 2>&1 || echo "⚠️  Certbot non trouvé"
echo ""

# Ports
echo "📡 Ports ouverts :"
ss -tlnp | grep -E ':(80|443|3000|5432)\s' || echo "⚠️  Aucun port détecté"
echo ""

echo "✅ Vérification terminée."
```

### Résolution des problèmes courants

| Problème | Solution |
|----------|----------|
| `psql: command not found` | `sudo apt install postgresql-client-16` |
| `docker: permission denied` | Ajoutez l'utilisateur au groupe : `sudo usermod -aG docker $USER` puis reconnexion |
| `npm ERR! sharp` | Vérifiez `libvips-dev` : `sudo apt install -y libvips-dev` |
| `nginx: [emerg] bind() to 0.0.0.0:80 failed` | Port déjà utilisé : `sudo lsof -i :80` puis arrêtez le processus |
| `502 Bad Gateway` dans le navigateur | Next.js n'est pas lancé ou le port ne correspond pas |
| `connection refused` sur PostgreSQL | Vérifiez le service : `sudo systemctl status postgresql` |
| SSL `certbot: command not found` | `sudo apt install certbot python3-certbot-nginx` |
| Playwright affiche `Dependency Executable Not Found` | `npx playwright install --with-deps chromium` |
| `EACCES` lors de `npm install` global | Ne pas utiliser `sudo npm install -g`, utilisez nvm ou changez le répertoire npm |
