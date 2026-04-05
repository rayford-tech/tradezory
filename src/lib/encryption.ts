import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = process.env.ENCRYPTION_KEY;

function getKey(): Buffer {
  if (!KEY_ENV) throw new Error("ENCRYPTION_KEY env var not set");
  const buf = Buffer.from(KEY_ENV, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  return buf;
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Pack as iv(12)|authTag(16)|ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a string previously encrypted with `encrypt`.
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
