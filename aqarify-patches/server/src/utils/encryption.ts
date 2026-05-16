/**
 * T3-G — Encryption Key Rotation
 *
 * Reads ENCRYPTION_KEYS=v1:key1,v2:key2 (or legacy ENCRYPTION_KEY).
 * Encrypts with the highest-numbered version; decrypts by reading the version
 * prefix from the stored ciphertext.  v1 credentials remain decryptable after
 * a rotation to v2 — no downtime, no data migration required.
 *
 * This module re-exports the full encrypt/decrypt API so callers don't change.
 * The underlying logic already lives in utils/hmac.ts; this file just re-exports
 * and adds the batch rotation script helper used by scripts/rotate-encryption-keys.ts.
 */

export {
  encrypt,
  decrypt,
  parseEncryptionKeyVersions,
  latestEncryptionKeyVersion,
} from "./hmac";

/**
 * Re-encrypt a stored ciphertext from any previous key version to the current
 * latest version.  Safe to call in a loop during key rotation.
 *
 * Usage in rotate-encryption-keys.ts:
 *   const newCipher = await rotateCredential(oldCipher);
 *   await supabaseAdmin.from('tenants').update({ paymob_api_key_enc: newCipher }).eq('id', id);
 */
import { encrypt, decrypt, latestEncryptionKeyVersion } from "./hmac";

export function rotateCredential(oldCipher: string): string {
  const { label: currentLabel } = latestEncryptionKeyVersion();

  // If already encrypted with the current version, skip
  if (oldCipher.startsWith(`${currentLabel}:`)) return oldCipher;

  const plaintext = decrypt(oldCipher);
  return encrypt(plaintext);
}
