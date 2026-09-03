/**
 * Utilitaires de hashage SHA-256 pour les données utilisateur
 * envoyées aux providers de tracking (Meta CAPI, TikTok, Google Ads).
 *
 * Meta CAPI exige que les champs `em` (email) et `ph` (phone)
 * soient hashés en SHA-256 lowercase avant envoi.
 * Google Enhanced Conversions utilise le même format.
 *
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/clever-matching
 * https://developers.google.com/google-ads/api/docs/conversions/enhanced-conversions
 */

import { createHash } from "crypto";

/**
 * Hash une chaîne en SHA-256 hex lowercase.
 * Meta et Google exigent le format lowercase hex.
 */
export function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Normalise un email : trim + lowercase, puis hash SHA-256.
 * Retourne undefined si l'entrée est vide.
 */
export function hashEmail(email: string | undefined | null): string | undefined {
  if (!email || !email.trim()) return undefined;
  return sha256(email.trim().toLowerCase());
}

/**
 * Normalise un numéro de téléphone (supprime espaces, tirets, points, +)
 * puis hash SHA-256. Meta accepte le format E.164 sans le '+'.
 * Retourne undefined si l'entrée est vide.
 */
export function hashPhone(phone: string | undefined | null): string | undefined {
  if (!phone || !phone.trim()) return undefined;
  const cleaned = phone.replace(/[\s\-\.+]/g, "").trim();
  return sha256(cleaned);
}

/**
 * Formate les données utilisateur pour Meta CAPI user_data.
 * Les champs `em` et `ph` sont envoyés comme tableaux de valeurs hashées.
 */
export function metaUserData(data: {
  externalId?: string;
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
}) {
  return {
    external_id: data.externalId,
    em: data.email ? [hashEmail(data.email)] : undefined,
    ph: data.phone ? [hashPhone(data.phone)] : undefined,
    client_ip_address: data.ip,
    client_user_agent: data.userAgent,
  };
}

/**
 * Formate les données utilisateur pour Google Ads Enhanced Conversions.
 */
export function googleUserData(email?: string, phone?: string) {
  const identifiers: Array<{ hashed_email?: string; hashed_phone_number?: string }> = [];
  const hashedEmail = hashEmail(email);
  const hashedPhone = hashPhone(phone);

  if (hashedEmail || hashedPhone) {
    identifiers.push({
      hashed_email: hashedEmail || undefined,
      hashed_phone_number: hashedPhone || undefined,
    });
  }

  return identifiers;
}
