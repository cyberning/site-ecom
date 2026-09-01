# Déploiement sur alwaysdata — Résumé des étapes

> **Note** : remplacez `[compte]` partout par votre nom de compte alwaysdata (ex. `moncompte`).

## Sommaire

1. [Prérequis](#prérequis)
2. [Étape 1 — Créer la base PostgreSQL](#étape-1--créer-la-base-postgresql)
3. [Étape 2 — Activer l'accès SSH](#étape-2--activer-laccès-ssh)
4. [Étape 3 — Uploader le projet](#étape-3--uploader-le-projet)
5. [Étape 4 — Installer et builder sur le serveur](#étape-4--installer-et-builder-sur-le-serveur)
6. [Étape 5 — Préparer le dossier standalone](#étape-5--préparer-le-dossier-standalone)
7. [Étape 6 — Créer le site Node.js](#étape-6--créer-le-site-nodejs)
8. [Étape 7 — Variables d'environnement](#étape-7--variables-denvironnement)
9. [Étape 8 — Domaine et SSL (optionnel)](#étape-8--domaine-et-ssl-optionnel)
10. [Étape 9 — Tâche planifiée (cron)](#étape-9--tâche-planifiée-cron)
11. [Étape 10 — Vérifications finales](#étape-10--vérifications-finales)
12. [Dépannage rapide](#dépannage-rapide)
13. [Récapitulatif](#récapitulatif)

## Prérequis

- Compte alwaysdata (Cloud Public) + accès à `https://admin.alwaysdata.com`
- SSH activé (étape 2) : hôte `ssh-[compte].alwaysdata.net:22`
- Domaine optionnel (sinon sous-domaine gratuit `[compte].alwaysdata.net`)
- **Docker non utilisé** sur le mutualisé : on déploie le build standalone (`output: "standalone"`)

## Étape 1 — Créer la base PostgreSQL

1. Admin > **Bases de données > PostgreSQL** > Ajouter une base (version 16/17/18).
2. Noter : serveur `postgresql-[compte].alwaysdata.net:5432`, base `[compte]_base`, utilisateur `[compte]`, mot de passe.
3. Construire `DATABASE_URL` :

```
postgresql://[compte]:[MOT_DE_PASSE]@postgresql-[compte].alwaysdata.net:5432/[compte]_base?schema=public
```

> `?schema=public` est **obligatoire** (schéma Prisma).

## Étape 2 — Activer l'accès SSH

1. Admin > **Accès distant > SSH/SFTP** > créer un utilisateur SSH + mot de passe.
2. Hôte : `ssh-[compte].alwaysdata.net:22`, utilisateur `[compte]`.
3. Tester :

```bash
ssh [compte]@ssh-[compte].alwaysdata.net
```

## Étape 3 — Uploader le projet

Depuis la racine du projet local :

```bash
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env*' \
  --exclude='playwright-report' \
  --exclude='test-results' \
  -e "ssh" \
  . [compte]@ssh-[compte].alwaysdata.net:/home/[compte]/ecom/
```

## Étape 4 — Installer et builder sur le serveur

En SSH, dans `/home/[compte]/ecom` :

```bash
cd /home/[compte]/ecom
export NODEJS_VERSION=22
npm ci
npx prisma generate
npx prisma db push        # pas de dossier prisma/migrations dans ce repo
npm run db:seed           # lit ADMIN_EMAIL / ADMIN_PASSWORD
npm run build
```

> Avant `db push` et le seed, `DATABASE_URL` (et `ADMIN_*`) doivent être définis (fichier `.env` ou variables en ligne).

## Étape 5 — Préparer le dossier standalone

```bash
cd /home/[compte]/ecom
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r prisma .next/standalone/prisma
mkdir -p .next/standalone/public/uploads/{hero,products}
chmod -R u+rwX .next/standalone/public/uploads
```

> `public/uploads` est ignoré par git : sauvegardez-le avant un redéploiement (ex. `/home/[compte]/backups/uploads`).

## Étape 6 — Créer le site Node.js

Admin > **Web > Sites > Ajouter un site** :

| Champ | Valeur |
| --- | --- |
| Adresses | `[compte].alwaysdata.net` (et/ou votre domaine) |
| Type | `Node.js` |
| Commande | `node /home/[compte]/ecom/.next/standalone/server.js` |
| Répertoire de travail | `/home/[compte]/ecom/.next/standalone` |
| Version de Node.js | `22` |
| Redémarrage à chaud | `SIGHUP` |
| Environnement | variables de l'étape 7 + `PORT=$PORT` et `HOSTNAME=$IP` |

## Étape 7 — Variables d'environnement

Dans le champ **Environnement** du site (une par ligne) :

```
NODE_ENV=production
DATABASE_URL=postgresql://[compte]:[MOT_DE_PASSE]@postgresql-[compte].alwaysdata.net:5432/[compte]_base?schema=public
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://[domaine]
ADMIN_EMAIL=admin@exemple.com
ADMIN_PASSWORD=<mot de passe fort>
ENCRYPTION_KEY=<openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://[domaine]
PORT=$PORT
HOSTNAME=$IP
```

Générer les secrets :

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY
```

> Après modification des variables : redémarrer le site.

## Étape 8 — Domaine et SSL (optionnel)

1. **Domaines > Domaines** : déclarer le domaine, le lier au site.
2. **Web > Sites** : ajouter le domaine dans **Adresses**.
3. DNS chez le registrar : pointer vers alwaysdata.
4. Section **SSL/TLS** du site : activer **Let's Encrypt** + redirection `http://` → `https://`.
5. Mettre à jour `NEXTAUTH_URL` et `NEXT_PUBLIC_APP_URL` avec `https://[domaine]`, puis rebuilder et redémarrer.

## Étape 9 — Tâche planifiée (cron)

Admin > **Avancé > Tâches planifiées** > Ajouter :

```bash
curl -X POST https://[domaine]/api/cron/retry-orders
```

Fréquence : `*/5 * * * *` (toutes les 5 minutes). Logs : `/home/[compte]/admin/logs/jobs/`.

## Étape 10 — Vérifications finales

1. Redémarrer le site (**Web > Sites**).
2. Tester `https://[compte].alwaysdata.net` : catalogue, images `/uploads/products/...`, panier, admin sur `/admin`.
3. Logs : `tail -f /home/[compte]/admin/logs/sites/*.log`.
4. Vérifier les tables dans **Bases de données > phpPgAdmin**.

## Dépannage rapide

- **502 / site muet** : `PORT=$PORT` (et `HOSTNAME=$IP`) dans l'environnement ; vérifier `server.js` et le répertoire de travail.
- **Prisma P1001** : `DATABASE_URL` — serveur `postgresql-[compte].alwaysdata.net:5432`, base `[compte]_base`, `?schema=public`.
- **Uploads perdus / 403** : recopier `public/uploads` dans le standalone après chaque build ; `chmod -R u+rwX .next/standalone/public/uploads`.
- **Mauvaise version Node** : `export NODEJS_VERSION=22` (utiliser `node`, jamais `nodejs`).
- **Logs** : site → `/home/[compte]/admin/logs/sites/` ; tâches → `/home/[compte]/admin/logs/jobs/`.
- **Docker** : indisponible sur le mutualisé (Cloud Public) — uniquement Cloud Privé.

## Récapitulatif

| Élément | Valeur |
| --- | --- |
| Répertoire projet | `/home/[compte]/ecom` |
| Standalone | `/home/[compte]/ecom/.next/standalone` |
| Commande du site | `node /home/[compte]/ecom/.next/standalone/server.js` |
| Serveur PostgreSQL | `postgresql-[compte].alwaysdata.net:5432` |
| Base de données | `[compte]_base` |
| SSH | `ssh-[compte].alwaysdata.net:22` |
| Logs sites | `/home/[compte]/admin/logs/sites/` |
| Logs tâches | `/home/[compte]/admin/logs/jobs/` |