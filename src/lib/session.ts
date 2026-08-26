import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión de admin minimalista: una sola password compartida (sin tabla de
 * usuarios) + una cookie firmada con HMAC para que no se pueda falsificar
 * a mano. Portátil entre Vercel y Node/Docker — no depende de ningún
 * proveedor, solo de `node:crypto`.
 */

export const SESSION_COOKIE_NAME = "eroom_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET no está definida (ver .env.example).");
  }
  return secret;
}

function sign(value: string): string {
  const hmac = createHmac("sha256", getSecret()).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function hasValidSignature(signed: string): boolean {
  const separatorIndex = signed.lastIndexOf(".");
  if (separatorIndex === -1) return false;
  const value = signed.slice(0, separatorIndex);
  const hmac = signed.slice(separatorIndex + 1);
  const expected = createHmac("sha256", getSecret()).update(value).digest("hex");

  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSessionCookieValue(): string {
  return sign(Date.now().toString());
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue || !hasValidSignature(cookieValue)) return false;

  const separatorIndex = cookieValue.lastIndexOf(".");
  const issuedAt = Number(cookieValue.slice(0, separatorIndex));
  const ageSeconds = (Date.now() - issuedAt) / 1000;
  return ageSeconds >= 0 && ageSeconds <= MAX_AGE_SECONDS;
}
