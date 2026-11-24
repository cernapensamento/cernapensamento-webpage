export interface AlternateLocaleBadgeProps {
  label: string | null | undefined;
  className?: string;
}

const BASE_CLASSES =
  'font-mono text-[10px] uppercase tracking-[0.14em] text-gold border border-gold/35 bg-gold/10 px-2 py-0.5 shrink-0';

export function AlternateLocaleBadge({
  label,
  className,
}: AlternateLocaleBadgeProps) {
  if (!label) return null;

  return (
    <span className={className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES}>
      {label}
    </span>
  );
}

export default AlternateLocaleBadge;
