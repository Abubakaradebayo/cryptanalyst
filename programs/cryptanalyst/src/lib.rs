use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::CallbackAccount;

declare_id!("EG3AAsGKNCR8x6dLYu5KjrhdegxgQEQJD3R1NWf1FQk4");

const COMP_DEF_OFFSET_GEN_CODE: u32 = comp_def_offset("gen_code");
const COMP_DEF_OFFSET_EVALUATE_GUESS: u32 = comp_def_offset("evaluate_guess");
const COMP_DEF_OFFSET_REVEAL_CODE: u32 = comp_def_offset("reveal_code");

// DailyPuzzle layout offsets (after 8-byte discriminator):
//  bump          : 1
//  date          : 4
//  state         : 1
//  created_at    : 8
//  attempt_count : 4
//  solved_count  : 4
//  state_nonce   : 16
//  encrypted_code: 128 (= 4 * 32)
// encrypted_code starts at: 8 + 1 + 4 + 1 + 8 + 4 + 4 + 16 = 46
const ENCRYPTED_CODE_OFFSET: u32 = 46;
const ENCRYPTED_CODE_SIZE: u32 = 32 * 4;

const NUM_POSITIONS: usize = 4;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum PuzzleState {
    Generating,
    Active,
    Solved,
}

#[arcium_program]
pub mod cryptanalyst {
    use super::*;

