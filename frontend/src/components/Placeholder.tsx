interface Props {
  title: string;
  description: string;
  phase: string;
}

export default function Placeholder({ title, description, phase }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      <p className="mt-4 text-xs text-ink-faint">{phase}</p>
    </div>
  );
}
