interface Props {
  tag: string;
  label: string;
  meta?: string;
}

export function SectionHeader({ tag, label, meta }: Props) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="section-tag">{tag}</span>
      <span className="text-[15px] tracking-wide text-text uppercase font-medium">
        {label}
      </span>
      <div className="flex-1 section-rule" />
      {meta ? (
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
          {meta}
        </span>
      ) : null}
    </div>
  );
}
