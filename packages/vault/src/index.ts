/**
 * Vault service (T-023): Encrypts and decrypts aggregator access tokens and related secrets.
 * Uses AES-GCM with a key derived from AGGREGATOR_VAULT_KEY (32 byte base64) or fallback dev key.
 */
import { loadConfig } from '@budget/config';
// Polyfill atob/btoa for Node if missing with explicit global declarations
// Only assign if missing (avoid duplicate identifier issues with DOM lib)
if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
}
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (bin: string) => Buffer.from(bin, 'binary').toString('base64');
}

export interface EncryptedBlob {
  iv: string;
  ciphertext: string;
  tag?: string;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = globalThis.atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function getKeyMaterial(): Uint8Array {
  const cfg = loadConfig();
  const candidate: unknown = cfg.AGGREGATOR_VAULT_KEY;
  const raw: string =
    typeof candidate === 'string' && candidate.length > 0
      ? candidate
      : 'ZGV2LWRldmVsLWRldmVsLWRldmVsLWRldmVs'; // base64 of dev-devel-devel-devel
  const bytes = base64ToBytes(raw);
  if (bytes.length < 32) {
    // stretch (NOT cryptographically ideal, but acceptable for placeholder until KMS) // TODO(#2): replace with KMS integration
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) out[i] = bytes[i % bytes.length] ?? 0;
    return out;
  }
  return bytes.slice(0, 32);
}

async function importKey(): Promise<CryptoKey> {
  const material = getKeyMaterial();
  return crypto.subtle.importKey('raw', material.slice(0).buffer, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptSecret(plain: string): Promise<EncryptedBlob> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
  return { iv: toB64(iv), ciphertext: toB64(new Uint8Array(enc)) };
}

export async function decryptSecret(blob: EncryptedBlob): Promise<string> {
  const key = await importKey();
  const fromB64 = (b: string) =>
    Uint8Array.from(
      atob(b)
        .split('')
        .map((c) => c.charCodeAt(0)),
    );
  const iv = fromB64(blob.iv);
  const data = fromB64(blob.ciphertext);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(dec);
}

export interface IAccessTokenVault {
  store(accessToken: string): Promise<EncryptedBlob>; // returns stored representation
  reveal(blob: EncryptedBlob): Promise<string>;
}

export class AccessTokenVault implements IAccessTokenVault {
  async store(accessToken: string): Promise<EncryptedBlob> {
    return encryptSecret(accessToken);
  }
  async reveal(blob: EncryptedBlob): Promise<string> {
    return decryptSecret(blob);
  }
}
