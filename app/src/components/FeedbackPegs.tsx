import { NUM_POSITIONS } from "@/lib/constants";

interface Props {
  exact: number;
  misplaced: number;
}

export function FeedbackPegs({ exact, misplaced }: Props) {
  const pegs = [];
  for (let i = 0; i < exact; i++) pegs.push("exact");
  for (let i = 0; i < misplaced; i++) pegs.push("misplaced");
  while (pegs.length < NUM_POSITIONS) pegs.push("empty");

  return (
    <div className="grid grid-cols-2 gap-1">
      {pegs.map((kind, i) => (
        <span
          key={i}
          className={
            kind === "exact"
              ? "peg-exact"
              : kind === "misplaced"
                ? "peg-misplaced"
                : "peg-empty"
          }
          style={{ width: 9, height: 9, borderRadius: "50%" }}
        />
      ))}
    </div>
  );
}
