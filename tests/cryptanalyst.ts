import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Cryptanalyst } from "../target/types/cryptanalyst";
import { randomBytes } from "crypto";
import {
  awaitComputationFinalization,
  getArciumEnv,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgramId,
  buildFinalizeCompDefTx,
  RescueCipher,
  deserializeLE,
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  x25519,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";

describe("Cryptanalyst", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Cryptanalyst as Program<Cryptanalyst>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  type Event = anchor.IdlEvents<(typeof program)["idl"]>;
  const awaitEvent = async <E extends keyof Event>(
    eventName: E,
  ): Promise<Event[E]> => {
    let listenerId: number;
    const event = await new Promise<Event[E]>((res) => {
      listenerId = program.addEventListener(eventName, (event) => res(event));
    });
    await program.removeEventListener(listenerId);
    return event;
  };

  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);

  const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

  const todayDate = currentPuzzleDate();
  const puzzlePda = PublicKey.findProgramAddressSync(
    [Buffer.from("puzzle"), u32Le(todayDate)],
    program.programId,
  )[0];

  it("Initializes all three comp defs", async () => {
    await initCompDef(program, owner, "gen_code", "initGenCodeCompDef");
    await initCompDef(program, owner, "evaluate_guess", "initEvaluateGuessCompDef");
    await initCompDef(program, owner, "reveal_code", "initRevealCodeCompDef");
  });

  it("Generates today's daily puzzle (gen_code)", async () => {
    const computationOffset = new anchor.BN(randomBytes(8), "hex");
    const eventPromise = awaitEvent("puzzleInitializedEvent");

    await program.methods
      .initDailyPuzzle(computationOffset, todayDate)
      .accountsPartial({
        payer: owner.publicKey,
        puzzle: puzzlePda,
        computationAccount: getComputationAccAddress(
          arciumEnv.arciumClusterOffset,
          computationOffset,
        ),
        clusterAccount,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
        executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("gen_code")).readUInt32LE(),
        ),
      })
      .signers([owner])
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    await awaitComputationFinalization(
      provider,
      computationOffset,
      program.programId,
      "confirmed",
    );

    const event = await eventPromise;
    expect(event.date).to.equal(todayDate);

    const puzzle = await program.account.dailyPuzzle.fetch(puzzlePda);
    expect(puzzle.date).to.equal(todayDate);
    expect(JSON.stringify(puzzle.state)).to.contain("active");
    const codeBytes = puzzle.encryptedCode.flat();
    expect(codeBytes.some((b: number) => b !== 0)).to.equal(true);
  });

  it("Submits a guess and receives valid feedback", async () => {
    const mxePublicKey = await getMXEPublicKeyWithRetry(provider, program.programId);

    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const guessSymbols = [BigInt(0), BigInt(1), BigInt(2), BigInt(3)];
    const nonce = randomBytes(16);
    const ciphertexts = cipher.encrypt(guessSymbols, nonce);

    const attemptIdx = 0;
    const attemptPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("attempt"),
        u32Le(todayDate),
        owner.publicKey.toBuffer(),
        u32Le(attemptIdx),
      ],
      program.programId,
    )[0];

    const computationOffset = new anchor.BN(randomBytes(8), "hex");
    const eventPromise = awaitEvent("guessEvaluatedEvent");

    await program.methods
      .submitGuess(
        computationOffset,
        todayDate,
        attemptIdx,
        Array.from(ciphertexts[0]),
        Array.from(ciphertexts[1]),
        Array.from(ciphertexts[2]),
        Array.from(ciphertexts[3]),
        Array.from(publicKey),
        new anchor.BN(deserializeLE(nonce).toString()),
      )
      .accountsPartial({
        player: owner.publicKey,
        puzzle: puzzlePda,
        attempt: attemptPda,
        computationAccount: getComputationAccAddress(
          arciumEnv.arciumClusterOffset,
          computationOffset,
        ),
        clusterAccount,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
        executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("evaluate_guess")).readUInt32LE(),
        ),
      })
      .signers([owner])
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    await awaitComputationFinalization(
      provider,
      computationOffset,
      program.programId,
      "confirmed",
    );

    const event = await eventPromise;
    const total = event.exact + event.misplaced;
    expect(event.exact).to.be.gte(0);
    expect(event.exact).to.be.lte(4);
    expect(event.misplaced).to.be.gte(0);
    expect(event.misplaced).to.be.lte(4);
    expect(total).to.be.lte(4);

    const attempt = await program.account.playerAttempt.fetch(attemptPda);
    expect(attempt.finalized).to.equal(true);
    expect(attempt.exact).to.equal(event.exact);
    expect(attempt.misplaced).to.equal(event.misplaced);
  });

  async function initCompDef(
    program: Program<Cryptanalyst>,
    owner: anchor.web3.Keypair,
    circuitName: string,
    methodName: string,
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed("ComputationDefinitionAccount");
    const offset = getCompDefAccOffset(circuitName);

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgramId(),
    )[0];

    const sig = await (program.methods as any)
      [methodName]()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    const finalizeTx = await buildFinalizeCompDefTx(
      provider,
      Buffer.from(offset).readUInt32LE(),
      program.programId,
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    finalizeTx.recentBlockhash = latestBlockhash.blockhash;
    finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    finalizeTx.sign(owner);
    await provider.sendAndConfirm(finalizeTx);

    return sig;
  }
});

function currentPuzzleDate(): number {
  const now = new Date();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor(utc / 86_400_000);
}

function u32Le(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}

async function getMXEPublicKeyWithRetry(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 20,
  retryDelayMs: number = 500,
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const k = await getMXEPublicKey(provider, programId);
      if (k) return k;
    } catch {}
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  throw new Error(`Failed to fetch MXE public key after ${maxRetries} attempts`);
}

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString())),
  );
}
