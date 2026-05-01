/**
 * Initialize the three computation definitions (gen_code, evaluate_guess,
 * reveal_code). Idempotent: skips steps already on-chain.
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=$HOME/.config/solana/id.json \
 *   npx tsx migrations/init-comp-defs.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, AddressLookupTableProgram } from "@solana/web3.js";
import { Cryptanalyst } from "../target/types/cryptanalyst";
import {
  buildFinalizeCompDefTx,
  getArciumAccountBaseSeed,
  getArciumProgram,
  getArciumProgramId,
  getCompDefAccOffset,
  getLookupTableAddress,
  getMXEAccAddress,
  uploadCircuit,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";

const LUT_PROGRAM_ID = AddressLookupTableProgram.programId;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Cryptanalyst as Program<Cryptanalyst>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);
  const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");

  const circuits: {
    name: "gen_code" | "evaluate_guess" | "reveal_code";
    method: "initGenCodeCompDef" | "initEvaluateGuessCompDef" | "initRevealCodeCompDef";
  }[] = [
    { name: "gen_code", method: "initGenCodeCompDef" },
    { name: "evaluate_guess", method: "initEvaluateGuessCompDef" },
    { name: "reveal_code", method: "initRevealCodeCompDef" },
  ];

  console.log("Fetching MXE account...");
  const arciumProgram = getArciumProgram(provider);
  const mxeAddr = getMXEAccAddress(program.programId);
  const mxeAcc = await (arciumProgram.account as any).mxeAccount.fetch(mxeAddr);
  const lutOffset: anchor.BN = mxeAcc.lutOffsetSlot;
  const lutAddress = getLookupTableAddress(program.programId, lutOffset);
  console.log(`  MXE: ${mxeAddr.toBase58()}`);
  console.log(`  LUT offset: ${lutOffset.toString()} -> ${lutAddress.toBase58()}\n`);

  for (const c of circuits) {
    const offsetBuf = getCompDefAccOffset(c.name);
    const offsetU32 = Buffer.from(offsetBuf).readUInt32LE();
    const compDefPda = PublicKey.findProgramAddressSync(
      [baseSeed, program.programId.toBuffer(), offsetBuf],
      getArciumProgramId(),
    )[0];
    console.log(`[${c.name}] ${compDefPda.toBase58()}`);

    const existing = await provider.connection.getAccountInfo(compDefPda);
    if (!existing) {
      console.log(`  step 1 init...`);
      try {
        const sig = await (program.methods as any)
          [c.method]()
          .accounts({
            compDefAccount: compDefPda,
            payer: owner.publicKey,
            mxeAccount: mxeAddr,
            addressLookupTable: lutAddress,
            lutProgram: LUT_PROGRAM_ID,
          })
          .signers([owner])
          .rpc({ commitment: "confirmed" });
        console.log(`  init sig: ${sig}`);
      } catch (e) {
        console.error(`  init failed:`, (e as Error).message);
        throw e;
      }
    } else {
      console.log(`  step 1 init... already exists, skip`);
    }

    const rawCircuit = fs.readFileSync(`build/${c.name}.arcis`);
    console.log(`  step 2 upload (${rawCircuit.length} bytes)...`);
    try {
      // chunkSize=4 keeps inner concurrent txs to ~4 to stay under RPC burst limits
      await uploadCircuit(provider, c.name, program.programId, rawCircuit, true, 4);
      console.log(`  uploaded`);
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (/already.*upload|already.*set|already.*final/i.test(msg)) {
        console.log(`  already uploaded, skip`);
      } else {
        console.error(`  upload failed:`, msg);
        throw e;
      }
    }

    console.log(`  step 3 finalize...`);
    try {
      const finalizeTx = await buildFinalizeCompDefTx(provider, offsetU32, program.programId);
      const blockhash = await provider.connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = blockhash.blockhash;
      finalizeTx.lastValidBlockHeight = blockhash.lastValidBlockHeight;
      finalizeTx.sign(owner);
      const sig = await provider.sendAndConfirm(finalizeTx);
      console.log(`  finalize sig: ${sig}`);
    } catch (e) {
      const msg = (e as Error).message ?? "";
      const logs = (e as any).logs ?? (e as any).transactionLogs ?? [];
      const allText = msg + " " + logs.join(" ");
      if (/already.*final|FinalizationAlreadyDone|already completed/i.test(allText)) {
        console.log(`  already finalized, skip`);
      } else {
        console.error(`  finalize failed:`, msg);
        if (logs.length) console.error(`     logs:`, logs);
        throw e;
      }
    }

    console.log("");
    // pause between accounts to avoid RPC burst rate limits
    await sleep(2000);
  }

  console.log("All three comp defs upload+finalized. Frontend can now play live.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

function readKpJson(path: string): anchor.web3.Keypair {
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(path, "utf-8"))),
  );
}
