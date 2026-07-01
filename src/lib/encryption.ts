import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '@/lib/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

export interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function encryptJson<T extends Record<string, unknown>>(
  data: T,
): EncryptedPayload {
  return encrypt(JSON.stringify(data));
}

export function decryptJson<T extends Record<string, unknown>>(
  payload: EncryptedPayload,
): T {
  return JSON.parse(decrypt(payload)) as T;
}
