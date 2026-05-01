import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  RescueCipher,
  getMXEPublicKey,
  x25519,
} from "@arcium-hq/client";

let cachedMXEPublicKey: Uint8Array | null = null;

export async function fetchMXEPublicKey(
  provider: AnchorProvider,
  programId: PublicKey,
  retries = 20,
  retryDelayMs = 500,
): Promise<Uint8Array> {
  if (cachedMXEPublicKey) return cachedMXEPublicKey;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const k = await getMXEPublicKey(provider, programId);
      if (k) {
        cachedMXEPublicKey = k;
        return k;
      }
    } catch {
      // ignore
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  throw new Error("Failed to fetch MXE public key");
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
