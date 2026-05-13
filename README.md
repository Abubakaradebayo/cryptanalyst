# Cryptanalyst

> **Wordle, but provably fair via MPC.** The daily code is generated *inside* the Arcium MPC cluster. No developer, validator, or cluster operator knows the answer. Every player worldwide gets the same puzzle, and the answer is mathematically inaccessible until someone solves it.

Submission for the Arcium RTG **Hidden-Information Games** challenge.

---

## Why this exists

Card, strategy, and social-deduction games break when hands, inventories, or positions are public. Mastermind-style code-breaking puzzles break the same way the moment the daily code touches plaintext on any server. Cryptanalyst is a **daily code-breaking puzzle** designed so the answer cannot be known by any party until a player solves it on chain.

Each day there is one secret 4-symbol code drawn from a 6-color palette (1296 possible codes). Every guess returns two integers:

- **exact**: symbols correct in the right position
- **misplaced**: symbols correct in the wrong position

The game is solo. Anyone with a Solana wallet can play immediately, no opponent required, no waiting.

---

## Why Arcium MPC is the only primitive that works here

| Approach | Problem |
| --- | --- |
| Code stored plaintext onchain | Anyone reads it from the account. Cheating is trivial. |
| Code stored on a server | Trust the server. Server can peek, bias the puzzle, manipulate. (This is how NYT Wordle works today.) |
| Hash commitment onchain | Proves the code wasn't swapped mid-game, but you **cannot compute "X exact, Y misplaced" against a hash**. The feedback mechanism is impossible. |
| zk-SNARK | Whoever generates the proof must hold the code in plaintext, so the dev or an admin sees it. Still trust required. |
| TEE (Intel SGX / AMD SEV) | Trust Intel, AMD, hardware vendors. Multiple production exploits. |
| **Arcium MPC** | **No trust point. The code is a distributed secret across MPC nodes. Math, not trust.** |

Many privacy projects could have shipped with zk or TEEs. Cryptanalyst cannot. The Mastermind-style feedback function (`exact, misplaced`) is a comparison between two encrypted values, which only MPC can compute trustlessly.

---

## Live deployment status

End-to-end working on Solana devnet. Live frontend, real on-chain transactions, real MPC computations, real callbacks landing.

