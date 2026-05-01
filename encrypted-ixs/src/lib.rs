use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub const NUM_POSITIONS: usize = 4;
    pub const NUM_SYMBOLS: usize = 6;
    pub const MAX_SYMBOL: u128 = 5;
    pub const RNG_ATTEMPTS: usize = 24;

    pub struct DailyCode {
        pub symbols: [u8; NUM_POSITIONS],
    }

    pub struct GuessInput {
        pub symbols: [u8; NUM_POSITIONS],
    }

    pub struct Feedback {
        pub exact: u8,
        pub misplaced: u8,
    }

    #[instruction]
    pub fn gen_code() -> Enc<Mxe, DailyCode> {
        let (s0, _) = ArcisRNG::gen_integer_in_range(0, MAX_SYMBOL, RNG_ATTEMPTS);
        let (s1, _) = ArcisRNG::gen_integer_in_range(0, MAX_SYMBOL, RNG_ATTEMPTS);
        let (s2, _) = ArcisRNG::gen_integer_in_range(0, MAX_SYMBOL, RNG_ATTEMPTS);
        let (s3, _) = ArcisRNG::gen_integer_in_range(0, MAX_SYMBOL, RNG_ATTEMPTS);
        let code = DailyCode {
            symbols: [s0 as u8, s1 as u8, s2 as u8, s3 as u8],
        };
        Mxe::get().from_arcis(code)
    }

    #[instruction]
    pub fn evaluate_guess(
        guess_ctxt: Enc<Shared, GuessInput>,
        code_ctxt: Enc<Mxe, DailyCode>,
    ) -> Feedback {
        let guess = guess_ctxt.to_arcis();
        let code = code_ctxt.to_arcis();

        let mut exact: u8 = 0;
        for i in 0..NUM_POSITIONS {
            exact = exact + (if guess.symbols[i] == code.symbols[i] { 1u8 } else { 0u8 });
        }

        let mut total: u8 = 0;
        for color_idx in 0..NUM_SYMBOLS {
            let color: u8 = color_idx as u8;
            let mut g_count: u8 = 0;
            let mut c_count: u8 = 0;
            for i in 0..NUM_POSITIONS {
                g_count = g_count + (if guess.symbols[i] == color { 1u8 } else { 0u8 });
                c_count = c_count + (if code.symbols[i] == color { 1u8 } else { 0u8 });
            }
            total = total + (if g_count < c_count { g_count } else { c_count });
        }

        Feedback {
            exact,
            misplaced: total - exact,
        }
        .reveal()
    }

    #[instruction]
    pub fn reveal_code(code_ctxt: Enc<Mxe, DailyCode>) -> [u8; NUM_POSITIONS] {
        code_ctxt.to_arcis().symbols.reveal()
    }
}
