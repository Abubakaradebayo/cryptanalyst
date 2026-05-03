# Cryptanalyst — Quick Reference

One-page summary of the live deployment. Share this when anyone asks for project details.

## Pitch

A daily 4-symbol code-breaking puzzle on Solana, powered by Arcium MPC. The answer is generated inside the MPC cluster and is mathematically inaccessible to anyone — developers included — until a player solves it on chain.

> Wordle, but provably fair via MPC.

## Submission target

Arcium RTG **Hidden-Information Games** challenge.

## Tech stack

- **Smart contract**: Rust + Anchor 0.32.1 + arcium-anchor 0.9.6 + arcis 0.9.6
- **Frontend**: Next.js 15 + TypeScript + Tailwind 4
- **Wallet**: Solana wallet adapter (Phantom, Solflare)
- **Encryption**: x25519 ECDH + Rescue cipher (via `@arcium-hq/client@0.9.6`)
- **MPC backend**: Arcium Cerberus on devnet cluster 456

## Live deployment (Solana devnet)

| Component | Address |
| --- | --- |
| **Program ID** | `EG3AAsGKNCR8x6dLYu5KjrhdegxgQEQJD3R1NWf1FQk4` |
| **MXE account** | `6ym4Tr9NcVkMMAstdcgH9WRd4R13717gB4GTq13RNStD` |
| **Arcium scheduler** | `Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ` (Arcium-owned, devnet) |
| **MPC cluster offset** | `456` (canonical Arcium devnet cluster) |
| **Authority** | `2PdA3MtKGDiYmch8tZ7eQ8a7bieUAyfrYPKGNRtyj1fQ` |

## Confidential instructions (Arcis circuits)

| Circuit | Comp def offset | Bytecode size | ACU weight |
| --- | --- | ---:| ---:|
| `gen_code_v2` | `2971492714` | 126 KB | 142M |
| `evaluate_guess_v2` | `3364063154` | 862 KB | 513M |
| `reveal_code` | `206090300` | 128 KB | 143M |

## Sample successful transactions

| Action | Tx hash |
| --- | --- |
| `InitDailyPuzzle` (CPI to Arcium) | `3kcN2vCPt73Ukx2Fnk9DiuKCdFKGwEYZdL6g9XxC6k3ACC16aBs5k5bVFYjU2g5xHKNcUK1asfjZAvcuboLAT6Uq` |
| `GenCodeV2Callback` (Arcium → us, encrypted code written) | `3EBzypKmKn7zHGWXcgxD1Bq1THnYAKVuEnrtrFXNxu8EqdA57qiZ5yWPss2GjsBQFformzFABiiGNaga9agWhRqS` |
| `EvaluateGuessV2Callback` (BLS-signed feedback) | `5ZCgEZXpv1v214cPSm5ovuMJyebo4S54xM3kS9JAtrkuRYM7juG354nSYNKVNUuEoCYQPwLjxojAd4UAPMm3bPTX` |
| `EvaluateGuessV2Callback` (alt) | `26XAurXdkfmugxNKfwoyqJuA78TGLFXLrCx9kSt6Nbwzx5Q5yjfVwsvDUxZUp2dXHip4rZmnBmhnCnkFAZDsy1Eq` |
| `EvaluateGuessV2Callback` (alt) | `2Ykbq7fNf2GycLKiWXAjLyJzBDwZN5sf52w4DbTAyaaZP6fBpxTsMNUBUwZJ3Zfx3zg8YxJFJSQRBc8QjRfkH42` |
| Program upgrade adding `guess_symbols` to PlayerAttempt | `2vuRugzgQtT1MfvsspAWKLtEJzsSGXvaFdZNsk6xtY2gqoCw29WiNjpcnrsHHoAfeE4cHD4iDwBLPo8R7abFoqD1` |

## Repo

- **GitHub**: https://github.com/Abubakaradebayo/cryptanalyst
- **License**: MIT
- **Author**: Abdulsalam Abubakar (`abubakarabdulsalam54@gmail.com`)
- **Default branch**: `main`

## Privacy property (one-line pitch)

The 128 bytes at byte offset 46 of the daily puzzle PDA are the encrypted answer. No party — not the developer, validators, the MXE authority, or any cluster node alone — can decrypt them. Only the Arcium MPC cluster can, collectively, and only when the program's `claim_solve` instruction fires after a player scores `(4, 0)`.

## Why MPC and not zk / TEE / hash / server

The Mastermind feedback function (`exact, misplaced`) is a comparison between two encrypted values. zk needs the prover to know the plaintext. TEE needs hardware trust. Hash commitments can prove non-tampering but cannot compute the feedback. Servers are trusted parties. **Only MPC can compute trustlessly over genuinely-encrypted data**, which is why Cryptanalyst's design literally cannot ship without Arcium.

## Game rules

- 4-symbol secret code drawn from 6 colors → 1296 possible codes
- 10 guesses per puzzle, per wallet
- Each guess returns `(exact, misplaced)` — same as physical Mastermind
- Solving (4 exact, 0 misplaced) reveals the code on chain + writes a `LeaderboardEntry`
- New puzzle at every UTC midnight

## Documents

- `README.md` — main readme with setup + threat model
- `PRESENTATION.md` — judge-facing pitch with architecture diagram + section-by-section breakdown
- `app/src/app/how-to-play/page.tsx` — in-app player tutorial
- `PROJECT_INFO.md` — this file
