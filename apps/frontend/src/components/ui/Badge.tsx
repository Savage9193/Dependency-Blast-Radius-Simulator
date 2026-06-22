import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-surface-overlay text-gray-300 border-surface-border',
  brand: 'bg-brand/20 text-brand-hover border-brand/30',
  success: 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/30',
  warning: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
  danger: 'bg-accent-rose/20 text-accent-rose border-accent-rose/30',
  critical: 'bg-accent-rose/30 text-white border-accent-rose/50',
} as const;

export interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
