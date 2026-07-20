import type { EncryptedCredentialBlob, HttpCredentials } from "../models/credentials.js";
import { AppError } from "../utils/errorUtils.js";

const STORAGE_KEY = "encryptedHttpCredentials";
const DEFAULT_ITERATIONS = 310000;

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of view) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export const MIN_PASSPHRASE_LENGTH = 8;

export async function encryptCredentials(
  credentials: HttpCredentials,
  passphrase: string,
  iterations = DEFAULT_ITERATIONS
): Promise<EncryptedCredentialBlob> {
  if (!passphrase) {
    throw new AppError("UNKNOWN", "マスターパスフレーズを入力してください。");
  }
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new AppError(
      "UNKNOWN",
      `マスターパスフレーズは${MIN_PASSPHRASE_LENGTH}文字以上にしてください。`
    );
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const payload = new TextEncoder().encode(JSON.stringify(credentials));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    payload
  );

  return {
    version: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    iterations
  };
}

export async function decryptCredentials(
  blob: EncryptedCredentialBlob,
  passphrase: string
): Promise<HttpCredentials> {
  try {
    const salt = fromBase64(blob.salt);
    const iv = fromBase64(blob.iv);
    const ciphertext = fromBase64(blob.ciphertext);
    const key = await deriveKey(passphrase, salt, blob.iterations);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );
    const parsed = JSON.parse(new TextDecoder().decode(plainBuffer)) as HttpCredentials;
    if (typeof parsed.username !== "string" || typeof parsed.password !== "string") {
      throw new Error("invalid payload");
    }
    return parsed;
  } catch {
    throw new AppError("DECRYPT_FAILED", "パスフレーズが違うか、認証情報を復号できません。");
  }
}

export async function saveEncryptedCredentials(blob: EncryptedCredentialBlob): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: blob });
}

export async function loadEncryptedCredentials(): Promise<EncryptedCredentialBlob | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const blob = result[STORAGE_KEY] as EncryptedCredentialBlob | undefined;
  return blob ?? null;
}

export async function clearEncryptedCredentials(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

export async function hasStoredCredentials(): Promise<boolean> {
  return (await loadEncryptedCredentials()) !== null;
}

export async function encryptAndSave(
  credentials: HttpCredentials,
  passphrase: string
): Promise<void> {
  const blob = await encryptCredentials(credentials, passphrase);
  await saveEncryptedCredentials(blob);
}

export async function unlockCredentials(passphrase: string): Promise<HttpCredentials> {
  const blob = await loadEncryptedCredentials();
  if (!blob) {
    throw new AppError("UNKNOWN", "保存された認証情報がありません。");
  }
  return decryptCredentials(blob, passphrase);
}
