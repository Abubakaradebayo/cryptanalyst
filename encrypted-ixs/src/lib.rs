use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub const NUM_POSITIONS: usize = 4;
    pub const NUM_SYMBOLS: usize = 6;

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
    pub fn gen_code_v2() -> Enc<Mxe, DailyCode> {
        let s0 = ArcisRNG::gen_uniform::<u8>() % NUM_SYMBOLS as u8;
        let s1 = ArcisRNG::gen_uniform::<u8>() % NUM_SYMBOLS as u8;
        let s2 = ArcisRNG::gen_uniform::<u8>() % NUM_SYMBOLS as u8;
        let s3 = ArcisRNG::gen_uniform::<u8>() % NUM_SYMBOLS as u8;
        let code = DailyCode { symbols: [s0, s1, s2, s3] };
        Mxe::get().from_arcis(code)
    }

    #[instruction]
    pub fn evaluate_guess_v2(
        guess_ctxt: Enc<Shared, GuessInput>,
        code_ctxt: Enc<Mxe, DailyCode>,
    ) -> Feedback {
        let guess = guess_ctxt.to_arcis();
        let code = code_ctxt.to_arcis();

        let colors: [u8; NUM_SYMBOLS] = [0u8, 1u8, 2u8, 3u8, 4u8, 5u8];

        let mut exact: u8 = 0;
        for i in 0..NUM_POSITIONS {
            exact = exact + (if guess.symbols[i] == code.symbols[i] { 1u8 } else { 0u8 });
        }

        let mut total: u8 = 0;
        for color_idx in 0..NUM_SYMBOLS {
            let color = colors[color_idx];
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
