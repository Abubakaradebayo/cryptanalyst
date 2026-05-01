interface Props {
  variant?: "active" | "computing" | "solved" | "mute" | "accent";
  children: React.ReactNode;
}

export function StatusBadge({ variant = "mute", children }: Props) {
  const cls =
    variant === "active"
      ? "chip chip-active"
      : variant === "accent"
        ? "chip chip-accent"
        : variant === "computing"
          ? "chip chip-accent computing"
          : variant === "solved"
            ? "chip chip-active"
            : "chip chip-mute";
  return <span className={cls}>{children}</span>;
}