    pub fn init_gen_code_comp_def(ctx: Context<InitGenCodeCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    pub fn init_evaluate_guess_comp_def(ctx: Context<InitEvaluateGuessCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    pub fn init_reveal_code_comp_def(ctx: Context<InitRevealCodeCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    pub fn init_daily_puzzle(
        ctx: Context<InitDailyPuzzle>,
        computation_offset: u64,
        date: u32,
    ) -> Result<()> {
        let puzzle = &mut ctx.accounts.puzzle;
        // Allow re-init only if the puzzle is fresh (date==0 means uninitialized
        // since u32 default is 0) or stuck in Generating state from a failed callback.
        // Active or Solved puzzles cannot be re-initialized for the day.
        require!(
            puzzle.date == 0 || puzzle.state == PuzzleState::Generating,
            ErrorCode::PuzzleAlreadyInitialized
        );
        puzzle.bump = ctx.bumps.puzzle;
        puzzle.date = date;
        puzzle.state = PuzzleState::Generating;
        puzzle.created_at = Clock::get()?.unix_timestamp;
        puzzle.attempt_count = 0;
        puzzle.solved_count = 0;
        puzzle.state_nonce = 0;
        puzzle.encrypted_code = [[0u8; 32]; 4];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        let args = ArgBuilder::new().build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![GenCodeCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[CallbackAccount {
                    pubkey: ctx.accounts.puzzle.key(),
                    is_writable: true,
                }],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "gen_code")]
    pub fn gen_code_callback(
        ctx: Context<GenCodeCallback>,
        output: SignedComputationOutputs<GenCodeOutput>,
    ) -> Result<()> {
        let o = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(GenCodeOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };

        let puzzle = &mut ctx.accounts.puzzle;
        puzzle.encrypted_code = o.ciphertexts;
        puzzle.state_nonce = o.nonce;
        puzzle.state = PuzzleState::Active;

        emit!(PuzzleInitializedEvent {
            puzzle: puzzle.key(),
            date: puzzle.date,
        });

        Ok(())
    }

    pub fn submit_guess(
        ctx: Context<SubmitGuess>,
        computation_offset: u64,
        _date: u32,
        _attempt_idx: u32,
        guess_ct_0: [u8; 32],
        guess_ct_1: [u8; 32],
        guess_ct_2: [u8; 32],
        guess_ct_3: [u8; 32],
        guess_pubkey: [u8; 32],
        guess_nonce: u128,
    ) -> Result<()> {
        let puzzle = &ctx.accounts.puzzle;
        require!(
            puzzle.state == PuzzleState::Active,
            ErrorCode::PuzzleNotActive
        );

        let attempt = &mut ctx.accounts.attempt;
        attempt.bump = ctx.bumps.attempt;
        attempt.player = ctx.accounts.player.key();
        attempt.date = puzzle.date;
        attempt.attempt_idx = puzzle.attempt_count;
        attempt.computation_offset = computation_offset;
        attempt.exact = 0;
        attempt.misplaced = 0;
        attempt.finalized = false;
        attempt.submitted_at = Clock::get()?.unix_timestamp;

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        let args = ArgBuilder::new()
            .x25519_pubkey(guess_pubkey)
            .plaintext_u128(guess_nonce)
            .encrypted_u8(guess_ct_0)
            .encrypted_u8(guess_ct_1)
            .encrypted_u8(guess_ct_2)
            .encrypted_u8(guess_ct_3)
            .plaintext_u128(puzzle.state_nonce)
            .account(
                ctx.accounts.puzzle.key(),
                ENCRYPTED_CODE_OFFSET,
                ENCRYPTED_CODE_SIZE,
            )
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![EvaluateGuessCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[
                    CallbackAccount {
                        pubkey: ctx.accounts.puzzle.key(),
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: ctx.accounts.attempt.key(),
                        is_writable: true,
                    },
                ],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "evaluate_guess")]
    pub fn evaluate_guess_callback(
        ctx: Context<EvaluateGuessCallback>,
        output: SignedComputationOutputs<EvaluateGuessOutput>,
    ) -> Result<()> {
        let o = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(EvaluateGuessOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };

        let attempt = &mut ctx.accounts.attempt;
        attempt.exact = o.field_0;
        attempt.misplaced = o.field_1;
        attempt.finalized = true;

        let puzzle = &mut ctx.accounts.puzzle;
        puzzle.attempt_count = puzzle
            .attempt_count
            .checked_add(1)
            .ok_or(ErrorCode::AttemptCountOverflow)?;

        emit!(GuessEvaluatedEvent {
            puzzle: puzzle.key(),
            player: attempt.player,
            attempt_idx: attempt.attempt_idx,
            exact: attempt.exact,
            misplaced: attempt.misplaced,
        });

        Ok(())
    }

    pub fn claim_solve(
        ctx: Context<ClaimSolve>,
        computation_offset: u64,
        _date: u32,
        _attempt_idx: u32,
    ) -> Result<()> {
        let attempt = &ctx.accounts.attempt;
        require!(attempt.finalized, ErrorCode::AttemptNotFinalized);
        require!(
            attempt.exact == NUM_POSITIONS as u8 && attempt.misplaced == 0,
            ErrorCode::AttemptDidNotSolve
        );
        require!(
            attempt.player == ctx.accounts.player.key(),
            ErrorCode::WrongPlayer
        );

        let puzzle = &ctx.accounts.puzzle;
        require!(
            puzzle.state == PuzzleState::Active,
            ErrorCode::PuzzleAlreadySolved
        );

        let lb = &mut ctx.accounts.leaderboard_entry;
        lb.bump = ctx.bumps.leaderboard_entry;
        lb.date = puzzle.date;
        lb.player = ctx.accounts.player.key();
        lb.guesses_taken = puzzle
            .attempt_count
            .checked_add(1)
            .ok_or(ErrorCode::AttemptCountOverflow)?;
        let now = Clock::get()?.unix_timestamp;
        lb.solved_at = now;
        lb.time_to_solve_secs = now.saturating_sub(puzzle.created_at) as u64;

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        let args = ArgBuilder::new()
            .plaintext_u128(puzzle.state_nonce)
            .account(
                ctx.accounts.puzzle.key(),
                ENCRYPTED_CODE_OFFSET,
                ENCRYPTED_CODE_SIZE,
            )
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![RevealCodeCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[
                    CallbackAccount {
                        pubkey: ctx.accounts.puzzle.key(),
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: ctx.accounts.revealed_code.key(),
                        is_writable: true,
                    },
                ],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "reveal_code")]
    pub fn reveal_code_callback(
        ctx: Context<RevealCodeCallback>,
        output: SignedComputationOutputs<RevealCodeOutput>,
    ) -> Result<()> {
        let symbols = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(RevealCodeOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };

        let revealed = &mut ctx.accounts.revealed_code;
        revealed.symbols = symbols;
        revealed.revealed_at = Clock::get()?.unix_timestamp;

        let puzzle = &mut ctx.accounts.puzzle;
        puzzle.state = PuzzleState::Solved;
        puzzle.solved_count = puzzle
            .solved_count
            .checked_add(1)
            .ok_or(ErrorCode::AttemptCountOverflow)?;

        emit!(CodeRevealedEvent {
            puzzle: puzzle.key(),
            date: puzzle.date,
            symbols,
        });

        Ok(())
    }
}

#[init_computation_definition_accounts("gen_code", payer)]
#[derive(Accounts)]
pub struct InitGenCodeCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("evaluate_guess", payer)]
#[derive(Accounts)]
pub struct InitEvaluateGuessCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("reveal_code", payer)]
#[derive(Accounts)]
pub struct InitRevealCodeCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[queue_computation_accounts("gen_code", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64, date: u32)]
pub struct InitDailyPuzzle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 8 + DailyPuzzle::INIT_SPACE,
        payer = payer,
        seeds = [b"puzzle", date.to_le_bytes().as_ref()],
        bump,
    )]
    pub puzzle: Box<Account<'info, DailyPuzzle>>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Box<Account<'info, ArciumSignerAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut, address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: mempool_account, checked by arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: executing_pool, checked by arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: computation_account, checked by arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_GEN_CODE))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(mut, address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("gen_code")]
#[derive(Accounts)]
pub struct GenCodeCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_GEN_CODE))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    /// CHECK: computation_account, checked by arcium program via constraints in the callback context.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(mut)]
    pub puzzle: Box<Account<'info, DailyPuzzle>>,
}

