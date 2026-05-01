# Cryptanalyst: Architectural Plan & Functionality Brief

> **A daily code-breaking puzzle on Solana, where the answer is mathematically inaccessible to anyone (including the developers) until a player solves it.**

Submission for the Arcium **Hidden-Information Games** RTG challenge.

---

## 1. The 30-second pitch

Wordle, but **nobody knows the answer**. Not the developers, not the validators, not the cluster operators. The answer exists only as cryptographic shares distributed across independent MPC nodes. When a player guesses, the network compares the guess against the secret answer **without anyone seeing either in plaintext**, and returns two numbers: how many symbols are *exactly right* and how many are *right but in the wrong place*.

The first time anyone in the world sees today's answer is the moment a player solves it.

---

## 2. The problem

Every daily puzzle game on the internet today (Wordle, Connections, Strands, Spelling Bee, every clone of every clone) has the **same hidden flaw**: the answer is on a server that someone controls. That party can:

- Peek at the answer before you do
- Bias the puzzle (give friends easy ones, give competitors hard ones)
- Run experiments on you without telling you
- Be subpoenaed, hacked, or just make a mistake

For trust-minimized games like poker (where Arcium already has Arcane Hands) the threat is obvious: money is at stake. But the **same trust assumption hides in every "fun" daily puzzle**, and most players don't realize it.

**Card, strategy, and social-deduction games break when hands, inventories, or positions are public.** This is the official challenge framing. Cryptanalyst extends it: *daily puzzles break when the answer is private to someone who isn't you.*

---

## 3. The solution: Cryptanalyst

A daily 4-symbol code-breaking puzzle (Mastermind-style) where the secret code is generated **inside** Arcium's MPC cluster and stored on Solana as ciphertext that nobody can decrypt alone.

**Key game properties:**
- **Solo-playable.** No opponent, no matchmaking, no waiting. One person, one puzzle, one wallet.
- **One puzzle per day.** Same code worldwide, like Wordle's social mechanic, but provably fair.
- **10 guesses maximum.** Same skill curve as classic Mastermind.
- **Wallet-gated.** Solana wallet (Phantom, Solflare) = identity. No emails, no passwords, no servers holding your account.
- **Public leaderboard.** Daily and all-time, ranked by guess count and time-to-solve, keyed to your wallet.

**Key privacy properties:**
- The daily code is **never** revealed to anyone until a player solves it
- Each guess is encrypted client-side before it leaves the browser
- Each on-chain feedback is just `(exact, misplaced)`, exactly what physical Mastermind reveals
- After a `(4, 0)` solve, the cluster decrypts the answer publicly so late solvers can verify the result

---

## 4. How to play (player's view)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│ 1. Connect Phantom (or Solflare). Your wallet = your identity.         │
│                                                                        │
│ 2. If today's puzzle isn't initialized, click [Initialize today's      │
│    puzzle]. The MPC cluster generates a fresh secret code.             │
│    Anyone in the world can do this; first caller creates the day.      │
│                                                                        │
│ 3. Pick 4 colors from a 6-color palette (RED, AMBER, YELLOW, GREEN,    │
│    BLUE, VIOLET). 1296 possible codes.                                 │
│                                                                        │
│ 4. Click [Submit guess]. Behind the scenes:                            │
│    • Browser does x25519 ECDH handshake with the cluster's public key  │
│    • Encrypts your guess under Rescue cipher with random nonce         │
│    • Wallet signs a Solana tx that queues the comparison                │
│    • Cluster computes (exact, misplaced) without seeing either value   │
│    • Result lands on chain via the callback                            │
│                                                                        │
│ 5. UI renders feedback as Mastermind pegs:                             │
│    • 🟢 green peg = symbol exact (correct color, correct slot)         │
│    • 🟣 purple peg = symbol misplaced (correct color, wrong slot)      │
│    • ⚪ no peg = symbol not in the code                                │
│                                                                        │
│ 6. Repeat up to 10 guesses. On (4 exact, 0 misplaced) = solved.        │
│                                                                        │
│ 7. Auto-claim fires the reveal: the cluster decrypts the answer for    │
│    everyone, and your solve goes on the leaderboard with guess count + │
│    time-to-solve.                                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. System architecture

