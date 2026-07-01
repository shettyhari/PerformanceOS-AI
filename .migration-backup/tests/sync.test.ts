import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../lib/crypto";

describe("PerformanceOS Cryptography Vault", () => {
  it("should encrypt and decrypt strings successfully", () => {
    const secret = "test_windsor_api_key_123456";
    const cipher = encrypt(secret);
    
    expect(cipher).not.toBe(secret);
    expect(cipher.split(":").length).toBe(3); // iv:tag:content
    
    const decrypted = decrypt(cipher);
    expect(decrypted).toBe(secret);
  });

  it("should fail on tampered cypher content decryption", () => {
    const secret = "another_secret";
    const cipher = encrypt(secret);
    const tampered = cipher + "a";
    
    expect(() => decrypt(tampered)).toThrow();
  });
});