#[queue_computation_accounts("evaluate_guess", player)]
#[derive(Accounts)]
#[instruction(computation_offset: u64, date: u32, attempt_idx: u32)]
pub struct SubmitGuess<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"puzzle", date.to_le_bytes().as_ref()],
        bump = puzzle.bump,
    )]
    pub puzzle: Box<Account<'info, DailyPuzzle>>,
    #[account(
        init,
        space = 8 + PlayerAttempt::INIT_SPACE,
        payer = player,
        seeds = [
            b"attempt",
            date.to_le_bytes().as_ref(),
            player.key().as_ref(),
            attempt_idx.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub attempt: Box<Account<'info, PlayerAttempt>>,
    #[account(
        init_if_needed,
        space = 9,
        payer = player,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Box<Account<'info, ArciumSignerAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut, address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: mempool_account, checked by arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: executing_pool, checked by arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: computation_account, checked by arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_EVALUATE_GUESS))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(mut, address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("evaluate_guess")]
#[derive(Accounts)]
pub struct EvaluateGuessCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_EVALUATE_GUESS))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    /// CHECK: computation_account, checked by arcium program via constraints in the callback context.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(mut)]
    pub puzzle: Box<Account<'info, DailyPuzzle>>,
    #[account(mut)]
    pub attempt: Box<Account<'info, PlayerAttempt>>,
}

#[queue_computation_accounts("reveal_code", player)]
#[derive(Accounts)]
#[instruction(computation_offset: u64, date: u32, attempt_idx: u32)]
pub struct ClaimSolve<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"puzzle", date.to_le_bytes().as_ref()],
        bump = puzzle.bump,
    )]
    pub puzzle: Box<Account<'info, DailyPuzzle>>,
    #[account(
        seeds = [
            b"attempt",
            date.to_le_bytes().as_ref(),
            player.key().as_ref(),
            attempt_idx.to_le_bytes().as_ref(),
        ],
        bump = attempt.bump,
    )]
    pub attempt: Box<Account<'info, PlayerAttempt>>,
    #[account(
        init,
        space = 8 + LeaderboardEntry::INIT_SPACE,
        payer = player,
        seeds = [b"lb", date.to_le_bytes().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub leaderboard_entry: Box<Account<'info, LeaderboardEntry>>,
    #[account(
        init_if_needed,
        space = 8 + RevealedCode::INIT_SPACE,
        payer = player,
        seeds = [b"reveal", date.to_le_bytes().as_ref()],
        bump,
    )]
    pub revealed_code: Box<Account<'info, RevealedCode>>,
    #[account(
        init_if_needed,
        space = 9,
        payer = player,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Box<Account<'info, ArciumSignerAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut, address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: mempool_account, checked by arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: executing_pool, checked by arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: computation_account, checked by arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_REVEAL_CODE))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(mut, address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("reveal_code")]
#[derive(Accounts)]
pub struct RevealCodeCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_REVEAL_CODE))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    /// CHECK: computation_account, checked by arcium program via constraints in the callback context.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(mut)]
    pub puzzle: Box<Account<'info, DailyPuzzle>>,
    #[account(mut)]
    pub revealed_code: Box<Account<'info, RevealedCode>>,
}

#[account]
#[derive(InitSpace)]
pub struct DailyPuzzle {
    pub bump: u8,
    pub date: u32,
    pub state: PuzzleState,
    pub created_at: i64,
    pub attempt_count: u32,
    pub solved_count: u32,
    pub state_nonce: u128,
    pub encrypted_code: [[u8; 32]; 4],
}

#[account]
#[derive(InitSpace)]
pub struct PlayerAttempt {
    pub bump: u8,
    pub player: Pubkey,
    pub date: u32,
    pub attempt_idx: u32,
    pub computation_offset: u64,
    pub exact: u8,
    pub misplaced: u8,
    pub finalized: bool,
    pub submitted_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct LeaderboardEntry {
    pub bump: u8,
    pub date: u32,
    pub player: Pubkey,
    pub guesses_taken: u32,
    pub time_to_solve_secs: u64,
    pub solved_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct RevealedCode {
    pub bump: u8,
    pub date: u32,
    pub symbols: [u8; 4],
    pub revealed_at: i64,
}

#[event]
pub struct PuzzleInitializedEvent {
    pub puzzle: Pubkey,
    pub date: u32,
}

#[event]
pub struct GuessEvaluatedEvent {
    pub puzzle: Pubkey,
    pub player: Pubkey,
    pub attempt_idx: u32,
    pub exact: u8,
    pub misplaced: u8,
}

#[event]
pub struct CodeRevealedEvent {
    pub puzzle: Pubkey,
    pub date: u32,
    pub symbols: [u8; 4],
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
    #[msg("Puzzle is not active (not initialized or already solved)")]
    PuzzleNotActive,
    #[msg("Puzzle has already been solved")]
    PuzzleAlreadySolved,
    #[msg("Attempt count overflow")]
    AttemptCountOverflow,
    #[msg("Attempt has not been finalized by the cluster yet")]
    AttemptNotFinalized,
    #[msg("This attempt did not solve the puzzle")]
    AttemptDidNotSolve,
    #[msg("Player on attempt does not match signer")]
    WrongPlayer,
    #[msg("Puzzle is already active or solved for this date")]
    PuzzleAlreadyInitialized,
}