| Component | Status | Address / proof |
| --- | --- | --- |
| Anchor program (`arcium-anchor 0.9.6`) | Deployed | [`EG3AAsGKNCR8x6dLYu5KjrhdegxgQEQJD3R1NWf1FQk4`](https://explorer.solana.com/address/EG3AAsGKNCR8x6dLYu5KjrhdegxgQEQJD3R1NWf1FQk4?cluster=devnet) |
| MXE account | Active, all keys set | [`6ym4Tr9NcVkMMAstdcgH9WRd4R13717gB4GTq13RNStD`](https://explorer.solana.com/address/6ym4Tr9NcVkMMAstdcgH9WRd4R13717gB4GTq13RNStD?cluster=devnet) |
| MPC cluster | Devnet cluster `456` | Active |
| `gen_code_v2` comp_def | Live | offset `2971492714` |
| `evaluate_guess_v2` comp_def | Live | offset `3364063154` |
| `reveal_code` comp_def | Live | offset `206090300` |
| Frontend | Public | [https://cryptanalyst.vercel.app](https://cryptanalyst.vercel.app) |

### Notable transactions (verifiable on Solana Explorer)

| Action | Tx hash |
| --- | --- |
| `InitDailyPuzzle` (CPI to Arcium scheduler) | [`3kcN2vCPt73Ukx2Fnk9DiuKCdFKGwEYZdL6g9XxC6k3ACC16aBs5k5bVFYjU2g5xHKNcUK1asfjZAvcuboLAT6Uq`](https://explorer.solana.com/tx/3kcN2vCPt73Ukx2Fnk9DiuKCdFKGwEYZdL6g9XxC6k3ACC16aBs5k5bVFYjU2g5xHKNcUK1asfjZAvcuboLAT6Uq?cluster=devnet) |
| `GenCodeV2Callback` (encrypted code written) | [`3EBzypKmKn7zHGWXcgxD1Bq1THnYAKVuEnrtrFXNxu8EqdA57qiZ5yWPss2GjsBQFformzFABiiGNaga9agWhRqS`](https://explorer.solana.com/tx/3EBzypKmKn7zHGWXcgxD1Bq1THnYAKVuEnrtrFXNxu8EqdA57qiZ5yWPss2GjsBQFformzFABiiGNaga9agWhRqS?cluster=devnet) |
| `SubmitGuess` (CPI: encrypted guess → Arcium) | [`3c7Qrp5X3VtFgQMqycPZHSjYtHxZfEm3VDr3qujK3m8D6JPNd987sELypXYCh2JvEmrE6M7Efbmxn6spPpmNwmX6`](https://explorer.solana.com/tx/3c7Qrp5X3VtFgQMqycPZHSjYtHxZfEm3VDr3qujK3m8D6JPNd987sELypXYCh2JvEmrE6M7Efbmxn6spPpmNwmX6?cluster=devnet) |
| `EvaluateGuessV2Callback` (BLS-signed feedback) | [`5ZCgEZXpv1v214cPSm5ovuMJyebo4S54xM3kS9JAtrkuRYM7juG354nSYNKVNUuEoCYQPwLjxojAd4UAPMm3bPTX`](https://explorer.solana.com/tx/5ZCgEZXpv1v214cPSm5ovuMJyebo4S54xM3kS9JAtrkuRYM7juG354nSYNKVNUuEoCYQPwLjxojAd4UAPMm3bPTX?cluster=devnet) |
| Program upgrade (added on-chain plaintext guess) | [`2vuRugzgQtT1MfvsspAWKLtEJzsSGXvaFdZNsk6xtY2gqoCw29WiNjpcnrsHHoAfeE4cHD4iDwBLPo8R7abFoqD1`](https://explorer.solana.com/tx/2vuRugzgQtT1MfvsspAWKLtEJzsSGXvaFdZNsk6xtY2gqoCw29WiNjpcnrsHHoAfeE4cHD4iDwBLPo8R7abFoqD1?cluster=devnet) |

Every claim in this README is verifiable on chain by any RPC client without our cooperation.

---

## How it works (end to end)

```
┌──────────────┐    encrypted guess (x25519+Rescue)    ┌──────────────────────┐
│  Frontend    │  ───────────────────────────────────► │  Anchor program      │
│  Next.js +   │                                       │  cryptanalyst        │
│  Phantom     │  ◄─────────────────────────────────── │  (#[arcium_program]) │
│              │       feedback: (exact, misplaced)    └──────────┬───────────┘
└──────────────┘                                                  │ CPI: queue_computation
                                                                  ▼
                                                       ┌──────────────────────┐
                                                       │  MPC Cluster         │
                                                       │  (Cerberus backend)  │
                                                       │  runs Arcis circuits │
                                                       └──────────────────────┘
```


Three encrypted instructions live in `encrypted-ixs/src/lib.rs`:

```rust
#[instruction]
pub fn gen_code() -> Enc<Mxe, DailyCode> {
    // 4 symbols, each in 0..6, generated by ArcisRNG::gen_integer_in_range
    // (rejection sampling, bias-free).
    // Result is encrypted to the MXE itself. Nobody sees plaintext.
}

#[instruction]
pub fn evaluate_guess(
    guess_ctxt: Enc<Shared, GuessInput>,   // encrypted to (player ⇋ cluster)
    code_ctxt:  Enc<Mxe, DailyCode>,       // persistent encrypted state
) -> Feedback {
    // Constant-time double-loop counts exact + misplaced matches
    // (no data-dependent indexing, an Arcis constraint).
    // Returns ONLY the two small public integers.
}

#[instruction]
pub fn reveal_code(code_ctxt: Enc<Mxe, DailyCode>) -> [u8; 4] {
    // Called only after a player has scored (4, 0).
    // Reveals the code so late solvers can verify the answer.
}
```

The Solana program (`programs/cryptanalyst/`) orchestrates the lifecycle through nine instructions, four PDAs, three events, and a small error enum:

| Instruction | What happens |
| --- | --- |
| `init_*_comp_def` (×3) | One-time setup per deployment for each of the three circuits. |
| `init_daily_puzzle(date)` | Anyone can call once per day. Queues `gen_code`. First caller creates the puzzle. |
| `submit_guess(date, attempt_idx, ciphertexts, pubkey, nonce)` | Encrypts a guess client-side; queues `evaluate_guess` against the stored encrypted code. |
| `claim_solve(date, attempt_idx)` | Verifies the named attempt scored `(4, 0)`; queues `reveal_code` and writes a `LeaderboardEntry`. |
| `*_callback` (×3) | `#[arcium_callback]` handlers that receive `SignedComputationOutputs<T>` from the cluster. |

PDAs:

- `DailyPuzzle  { bump, date, state, created_at, attempt_count, solved_count, state_nonce, encrypted_code: [[u8;32];4] }`
- `PlayerAttempt { bump, player, date, attempt_idx, computation_offset, exact, misplaced, finalized, submitted_at }`
- `LeaderboardEntry { bump, date, player, guesses_taken, time_to_solve_secs, solved_at }`
- `RevealedCode { bump, date, symbols: [u8;4], revealed_at }`

---

## What the player actually experiences

1. Connect Phantom / Solflare wallet.
2. If today's puzzle isn't initialized, click **Initialize today's puzzle**. Anyone in the world can do this, and the cluster generates a fresh secret.
3. Pick four symbols from the 6-color palette and click **Submit guess**. The browser:
   - Performs an x25519 ECDH handshake with the MXE cluster's public key.
   - Encrypts the guess under the Rescue cipher with a random 16-byte nonce.
   - Signs and submits a Solana transaction that queues `evaluate_guess` against the stored encrypted code.
4. The cluster computes `(exact, misplaced)` over both ciphertexts without decrypting the code. Result lands on chain via the callback.
5. The UI renders the feedback as Mastermind-style pegs (green = exact, purple = misplaced). Repeat up to 10 guesses.
6. On `(4, 0)` the contract automatically queues `reveal_code`. The cluster decrypts, the answer becomes public, and a `LeaderboardEntry` is written.

---

## Repository layout

```
cryptanalyst/
├── encrypted-ixs/         # Arcis circuits (Rust, compiled to .arcis)
│   └── src/lib.rs         # gen_code, evaluate_guess, reveal_code
├── programs/cryptanalyst/ # Anchor program (Rust)
│   └── src/lib.rs         # 9 instructions, 4 PDAs, events, errors
├── tests/cryptanalyst.ts  # E2E test: init compdefs → init puzzle → guess → assert valid
├── app/                   # Next.js 15 frontend
│   ├── src/app/page.tsx           # main puzzle page
│   ├── src/app/leaderboard/page.tsx
│   ├── src/components/   # PuzzleCard, GuessBoard, ColorPicker, FeedbackPegs, …
│   ├── src/hooks/        # usePuzzle, useAttempts, useGameActions
│   └── src/lib/
│       ├── arcium.ts     # x25519 + Rescue cipher wrapper
│       ├── anchor.ts     # Anchor program client
│       └── pdas.ts       # PDA derivation
├── Anchor.toml
├── Arcium.toml
└── Cargo.toml             # workspace
```

---

## Setup & run

### Prerequisites

- Rust toolchain (host: 1.85+; Solana platform-tools v1.48 is fine for SBF)
- Solana CLI 2.3+
- Anchor 0.32.1
- `arcup` Arcium version manager
- Docker (for localnet)
- Node 20+ with `yarn` and `npm`

### Toolchain

```bash
arcup install 0.6.5
arcup use 0.6.5
```

### Build the on-chain stack

```bash
yarn install                     # repo root deps for tests
arcium build                     # compiles Arcis circuits + Anchor program
```

Outputs:
- `target/deploy/cryptanalyst.so`: Solana program binary
- `target/idl/cryptanalyst.json`: Anchor IDL
- `build/{gen_code,evaluate_guess,reveal_code}.arcis`: compiled MPC circuits

### Run on localnet

```bash
arcium test                      # spins up Docker localnet + 2-node MPC cluster, runs tests/cryptanalyst.ts
```

### Deploy to Arcium devnet

```bash
arcium deploy --cluster devnet
# Then call init_*_comp_def for each of the three circuits via your preferred client.
```

### Run the frontend

```bash
cd app
npm install
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com npm run dev
# open http://localhost:3000
```

If you're testing locally, point `NEXT_PUBLIC_RPC_ENDPOINT` at your local validator instead.

---

## Testing

End-to-end test suite at [`tests/cryptanalyst.ts`](tests/cryptanalyst.ts) covers the three critical flows:

1. **Initializes all three comp defs** (`gen_code_v2`, `evaluate_guess_v2`, `reveal_code`)
2. **Generates today's daily puzzle** via `gen_code` and verifies the `DailyPuzzle` PDA holds non-zero ciphertext
3. **Submits a guess and receives valid feedback** with `(exact + misplaced ≤ 4)` from a real MPC computation

```bash
anchor test
```

> **Known limitation:** the test runs against `arcium localnet` which requires the 0.9.x callback-server Docker image. Arcium has not yet published this image, so localnet runs are temporarily blocked. The same flows are validated end-to-end against devnet cluster `456` - see the **Notable transactions** table above for verifiable on-chain evidence.

---

## Design notes

### Bias-free randomness

The daily code is generated using `ArcisRNG::gen_integer_in_range(0, 5, 24)`: rejection sampling with 24 attempts. Failure probability is `< 2^-24`. This is bias-free in contrast to the simpler-but-biased `ArcisRNG::u8() % 6` pattern.

### Constant-time feedback

Arcis enforces *both branches execute, loops are fixed-size*. The `evaluate_guess` circuit avoids data-dependent array indexing by using an outer fixed loop over color values × inner fixed loop over positions, `g_count[color] += (guess[i] == color ? 1 : 0)` style. This compiles to a constant-time MPC circuit.

### Persistent encrypted state

The code is stored on chain as `[[u8; 32]; 4]` ciphertext + `state_nonce: u128`, owned by the MXE (`Enc<Mxe, T>`). Every guess passes `(state_nonce, account_offset, account_size)` to the cluster via the `ArgBuilder::account(...)` API. The cluster fetches and operates on the stored ciphertext directly, never sending it to any single party in the clear.

### Off-chain layout assumption

`programs/cryptanalyst/src/lib.rs` declares `ENCRYPTED_CODE_OFFSET = 46` and `ENCRYPTED_CODE_SIZE = 128`, which match the byte layout of the `DailyPuzzle` account (`8 disc + 1 bump + 4 date + 1 state + 8 created_at + 4 attempt_count + 4 solved_count + 16 state_nonce = 46`, then 128 bytes of code). If you change the account schema, update these constants.

---

## Roadmap

### Shipped (this RTG submission)

- 4-color daily code-breaking puzzle on Solana devnet
- Three Arcis circuits running in production: `gen_code_v2`, `evaluate_guess_v2`, `reveal_code`
- On-chain plaintext guess storage so player history survives any localStorage wipe
- Per-player streak counter, /wins page, leaderboard
- Twitter share button on solve
- Mobile-responsive, welcome modal for first-time users

### Next 2-4 weeks (post-judging, before mainnet)

- **NFT trophies on solve** - Metaplex-compressed cNFT minted automatically on `claim_solve`. Image generated dynamically from the date + the colors. Cheap (~0.001 SOL per mint) and shows up in Phantom's collectibles tab.
- **Difficulty tiers** - `Easy` (5 colors), `Standard` (6 colors), `Hard` (8 colors). Same MPC infrastructure, more replay value.
- **Streak NFTs** - solving 7 days in a row mints a "Cryptanalyst Adept" NFT. 30-day streak mints a different one. Drives daily retention.

### 1-3 months (mainnet candidates)

- **PvP racing mode** - two wallets enter the same encrypted code at the same time, race to crack it. Cluster computes both players' guesses in parallel. Winner takes the pot.
- **Coop puzzle** - 4 wallets must collectively crack a harder code, each holding partial info. Demonstrates a more advanced MPC pattern (multi-party encrypted aggregation) and creates social play.
- **Leaderboard rewards** - small SOL prize pool funded by tx fees, distributed weekly to the top 10 by guesses + speed.

### Mainnet considerations

- Move from devnet cluster `456` to whatever Arcium ships as the canonical mainnet cluster
- Upgrade RPC tier (paid Helius / Triton / QuickNode) for production load
- Bump Anchor program mempool size from `Tiny` to `Medium` for higher throughput
- Add CSP headers, run `npm audit`, set up dependency monitoring

---

## Acknowledgements

- Arcium examples repo (`arcium-hq/examples`): the `coinflip` and `sealed_bid_auction` patterns are the foundation this is built on.
- Arcis 0.6.5: `gen_integer_in_range`, `Enc<Mxe, T>` persistent state, and `Mxe::get().from_arcis()` are the primitives that make this game possible.

---

## License

MIT.
