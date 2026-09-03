import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invalidateStoreSettingsCache } from "@/lib/getStoreSettings";

// ============================================
// Connexions transporteurs (dzship) stockées dans la Setting `delivery_providers`
// (table `settings`, clé JSON — aucune migration Prisma nécessaire)
// ============================================

export interface DeliveryConnection {
  code: string;
  name: string;
  platform: string;
  credentials: Record<string, string>;
  baseUrl?: string;
  fromWilaya?: number;
  isActive: boolean;
  createdAt: string;
}

const SETTINGS_KEY = "delivery_providers";

// ============================================
// Chiffrement AES-256-GCM des credentials au repos.
// Clé via CREDENTIALS_ENCRYPTION_KEY (32 octets, hex ou base64).
// Si la clé est absente/invalide : stockage en clair (comportement legacy)
// avec un warning — on ne casse pas le fonctionnement.
// ============================================

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
let warnedMissingKey = false;

/** Retourne la clé de chiffrement (Buffer 32 octets) ou null si absente/invalide. */
function getEncryptionKey(): Buffer | null {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    if (!warnedMissingKey) {
      console.warn(
        "[delivery/connections] CREDENTIALS_ENCRYPTION_KEY absente : les credentials transporteurs sont stockés en clair. Générez une clé avec `openssl rand -hex 32`."
      );
      warnedMissingKey = true;
    }
    return null;
  }

  // Accepte une clé hexadécimale (64 chars) ou base64 (44 chars) → 32 octets
  const hex = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : null;
  if (hex) return hex;

  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;

  console.warn(
    "[delivery/connections] CREDENTIALS_ENCRYPTION_KEY invalide (attendu : 32 octets en hex ou base64) : stockage en clair."
  );
  return null;
}

/** Chiffre l'objet credentials → `{ iv, tag, data }` en base64. Sans clé : inchangé. */
function encryptCredentials(credentials: Record<string, string>): Record<string, string> {
  const key = getEncryptionKey();
  if (!key) return credentials;

  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);

  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
}

/** Déchiffre `{ iv, tag, data }` → objet credentials. Données legacy en clair : inchangées. */
function decryptCredentials(credentials: Record<string, string>): Record<string, string> {
  const key = getEncryptionKey();
  if (!key) return credentials;

  // Objet non chiffré (legacy stocké en clair) : on le laisse tel quel
  if (!credentials.iv || !credentials.tag || !credentials.data) return credentials;

  try {
    const decipher = createDecipheriv(
      ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(credentials.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(credentials.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(credentials.data, "base64")),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8")) as Record<string, string>;
  } catch (error) {
    console.error("[delivery/connections] Erreur déchiffrement des credentials:", error);
    return credentials;
  }
}

export async function getConnections(): Promise<DeliveryConnection[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTINGS_KEY },
  });

  if (!setting?.value || !Array.isArray(setting.value)) return [];

  // Déchiffrement en mémoire : les routes API reçoivent les credentials en clair
  // (puis les masquent pour la réponse via maskCredentials).
  return (setting.value as unknown as DeliveryConnection[]).map((conn) => ({
    ...conn,
    credentials: decryptCredentials(conn.credentials),
  }));
}

export async function saveConnection(conn: DeliveryConnection): Promise<void> {
  const current = await getConnections();
  const index = current.findIndex((c) => c.code === conn.code);

  if (index >= 0) {
    current[index] = conn;
  } else {
    current.push(conn);
  }

  await writeConnections(current);
}

export async function removeConnection(code: string): Promise<void> {
  const current = await getConnections();
  await writeConnections(current.filter((c) => c.code !== code));
}

async function writeConnections(connections: DeliveryConnection[]): Promise<void> {
  // Chiffrement au repos : seuls les credentials sont chiffrés, le reste de la
  // connexion (code, name, platform, baseUrl, fromWilaya, isActive, createdAt)
  // reste lisible pour l'administration.
  const encrypted = connections.map((conn) => ({
    ...conn,
    credentials: encryptCredentials(conn.credentials),
  }));

  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: encrypted as unknown as Prisma.InputJsonValue },
    create: { key: SETTINGS_KEY, value: encrypted as unknown as Prisma.InputJsonValue },
  });

  // Même convention que src/app/api/settings/route.ts : invalider le cache après écriture
  invalidateStoreSettingsCache();
}

/**
 * Helper pur : masque les valeurs des credentials (les clés sont conservées
 * pour que le frontend sache quels champs existent, jamais les secrets).
 */
export function maskCredentials(conn: DeliveryConnection): DeliveryConnection {
  const masked: Record<string, string> = {};
  for (const key of Object.keys(conn.credentials)) {
    masked[key] = "••••••••";
  }
  return { ...conn, credentials: masked };
}
