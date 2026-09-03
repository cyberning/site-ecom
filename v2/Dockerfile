# =============================================================================
# eCom DZ v2 — Dockerfile multi-stage optimisé pour VPS contraint
# (1 GB disque / 250 MB RAM)
#
# Stratégie :
#   - Stage "build"  : installe toutes les deps, génère le client Prisma,
#                      compile l'app Next.js en mode standalone.
#   - Stage "runtime": image minimale node:22-alpine. On y installe les deps
#                      de PRODUCTION uniquement (--omit=dev) afin de disposer
#                      de la CLI `prisma` et de `tsx` (nécessaires pour
#                      `db push` et `db seed` au démarrage), puis on copie le
#                      build standalone par-dessus.
#
# Pourquoi `npm ci --omit=dev` dans le runtime ?
#   Le build standalone de Next.js ne copie QUE les modules tracés par le
#   bundler. La CLI `prisma` et `tsx` ne sont pas importées par le code de
#   l'app (elles ne servent qu'aux scripts db:push / db:seed), donc elles ne
#   sont PAS présentes dans .next/standalone. On les installe donc via
#   `npm ci --omit=dev` (elles sont déclarées en "dependencies" de
#   production). Le standalone est ensuite copié PAR-DESSUS : il écrase les
#   modules tracés (next, react, ...) par les mêmes versions, sans conflit.
#
# Le client Prisma généré (node_modules/.prisma) n'est pas non plus copié par
# le standalone : on le copie manuellement depuis le stage build.
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1 : BUILD
# -----------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Copie des manifests de dépendances d'abord (cache Docker optimisé)
COPY package.json package-lock.json ./

# Installation de TOUTES les deps (dev incluses) pour pouvoir builder
RUN npm ci

# Copie du reste du projet
COPY . .

# Génération du client Prisma (postinstall le fait déjà, mais on le force
# pour être explicite et robuste)
RUN npx prisma generate

# Build Next.js en mode standalone
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 2 : RUNTIME
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 1) Installation des deps de PRODUCTION uniquement.
#    Contient : prisma (CLI), tsx, bcryptjs, @prisma/client, next, react, ...
#    NB : --ignore-scripts pour ne PAS relancer `prisma generate` ici (le
#    postinstall aurait besoin de prisma/schema.prisma, copié plus bas, et le
#    client est déjà copié depuis le stage build à l'étape 5).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# 2) Copie du build standalone PAR-DESSUS (écrase les modules tracés).
#    .next/standalone contient server.js + node_modules tracés.
COPY --from=build /app/.next/standalone ./

# 3) Assets statiques (servis par le serveur standalone)
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# 4) Prisma : schéma + seed + données (data/wilayas-communes.json)
#    Le standalone ne copie PAS prisma/ — on le copie manuellement.
COPY --from=build /app/prisma ./prisma

# 5) Client Prisma généré (node_modules/.prisma) — non copié par le standalone.
#    On le copie depuis le build pour garantir la bonne plateforme (alpine).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# 6) Script d'entrée (db push + db seed + next start)
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# Utilisateur non-root (sécurité)
USER node

EXPOSE 3000

# Le script d'entrée exécute : prisma db push -> prisma db seed -> node server.js
CMD ["sh", "./scripts/start.sh"]