```
                   ┌──────────────────────────────┐
                   │         FRONTEND             │
                   │   Next.js 15 + Tailwind      │
                   │   Solana wallet adapter      │
                   │   @arcium-hq/client (x25519  │
                   │     + Rescue cipher)         │
                   └──────────────┬───────────────┘
                                  │
                                  │  encrypted guess + wallet-signed tx
                                  ▼
                   ┌──────────────────────────────┐
                   │      cryptanalyst MXE        │
                   │   (Anchor program on Solana) │
                   │                              │
                   │   PDAs:                      │
                   │   • DailyPuzzle              │
                   │   • PlayerAttempt            │
                   │   • LeaderboardEntry         │
                   │   • RevealedCode             │
                   │                              │
                   │   Instructions:              │
                   │   • init_daily_puzzle        │
                   │   • submit_guess             │
                   │   • claim_solve              │
                   │   + 3 callbacks              │
                   └──────────────┬───────────────┘
                                  │
                                  │  CPI: queue_computation
                                  ▼
                   ┌──────────────────────────────┐
                   │     ARCIUM PROGRAM           │
                   │  (on-chain scheduler)        │
                   │  Mempool, ExecPool,          │
                   │  signature verification      │
                   └──────────────┬───────────────┘
                                  │
                                  │  scheduled work
                                  ▼
                   ┌──────────────────────────────┐
                   │       MPC CLUSTER            │
                   │   (Cerberus backend)         │
                   │                              │
                   │   Runs 3 Arcis circuits:     │
                   │   • gen_code                 │
                   │   • evaluate_guess           │
                   │   • reveal_code              │
                   │                              │
                   │   No node ever holds         │
                   │   plaintext code or guess    │
                   └──────────────────────────────┘
```

**Four actors, three boundaries:**

1. **Player ↔ Frontend.** Wallet connect, UI, encryption ceremony.
2. **Frontend ↔ Solana program.** Standard Anchor RPC. Encrypted blobs travel here.
3. **Solana program ↔ Arcium scheduler.** CPI calls to queue computations.
4. **Arcium scheduler ↔ MPC cluster.** Distributed cryptographic computation.

The plaintext code **never crosses any of these boundaries**.

---

## 6. The three confidential instructions

