import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  RescueCipher,
  getMXEPublicKey,
  x25519,
} from "@arcium-hq/client";

let cachedMXEPublicKey: Uint8Array | null = null;

// Snapshot from `arcium mxe-info EG3AAsGKNCR8x6dLYu5KjrhdegxgQEQJD3R1NWf1FQk4`.
// Used as a fallback when getMXEPublicKey() fails to deserialize the on-chain
// MXE account (older account format vs newer client deserializer).
const MXE_X25519_PUBKEY_FALLBACK = new Uint8Array([
  239, 182, 83, 118, 82, 182, 72, 171, 201, 63, 145, 2, 222, 205, 35, 9,
  135, 216, 41, 158, 122, 71, 198, 246, 134, 164, 2, 229, 253, 164, 190, 12,
]);

export async function fetchMXEPublicKey(
  provider: AnchorProvider,
  programId: PublicKey,
  retries = 6,
  retryDelayMs = 400,
): Promise<Uint8Array> {
  if (cachedMXEPublicKey) return cachedMXEPublicKey;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const k = await getMXEPublicKey(provider, programId);
      if (k) {
        cachedMXEPublicKey = k;
        return k;
      }
    } catch (e) {
      if (attempt === retries) {
        console.warn("[fetchMXEPublicKey] all retries failed, using snapshot fallback:", e);
      }
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  cachedMXEPublicKey = MXE_X25519_PUBKEY_FALLBACK;
  return MXE_X25519_PUBKEY_FALLBACK;
}

export interface EncryptedGuess {
  ciphertexts: Uint8Array[];
  publicKey: Uint8Array;
  nonce: Uint8Array;
}

// Each u8 is encrypted as a separate ciphertext to match the Arcis circuit input.
export function encryptGuess(
  symbols: number[],
  mxePublicKey: Uint8Array,
): EncryptedGuess {
  if (symbols.length !== 4) throw new Error("guess must have 4 symbols");

  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);

  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const plaintext = symbols.map((s) => BigInt(s));
  const ciphertexts = cipher.encrypt(plaintext, nonce);

  return {
    ciphertexts: ciphertexts.map((c) => new Uint8Array(c)),
    publicKey,
    nonce,
  };
}

export function nonceToBnDecimal(nonce: Uint8Array): string {
  let n = 0n;
  for (let i = nonce.length - 1; i >= 0; i--) {
    n = (n << 8n) | BigInt(nonce[i]);
  }
  return n.toString();
}
