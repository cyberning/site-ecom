# Déploiement du site e-commerce sur alwaysdata

Ce guide explique, étape par étape, comment héberger le projet **e-commerce Next.js** (standalone) sur
la plateforme **alwaysdata** (hébergement mutualisé / Cloud Public).

> **À savoir avant de commencer**
>
> - **Docker n'est PAS utilisé** sur l'hébergement mutualisé alwaysdata (il n'est disponible que sur
>   Cloud Privé). Le `Dockerfile` et le `docker-compose.yml` du projet ne seront donc **pas** utilisés ici.
> - Le projet est configuré avec `output: "standalone"` dans `next.config.ts`. On déploie le dossier
>   `.next/standalone` généré par le build.
> - Tous les chemins utilisent le placeholder `[compte]` : remplacez-le partout par le nom réel de
>   votre compte alwaysdata (par exemple `moncompte`). Le même placeholder est utilisé dans la doc
>   officielle alwaysdata.
> - La version **Node.js recommandée est 22** (LTS). La version 20 (celle du `Dockerfile`) fonctionne
>   aussi. alwaysdata fournit les versions LTS 6 à 24.
>
> Ce guide suppose que vous avez déjà un compte **alwaysdata (Cloud Public)**. Consultez
> [la documentation officielle](https://help.alwaysdata.com/fr/) pour tout point non couvert ici.

---

## Sommaire

1. [Prérequis](#prérequis)
2. [Étape 1 — Créer la base de données PostgreSQL](#étape-1--créer-la-base-de-données-postgresql)
3. [Étape 2 — Activer/configurer l'accès SSH](#étape-2--activerconfigurer-laccès-ssh)
4. [Étape 3 — Uploader le projet](#étape-3--uploader-le-projet)
5. [Étape 4 — Installer les dépendances et builder sur le serveur](#étape-4--installer-les-dépendances-et-builder-sur-le-serveur)
6. [Étape 5 — Préparer le dossier standalone](#étape-5--préparer-le-dossier-standalone)
7. [Étape 6 — Créer le site Node.js](#étape-6--créer-le-site-nodejs)
8. [Étape 7 — Configurer les variables d'environnement](#étape-7--configurer-les-variables-denvironnement)
9. [Étape 8 — Configurer le domaine et le SSL](#étape-8--configurer-le-domaine-et-le-ssl-optionnel-mais-recommandé)
10. [Étape 9 — Créer la tâche planifiée](#étape-9--créer-la-tâche-planifiée-cron-retry-orders)
11. [Étape 10 — Vérifications finales](#étape-10--vérifications-finales)
12. [Dépannage](#dépannage)

---

## Prérequis

Avant de commencer, assurez-vous de disposer de :

| Élément | Détail |
| --- | --- |
| **Compte alwaysdata (Cloud Public)** | Enregistrement sur [alwaysdata.com](https://www.alwaysdata.com/fr/inscription/). Notez votre **nom de compte** (= `[compte]`). |
| **Accès à l'interface d'administration** | `https://admin.alwaysdata.com` — connexion avec les identifiants du compte. |
| **Domaine (optionnel mais recommandé)** | Un domaine enregistré ou transféré chez alwaysdata, ou un sous-domaine. Sinon, un sous-domaine gratuit `[compte].alwaysdata.net` est fourni par défaut. |
| **Accès SSH** | À activer à l'étape 2. Hôte `ssh-[compte].alwaysdata.net`, port 22. |
| **Le code source du projet** | Soit présent en local sur votre machine, soit cloné. On l'enverra sur le serveur à l'étape 3. |

Le nom de votre compte alwaysdata est affiché dans l'interface d'administration. **Mémorisez-le** : il
apparaît dans tous les chemins et les hôtes du guide (base de données, SSH, sites…).

---

## Étape 1 — Créer la base de données PostgreSQL

1. Connectez-vous à l'interface d'administration : <https://admin.alwaysdata.com>.
2. Allez dans **Bases de données > PostgreSQL**.
3. Cliquez sur **Ajouter une base de données** (ou l'équivalent selon la version de l'interface).
4. Choisissez une version disponible (**16, 17 ou 18** — peu importe laquelle pour ce projet).
5. Après création, alwaysdata affiche les **informations de connexion** à noter précieusement :

| Paramètre | Valeur (adapter `[compte]`) | Exemple |
| --- | --- | --- |
| **Serveur** | `postgresql-[compte].alwaysdata.net` | `postgresql-moncompte.alwaysdata.net` |
| **Port** | `5432` | `5432` |
| **Nom de la base** | `[compte]_base` | `moncompte_base` |
| **Utilisateur** | `[compte]` | `moncompte` |
| **Mot de passe** | celui défini à la création de la base | `(secret)` |

> **Astuce** : alwaysdata fournit aussi les identifiants via l'interface en cliquant sur la base créée.
> Un **pgBouncer** tourne sur le port `5433` si vous souhaitez regrouper les connexions (non nécessaire ici).
> Une interface web **phpPgAdmin** est disponible dans **Bases de données > phpPgAdmin** pour administrer
> visuellement votre base.

### Construire l'URL de connexion `DATABASE_URL`

Le projet utilise cette URL dans les variables d'environnement. Le format PostgreSQL standard est :

```
postgresql://UTILISATEUR:MOT_DE_PASSE@SERVEUR:PORT/NOM_DE_BASE?schema=public
```

Avec les valeurs alwaysdata, cela donne (remplacez les valeurs par les vôtres) :

```
postgresql://[compte]:[MOT_DE_PASSE]@postgresql-[compte].alwaysdata.net:5432/[compte]_base?schema=public
```

**Exemple complet :**

```
postgresql://moncompte:MotDePasseSuperSecret@postgresql-moncompte.alwaysdata.net:5432/moncompte_base?schema=public
```

> La chaîne `?schema=public` est **obligatoire** : le schéma Prisma en dépend.

---

## Étape 2 — Activer/configurer l'accès SSH

Pour pouvoir envoyer les fichiers via SFTP/SCP, vous devez disposer d'un **utilisateur SSH**.

1. Dans l'administration, allez dans **Accès distant > SSH/SFTP**.
2. Créez un utilisateur SSH (ou réutilisez celui par défaut, souvent nommé `[compte]`).
3. Définissez un **mot de passe** pour cet utilisateur SSH.
4. Notez les informations de connexion :

| Paramètre | Valeur (adapter `[compte]`) |
| --- | --- |
| **Hôte** | `ssh-[compte].alwaysdata.net` |
| **Port** | `22` |
| **Utilisateur** | `[compte]` (ou le nom d'utilisateur SSH créé) |
| **Mot de passe** | celui que vous venez de définir |

> **Remarque** : sur les offres infogérées (mutualisées), il n'y a **pas d'accès root**. C'est normal et
> voulu. Toutes les commandes s'exécutent dans votre racine `/home/[compte]/`.

### Tester la connexion SSH

Depuis votre machine locale, ouvrez un terminal et exécutez :

```bash
ssh [compte]@ssh-[compte].alwaysdata.net
```

Si cela fonctionne, vous êtes connecté au serveur dans votre répertoire personnel `/home/[compte]/`.

---

## Étape 3 — Uploader le projet

Le projet doit être placé dans un répertoire dédié de votre compte alwaysdata, par exemple
`/home/[compte]/ecom`. Vous pouvez l'envoyer via **scp** ou **sftp** depuis votre machine locale.

> Assurez-vous que le projet local est "propre" avant l'envoi (pas de `node_modules` ni `.next` dans
> ce que vous transférez — ces dossiers seront générés sur le serveur à l'étape 4).

### Option A — Via `scp` (commande simple)

Depuis **votre machine locale**, depuis le répertoire racine du projet :

```bash
cd /home/abdelghani/Bureau/ecom
scp -r . [compte]@ssh-[compte].alwaysdata.net:/home/[compte]/ecom
```

> ⚠️ `scp` n'accepte **pas** d'options d'exclusion (`--exclude` est ignoré). Avec `scp -r .`,
> les gros dossiers (`node_modules`, `.next`, `.git`) partent aussi sur le serveur. L'**Option B**
> (rsync) est donc recommandée pour éviter ce poids inutile. Si vous utilisez `scp`, supprimez
> ensuite ces dossiers sur le serveur :
>
> ```bash
> ssh [compte]@ssh-[compte].alwaysdata.net
> rm -rf /home/[compte]/ecom/node_modules /home/[compte]/ecom/.next /home/[compte]/ecom/.git
> ```

### Option B — Via `rsync` (recommandé, propre et incrémental)

`rsync` gère les exclusions nativement. Toujours depuis la racine du projet local :

```bash
cd /home/abdelghani/Bureau/ecom
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

### Option C — Via un client SFTP graphique

- **FileZilla** / **WinSCP** / **Cyberduck** : connectez-vous avec les identifiants de l'étape 2 et
  déposez les fichiers du projet dans `/home/[compte]/ecom/`.

### Vérifier l'upload

Connectez-vous en SSH et vérifiez que les fichiers sont bien présents :

```bash
ssh [compte]@ssh-[compte].alwaysdata.net
ls -la /home/[compte]/ecom
# Vous devez voir : package.json, next.config.ts, prisma/, src/, public/, ...
```

---

## Étape 4 — Installer les dépendances et builder sur le serveur

> Toutes les commandes ci-dessous s'exécutent **en SSH**, dans le répertoire `/home/[compte]/ecom`.

Commencez par vous placer dans le dossier du projet :

```bash
cd /home/[compte]/ecom
```

### 4.1 — Forcer la version de Node.js

alwaysdata propose plusieurs versions de Node.js. Pour être certain d'utiliser la **22 (recommandée)**,
définissez la variable `NODEJS_VERSION`. On l'exporte pour toute la session :

```bash
export NODEJS_VERSION=22
node --version   # => v22.x.x
npm --version
```

> Si vous préférez la version **20** (celle du `Dockerfile`), utilisez `export NODEJS_VERSION=20`.
> Vous pouvez aussi définir la version par défaut globalement dans l'administration
> (**Environnement > Node.js**).

### 4.2 — Installer les dépendances

Le projet possède un verrouillage de dépendances (`package-lock.json`). Utilisez `npm ci` pour une
installation reproductible, ou `npm install` :

```bash
npm ci
```

> - Sur alwaysdata, `npm install` fonctionne. Les paquets **globaux** (non nécessaires ici) iraient dans
>   `/home/[compte]/.npm-packages`.
> - Certains paquets natifs (ex. `sharp`) téléchargent des binaires précompilés. Si jamais `sharp`
>   rencontre un souci de compilation, consultez la section [Dépannage](#dépannage).

### 4.3 — Générer le client Prisma

```bash
npx prisma generate
```

### 4.4 — Appliquer le schéma à la base de données

Deux cas sont possibles selon le projet :

- **Le projet n'a pas de dossier `prisma/migrations/`** (c'est le cas ici) : on pousse le schéma
  directement avec `prisma db push`.
- **Le projet embarque un dossier `prisma/migrations/`** : on applique les migrations avec
  `prisma migrate deploy` (le script `db:migrate:prod` du `package.json`).

Comme **cette base de données est vide**, on commence par :

```bash
# Utilisez l'une des deux commandes selon la situation :

# Cas 1 — pas de dossier migrations (recommandé pour ce repo) :
npx prisma db push

# Cas 2 — dossier migrations présent :
npm run db:migrate:prod
```

> **Attention** : avant `db push`, les variables d'environnement (au minimum `DATABASE_URL`) doivent être
> accessibles à Prisma. Soit vous les définissez dans la commande, soit créez un fichier `.env` dans
> `/home/[compte]/ecom/` (créé à l'étape 7) **avant** d'exécuter cette commande.
>
> Pour tester sans fichier `.env`, vous pouvez passer la variable en ligne :
>
> ```bash
> DATABASE_URL="postgresql://[compte]:[MOT_DE_PASSE]@postgresql-[compte].alwaysdata.net:5432/[compte]_base?schema=public" \
>   npx prisma db push
> ```

### 4.5 — Insérer les données initiales (seed)

Le seed crée l'administrateur par défaut ainsi que la liste des wilayas/communes algériennes.
Il lit `ADMIN_EMAIL` et `ADMIN_PASSWORD` (variables d'environnement).

```bash
npm run db:seed
```

> Le seed utilise `tsx`, un outil de développement **présent dans les `devDependencies`**. Il faut donc
> avoir installé **toutes** les dépendances (`npm ci` s'en charge). Si le seed échoue parce que `tsx`
> est introuvable, vérifiez que `/home/[compte]/ecom/node_modules/.bin/tsx` existe.

### 4.6 — Builder le projet (mode standalone)

C'est l'étape qui produit le dossier `.next/standalone` :

```bash
npm run build
```

À la fin du build, vous devez avoir :

```
.next/standalone/server.js       # point d'entrée du serveur standalone
.next/standalone/.next/          # runtime nécessité par le standalone
.next/standalone/node_modules/   # dépendances copiées par Next.js
.next/static/                    # fichiers statiques générés
```

Vérifiez :

```bash
ls -la /home/[compte]/ecom/.next/standalone/server.js
```

---

## Étape 5 — Préparer le dossier standalone

Le dossier `.next/standalone` ne contient **pas** automatiquement les fichiers statiques et le dossier
`public`. Il faut les y copier explicitement. Toujours dans `/home/[compte]/ecom` :

```bash
cd /home/[compte]/ecom

# 1. Copier les fichiers statiques générés
cp -r .next/static .next/standalone/.next/static

# 2. Copier le dossier public (inclut les images produits/hero)
cp -r public .next/standalone/public

# 3. Copier dans le standalone les fichiers utiles au runtime Prisma
#    (le dossier prisma/ avec schema.prisma doit rester accessible)
cp -r prisma .next/standalone/prisma
```

> **Ordre et contenu attendu** dans `.next/standalone/` :
>
> ```
> .next/standalone/
> ├── server.js              # lancé par le site
> ├── public/                # images statiques + uploads
> ├── prisma/                # schema.prisma (+ data/ pour le seed si besoin)
> └── .next/
>     ├── standalone/…       # runtime
>     └── static/            # fichiers statiques du build
> ```

### Cas particulier des uploads (images produits)

Le dossier `public/uploads` contient les images **uploadées par l'admin** (produits, bannière hero).
Deux remarques importantes :

1. **`public/uploads` est ignoré par git** (voir `.gitignore`) : lors d'un redéploiement via un `rsync`
   qui écraserait `public`, ces fichiers risquent d'être perdus.
2. **Le dossier doit être persistant et accessible en écriture** par le processus Node.js.

Pour être sûr d'avoir un dossier d'upload persistant, créez-le dans le standalone et donnez-lui les bons
droits :

```bash
cd /home/[compte]/ecom
mkdir -p .next/standalone/public/uploads/{hero,products}
chmod -R u+rwX .next/standalone/public/uploads
```

> **Astuce de robustesse** : pour ne pas perdre les uploads entre deux redéploiements, envisagez de
> **sauvegarder** le dossier `public/uploads` en dehors du dossier du site (ex. `/home/[compte]/backups/uploads`)
> avec `rsync`, puis de le recopier après chaque build. Une tâche planifiée peut automatiser cela
> (voir [Étape 9](#étape-9--créer-la-tâche-planifiée-cron-retry-orders)).

---

## Étape 6 — Créer le site Node.js

Le site HTTP se crée en **Web > Sites > Ajouter un site**, puis en choisissant le type **Node.js**.

1. Allez dans **Web > Sites**.
2. Cliquez sur **Ajouter un site**.
3. Renseignez les champs suivants :

| Champ | Valeur à saisir |
| --- | --- |
| **Adresses** | `[compte].alwaysdata.net` (sous-domaine par défaut) et/ou votre domaine (voir étape 8). |
| **Type** | `Node.js` |
| **Commande** | `node /home/[compte]/ecom/.next/standalone/server.js` |
| **Répertoire de travail** | `/home/[compte]/ecom/.next/standalone` (ou `ecom/.next/standalone` selon la saisie) |
| **Version de Node.js** | `22` (recommandée) ou `20` |
| **Redémarrage à chaud** | `SIGHUP` |
| **Environnement** | toutes les variables de l'étape 7, dont notamment `HOSTNAME` et `PORT` (voir ci-dessous). |

> **Point crucial — le port d'écoute.** L'application doit écouter sur **le port fourni par alwaysdata**
> dans la configuration du site. alwaysdata expose les variables d'environnement `IP`/`HOST` et `PORT`.
>
> Le serveur standalone de Next.js lit **`PORT`** et **`HOSTNAME`** (défauts : `PORT=3000`, `HOSTNAME=0.0.0.0`).
> Il ne lit pas directement une variable `IP`. Il faut donc **mapper** `IP` vers `HOSTNAME`.
>
> Ajoutez dans le champ **Environnement** du site :
>
> ```
> HOSTNAME=$IP
> PORT=$PORT
> ```
>
> En pratique, Next.js standalone avec `HOSTNAME=0.0.0.0` écoute sur toutes les interfaces, ce qui
> convient aussi. Pour être rigoureux, définissez explicitement `PORT=$PORT` (et `HOSTNAME=$IP` si besoin).

4. Sauvegardez le site. alwaysdata démarre alors votre application.

### Vérifier le démarrage

Connectez-vous en SSH et regardez les logs du site pour confirmer que Next.js a démarré sans erreur.

---

## Étape 7 — Configurer les variables d'environnement

Les variables sont définies dans le champ **Environnement** du site (Web > Sites > votre site), au format
`NOM=valeur` (une par ligne). Vous pouvez aussi créer un fichier `.env` dans `/home/[compte]/ecom/`
que le processus Node.js lira s'il est configuré pour — mais **l'interface du site reste la méthode
fiable** car elle garantit que les variables sont fournies au processus de production.

> Pour éviter de dupliquer les valeurs entre l'interface et les commandes SSH (Prisma, seed), vous pouvez
> aussi créer un fichier `/home/[compte]/ecom/.env` avec les mêmes valeurs. Next.js le chargera au build
> et au démarrage. Le fichier **ne doit pas être versionné**.

### Tableau récapitulatif des variables

| Variable | Rôle | Obligatoire | Valeur d'exemple |
| --- | --- | :-: | --- |
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ | `postgresql://[compte]:[mdp]@postgresql-[compte].alwaysdata.net:5432/[compte]_base?schema=public` |
| `NEXTAUTH_SECRET` | Secret de chiffrement des sessions NextAuth | ✅ | (générer via openssl) |
| `NEXTAUTH_URL` | URL publique de connexion NextAuth | ✅ | `https://mon-domaine.com` |
| `ADMIN_EMAIL` | Email de l'admin créé par le seed | ✅ (seed) | `admin@ecom-dz.com` |
| `ADMIN_PASSWORD` | Mot de passe de l'admin créé par le seed | ✅ (seed) | `(mot de passe fort)` |
| `META_PIXEL_ID` | Identifiant du pixel Meta/Facebook | (si tracking) | `1234567890` |
| `META_ACCESS_TOKEN` | Jeton d'accès Meta | (si tracking) | (secret) |
| `TIKTOK_PIXEL_CODE` | Code du pixel TikTok | (si tracking) | `ABCDEF123` |
| `TIKTOK_ACCESS_TOKEN` | Jeton d'accès TikTok | (si tracking) | (secret) |
| `ENCRYPTION_KEY` | Clé AES-256 pour chiffrer les jetons pixels | ✅ | (générer via openssl) |
| `UPLOAD_DIR` | Dossier des uploads | (défaut) | `./public/uploads` |
| `MAX_FILE_SIZE` | Taille max d'upload en octets | (défaut) | `5242880` (5 Mo) |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application (côté navigateur) | ✅ | `https://mon-domaine.com` |
| `NEXT_PUBLIC_APP_NAME` | Nom public de l'application | (optionnel) | `E-Commerce DZ` |
| `PORT` | Port d'écoute (fourni par alwaysdata) | ✅ | `$PORT` (auto) |
| `HOSTNAME` | Interface d'écoute | ✅ | `$IP` (auto) |
| `NODE_ENV` | Mode de production | ✅ | `production` |

### Générer les secrets (sur votre machine locale)

Ne mettez **jamais** de secret en dur dans le guide ni dans le code. Générez-les avec `openssl` :

```bash
# Secret NextAuth (32 octets en base64) :
openssl rand -base64 32

# Clé de chiffrement AES-256 (32 octets en hexadécimal) :
openssl rand -hex 32

# Mot de passe de l'admin / administrateurs :
# utilisez un générateur de mots de passe fort
```

### Exemple complet du champ Environnement

```
NODE_ENV=production
DATABASE_URL=postgresql://[compte]:MotDePasse@postgresql-[compte].alwaysdata.net:5432/[compte]_base?schema=public
NEXTAUTH_SECRET=<sortie de openssl rand -base64 32>
NEXTAUTH_URL=https://mon-domaine.com
ADMIN_EMAIL=admin@ecom-dz.com
ADMIN_PASSWORD=<mot de passe fort>
META_PIXEL_ID=
META_ACCESS_TOKEN=
TIKTOK_PIXEL_CODE=
TIKTOK_ACCESS_TOKEN=
ENCRYPTION_KEY=<sortie de openssl rand -hex 32>
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
NEXT_PUBLIC_APP_URL=https://mon-domaine.com
NEXT_PUBLIC_APP_NAME=E-Commerce DZ
```

> Après avoir modifié les variables d'env d'un site, **redémarrez** le site (voir Étape 10).

---

## Étape 8 — Configurer le domaine et le SSL (optionnel mais recommandé)

Un sous-domaine gratuit `[compte].alwaysdata.net` fonctionne dès la création du site. Pour utiliser votre
propre domaine :

1. **Déclarez le domaine** dans **Domaines > Domaines** (ajoutez le domaine, puis liez-le à votre site).
2. **Modifiez le site (Web > Sites > votre site)** pour ajouter votre domaine dans **Adresses**.
3. **Configurer les DNS** : chez votre registrar, pointez le domaine vers alwaysdata (A / CNAME selon
   la configuration ; consultez la doc alwaysdata sur les DNS).
4. **Activer le SSL (Let's Encrypt)** :
   - Allez dans la configuration du site, section **SSL/TLS**.
   - activez **Let's Encrypt** (certificat gratuit, renouvelé automatiquement par alwaysdata).
   - Dans l'onglet **Redirections**, redirigez idéalement `http://` → `https://`.

> Pensez à mettre à jour **`NEXTAUTH_URL`** et **`NEXT_PUBLIC_APP_URL`** avec le domaine HTTPS final
> (`https://mon-domaine.com`) dans les variables d'environnement, puis à **rebuilder** et **redémarrer**.

---

## Étape 9 — Créer la tâche planifiée (cron retry-orders)

alwaysdata fournit un planificateur de tâches (équivalent `crontab`) dans **Avancé > Tâches planifiées**.

1. Dans l'administration, allez dans **Avancé > Tâches planifiées**.
2. Cliquez sur **Ajouter une tâche planifiée**.
3. Renseignez le champ **Commande** avec un appel HTTP vers la route cron du projet :

```bash
curl -X POST https://[domaine]/api/cron/retry-orders
```

   Exemple avec le sous-domaine par défaut :

```bash
curl -X POST https://moncompte.alwaysdata.net/api/cron/retry-orders
```

4. Définissez la **fréquence** (équivalent cron). Par exemple, toutes les 5 minutes :

```
*/5 * * * *
```

   (ou choisissez un intervalle dans l'interface si elle offre des préréglages).

> Les logs des tâches planifiées se trouvent dans `/home/[compte]/admin/logs/jobs/`.

> **Remarque** : le script `cron:retry-orders` du `package.json` ne fait que ce `curl` en local
> (`localhost:3000`). Sur toujoursdata, le site écoute sur un port interne aléatoire, **pas** sur
> un port public stable. Il est donc plus fiable d'appeler l'URL **publique** de votre site
> (`https://[domaine]/api/cron/retry-orders`) dans la tâche planifiée.

---

## Étape 10 — Vérifications finales

### 10.1 — Redémarrer le site

Après un build ou une modification des variables, redémarrez le site dans **Web > Sites** (bouton
redémarrer/relancer).

### 10.2 — Tester le site depuis le navigateur

- Ouvrez `https://[compte].alwaysdata.net` (ou votre domaine).
- Vérifiez :
  - la page d'accueil (catalogue) se charge ;
  - les images produits s'affichent (`/uploads/products/...`) ;
  - le panier et la commande fonctionnent ;
  - l'admin se connecte sur `/admin` avec l'admin créé par le seed (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### 10.3 — Consulter les logs

- **Logs du site** : dans **Web > Sites** (onglet logs), ou en SSH dans `/home/[compte]/admin/logs/sites/`.
- **Logs des tâches** : `/home/[compte]/admin/logs/jobs/`.

Exemple de commande en SSH pour suivre les logs du site :

```bash
ssh [compte]@ssh-[compte].alwaysdata.net
tail -f /home/[compte]/admin/logs/sites/*.log
```

### 10.4 — Vérifier la base de données

Dans **Bases de données > phpPgAdmin**, vérifiez que les tables (`users`, `products`, `orders`, …) ont
été créées et que les données du seed (admin, wilayas, communes) sont présentes.

---

## Dépannage

### Le site ne répond pas / erreur 502

- **Le port d'écoute est faux.** Vérifiez que l'application écoute sur le `PORT` fourni par alwaysdata.
  Dans l'environnement du site, définissez `PORT=$PORT`. En cas de doute, regardez les logs du site.
- Vérifiez que la **commande** du site pointe bien vers `server.js` existant :
  `ls -la /home/[compte]/ecom/.next/standalone/server.js`.
- Assurez-vous que le **répertoire de travail** du site est correct.

### Erreur "EDB" / échec Prisma "P1001" (impossible de joindre la base)

- Vérifiez `DATABASE_URL` : serveur `postgresql-[compte].alwaysdata.net`, port `5432`, base `[compte]_base`,
  et le `?schema=public`.
- Vérifiez que la base a bien été créée à l'étape 1.
- Si vous utilisez un `.env`, assurez-vous qu'il est lu par le processus (nom exact `.env`, dans
  `/home/[compte]/ecom/`).

### Où sont les logs ? Rien ne s'affiche

- Logs du site : `Web > Sites` (onglet logs) ou `/home/[compte]/admin/logs/sites/`.
- Prisma/Next écrivent aussi sur `stdout` du processus Node.js (capturé dans les logs du site).
- Logs des tâches planifiées : `/home/[compte]/admin/logs/jobs/`.

### Les images uploadées disparaissent / 403 sur les uploads

- `public/uploads/` est **ignoré par git** ; il n'est **pas** copié par un nouveau `rsync` qui exclut
  l'ancien `public`. Sauvegardez-le et recopiez-le après chaque build (voir Étape 5).
- Vérifiez les **droits** sur `.next/standalone/public/uploads` :
  ```bash
  chmod -R u+rwX /home/[compte]/ecom/.next/standalone/public/uploads
  ```
- Vérifiez que le dossier `public/uploads` a bien été copié dans le standalone
  (`.next/standalone/public/uploads`).

### Erreur de compilation / "sharp" ne s'installe pas

- Sur alwaysdata, `sharp` tente d'utiliser des binaires précompilés compatibles Linux. Vérifiez la
  version de Node.js utilisée (22 recommandée).
- Si la compilation échoue, assurez-vous d'exécuter `npm ci` dans `/home/[compte]/ecom` avec la bonne
  `NODEJS_VERSION`, puis relancez `npm run build`.

### Le site utilise la mauvaise version de Node / commande "nodejs" introuvable

- Utilisez **`node`** (jamais `nodejs`) sur alwaysdata.
- Forcez la version avec `NODEJS_VERSION` (ex. `export NODEJS_VERSION=22`) ou définissez la version
  par défaut dans **Environnement > Node.js**.

### La tâche planifiée ne s'exécute pas

- Vérifiez que l'URL publique appelée par `curl` est correcte et que le `POST /api/cron/retry-orders`
  répond (testez-la à la main dans le navigateur/curl).
- Consultez les logs des tâches : `/home/[compte]/admin/logs/jobs/`.

### Docker est-il possible ?

- **Non sur l'hébergement mutualisé / Cloud Public.** Docker n'existe que sur l'offre **Cloud Privé**.
  Sur le mutualisé, on déploie le build standalone comme décrit dans ce guide. Le `Dockerfile` et le
  `docker-compose.yml` du projet ne sont utilisés que pour le développement local ou une future migration
  vers Cloud Privé.

### Le "Marketplace Next.js" d'alwaysdata ne convient pas ?

- En effet. Le marketplace crée un **projet Next.js vierge**. Il ne permet pas d'importer ce projet
  existant avec Prisma/NextAuth/etc. Ce guide couvre le déploiement **à la main** de votre code.

---

## Récapitulatif des chemins et valeurs clés

| Élément | Valeur |
| --- | --- |
| Compte alwaysdata | `[compte]` |
| Répertoire du projet | `/home/[compte]/ecom` |
| Standalone | `/home/[compte]/ecom/.next/standalone` |
| Commande du site | `node /home/[compte]/ecom/.next/standalone/server.js` |
| Serveur PostgreSQL | `postgresql-[compte].alwaysdata.net:5432` |
| Base de données | `[compte]_base` |
| SSH | `ssh-[compte].alwaysdata.net:22` |
| Logs sites | `/home/[compte]/admin/logs/sites/` |
| Logs tâches | `/home/[compte]/admin/logs/jobs/` |

---

*Documentation du projet e-commerce — déploiement sur alwaysdata. Toute référence à `[compte]` doit être
remplacée par le nom réel de votre compte alwaysdata.*