These are the heart of the privacy model. Written in **Arcis** (Arcium's Rust-based MPC DSL), compiled to MPC circuits that the cluster executes.

### `gen_code()`: generates today's secret

```rust
#[instruction]
pub fn gen_code() -> Enc<Mxe, DailyCode> {
    // ArcisRNG::gen_integer_in_range uses rejection sampling, no bias.
    // Each MPC node contributes random shares that combine into the code.
    // The combined value is NEVER reconstructed in any one place.
    let (s0, _) = ArcisRNG::gen_integer_in_range(0, 5, 24);
    let (s1, _) = ArcisRNG::gen_integer_in_range(0, 5, 24);
    let (s2, _) = ArcisRNG::gen_integer_in_range(0, 5, 24);
    let (s3, _) = ArcisRNG::gen_integer_in_range(0, 5, 24);
    let code = DailyCode { symbols: [s0 as u8, s1 as u8, s2 as u8, s3 as u8] };
    Mxe::get().from_arcis(code)   // encrypted to MXE; only cluster can read
}
```

The output is `Enc<Mxe, DailyCode>`, ciphertext owned by the MXE. It's stored on chain inside the `DailyPuzzle` account as opaque bytes. **Even the program author cannot decrypt it.**

### `evaluate_guess(...)`: the comparison

```rust
#[instruction]
pub fn evaluate_guess(
    guess_ctxt: Enc<Shared, GuessInput>,   // shared (player ⇋ cluster)
    code_ctxt:  Enc<Mxe, DailyCode>,        // cluster-only
) -> Feedback {                              // public output
    let guess = guess_ctxt.to_arcis();
    let code  = code_ctxt.to_arcis();

    // Count exact matches (constant-time)
    let mut exact: u8 = 0;
    for i in 0..4 {
        exact = exact + (if guess.symbols[i] == code.symbols[i] { 1 } else { 0 });
    }

    // Count total color matches (constant-time double loop, no data-dependent
    // indexing; Arcis enforces this)
    let mut total: u8 = 0;
    for color in 0..6 {
        let mut g_count: u8 = 0;
        let mut c_count: u8 = 0;
        for i in 0..4 {
            g_count += (if guess.symbols[i] == color as u8 { 1 } else { 0 });
            c_count += (if code.symbols[i]  == color as u8 { 1 } else { 0 });
        }
        total = total + (if g_count < c_count { g_count } else { c_count });
    }

    Feedback { exact, misplaced: total - exact }.reveal()
}
```

**The only data leak per guess is the two-integer pair `(exact, misplaced)`**, exactly what physical Mastermind reveals.

### `reveal_code(...)`: only after a solve

```rust
#[instruction]
pub fn reveal_code(code_ctxt: Enc<Mxe, DailyCode>) -> [u8; 4] {
    code_ctxt.to_arcis().symbols.reveal()
}
```

Triggered only by `claim_solve` after a player has scored `(4, 0)`. The cluster decrypts and writes the plaintext code on chain so late solvers can verify the answer.

---

## 7. The Solana program (orchestrator)

`programs/cryptanalyst/` is a standard Anchor program annotated with `#[arcium_program]`. It:
- Receives encrypted blobs from the frontend
- Queues computations to the Arcium scheduler via CPI
- Stores results in PDAs
- Emits events for the frontend to subscribe to

**Account layout:**

| PDA | Seeds | Purpose |
|---|---|---|
| `DailyPuzzle` | `["puzzle", date]` | One per day. Stores encrypted code + state machine. |
| `PlayerAttempt` | `["attempt", date, player, attempt_idx]` | Each guess by each player. Stores `(exact, misplaced)` after callback. |
| `LeaderboardEntry` | `["lb", date, player]` | Created on solve. Stores `guesses_taken` + `time_to_solve_secs`. |
| `RevealedCode` | `["reveal", date]` | Created on solve. Stores the plaintext answer. |

**State machine for `DailyPuzzle`:**

```
NotInitialized ──► Generating ──► Active ──► Solved
   (no PDA)      (gen_code      (accepting    (claim_solve
                  queued)        guesses)     fired,
                                              code revealed)
```

**Events emitted:**
- `PuzzleInitializedEvent { puzzle, date }`
- `GuessEvaluatedEvent { puzzle, player, attempt_idx, exact, misplaced }`
- `CodeRevealedEvent { puzzle, date, symbols }`

---

## 8. The privacy story

### Why Arcium MPC is the *only* primitive that solves Cryptanalyst

| Approach | What breaks |
| --- | --- |
| Code stored plaintext on Solana | Anyone reads it from the account. Trivial cheat. |
| Code stored on a server (Wordle / NYT model) | Trust the server. The server can peek, bias, manipulate, get hacked. |
| Hash commitment on Solana | Proves the code wasn't swapped mid-game, but **you cannot compute "X exact, Y misplaced" against a hash**. The feedback function is impossible. |
| zk-SNARK | Whoever generates the proof must hold the code in plaintext. So a dev or admin sees it. Trust required. |
| TEE (Intel SGX / AMD SEV) | Trust hardware vendors. Multiple production exploits over the past decade. |
| **Arcium MPC** | **No trust point. The code is a distributed secret across MPC nodes. Math, not trust.** |

Pitch slide paragraph:

> *Many privacy projects could have shipped with zero-knowledge proofs or trusted enclaves. Cryptanalyst cannot. The Mastermind-style feedback function is a comparison between two encrypted values, the kind of computation only secure multiparty computation can do trustlessly. Arcium is uniquely necessary here, and that's the strongest possible argument for using it.*

---

## 9. What's encrypted, what's public

| Data | State | Why |
|---|---|---|
| Daily code | **Encrypted** to MXE the moment it's generated; **revealed** only after solve | Core game secret |
| Player's guess | **Encrypted** client-side (x25519 + Rescue) before tx is sent; never decrypted in any single place | Prevents observers from learning solving strategies |
| `(exact, misplaced)` feedback | Public per attempt | Required for gameplay; same as physical Mastermind |
| Player's wallet | Public | Identity for leaderboard |
| Attempt count | Public | Anyone can see how hard today is |
| Solve time | Public on solve | Leaderboard ranking |

---

## 10. Tech stack

**Smart contract layer**
- Rust 1.84+ (Solana platform-tools)
- Anchor 0.32.1
- Arcium 0.6.5 (`arcium-anchor`, `arcium-client`, `arcium-macros`)
- Arcis 0.6.5 (MPC DSL)

**Frontend**
- Next.js 15 + App Router
- TypeScript 5
- Tailwind CSS v4
- `@solana/wallet-adapter-react` (Phantom, Solflare)
- `@coral-xyz/anchor` (program client)
- `@arcium-hq/client@0.6.5` (encryption + cluster pubkey lookup)

**Infrastructure**
- Solana devnet (deployment target)
- Arcium devnet MPC cluster (Cerberus backend)
- Wallets supported: Phantom, Solflare (extensible to any wallet-adapter wallet)

---

## 11. What makes this submission RTG-eligible

The challenge requires:
1. **A functional Solana project integrated with Arcium.** Cryptanalyst is an Anchor program with `#[arcium_program]` orchestrating three Arcis circuits.
2. **A clear explanation of how Arcium is used and the privacy benefits it provides.** See Sections 6 through 9 above; full README at the project root; threat-model table makes it scannable.
3. **An open-source GitHub repo.** MIT-licensed, ready to push.
4. **English.** Yes.

The challenge judges on:
- **Innovation.** The *application* is novel: no daily-puzzle game has been built on MPC before, and provably-fair Wordle is an unmet need.
- **Technical Implementation.** Uses the canonical idioms from Arcium's own examples repo (`coinflip`, `sealed_bid_auction`); 707 LOC Anchor program, 73 LOC Arcis, full E2E test, type-safe TypeScript client.
- **User Experience.** Solo-playable, no waiting, wallet-only auth, daily ritual familiar to Wordle players, Mastermind-style feedback that's intuitive at a glance.
- **Impact.** Proves MPC has consumer applications beyond DeFi. If this works for Mastermind, it works for any "daily puzzle with a hidden answer" template: Connections, Spelling Bee, Crossword Clue of the Day.
- **Clarity.** The threat-model table is the strongest single artifact in the submission. Technical or not, a reader gets the value proposition in 30 seconds.

---

## 12. Roadmap (post-MVP)

| Stage | Feature | Effort |
|---|---|---|
| Now | Daily puzzle + leaderboard | Done |
| Next | Streaks, calendar view, "share my solve" social card | Small |
| Next | 1v1 race mode (each player has their own encrypted code) | Medium |
| Later | Difficulty levels (5 symbols, 7 symbols, longer codes) | Small |
| Later | Co-op mode (a team submits one combined guess) | Medium |
| Later | NFT badges for streaks; tradeable via Solana programs | Medium |
| Later | Mobile-first PWA wrapper | Small |
| Later | Tournament mode with prize pool escrow | Medium |
| Long term | Open-source the *daily puzzle* template so anyone can deploy a Connections/Wordle/etc. variant on the same MPC primitive | Large |

---

## 13. The demo (what to show in the live pitch)

**Two-minute demo flow:**

1. **(15s)** Show the page on a fresh wallet. State badge says "Not initialized."
2. **(15s)** Click "Initialize today's puzzle." Watch the badge transition: `Not initialized → Generating · MPC → Active`. Narrate: *"The cluster is generating today's code. When this finishes, even I can't see the answer."*
3. **(15s)** Open Solana Explorer in another tab. Show the `DailyPuzzle` PDA and point at the `encrypted_code: [[u8;32];4]` field. *"This blob is on chain. Nobody on earth can decrypt it."*
4. **(45s)** Make 3-5 guesses, narrating each one: *"This guess gets encrypted in my browser, sent to the cluster, the cluster compares it without decrypting either side, and returns the two-number feedback."* Show the pegs animating in.
5. **(15s)** Solve it. The auto-claim fires. The state badge becomes `SOLVED`. Click the leaderboard tab; the wallet appears.
6. **(15s)** Open Explorer again. The `RevealedCode` PDA now exists. *"This is the first time anyone in the world has seen today's code."*

**Closing line:** *"Every alternative privacy primitive (zk, TEEs, server-side, hashes) either breaks the game or breaks the trust model. Cryptanalyst is the first daily puzzle game that nobody, including its authors, can cheat."*

---

## 14. Repository structure

```
cryptanalyst/
├── encrypted-ixs/                    # Arcis circuits (3 instructions)
│   └── src/lib.rs
├── programs/cryptanalyst/             # Anchor program (9 instructions, 4 PDAs)
│   └── src/lib.rs
├── tests/cryptanalyst.ts              # E2E test
├── app/                                # Next.js frontend
│   └── src/{app,components,hooks,lib}
├── README.md                           # Setup + technical reference
├── PRESENTATION.md                     # This document
├── Anchor.toml
├── Arcium.toml
└── Cargo.toml
```

---

## 15. The one-line pitch (for the submission form)

> **Cryptanalyst is the first provably-fair daily puzzle game on Solana, where the answer is mathematically inaccessible to anyone (including the developers) until a player solves it. Built on Arcium MPC because no other privacy primitive can compute Mastermind-style feedback over encrypted state.**
