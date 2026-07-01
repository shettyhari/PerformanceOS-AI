import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

// Resolve the system encryption secret. Standard fallback for dev.
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "performanceos-super-secret-key-32chars";

function getKey(): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_SECRET, "salt", ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Format: iv:authTag:encryptedContent
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption Failure:", err);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string back to plain text.
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid cipher format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];
    
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("Decryption Failure:", err);
    throw new Error("Failed to decrypt sensitive data");
  }
}
