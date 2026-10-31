import { cx } from './cx';

type ProgressSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  /** Names the bar for screen readers. */
  label: string;
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  size?: ProgressSize;
  /** Round marker at the tip of a linear bar. */
  pin?: boolean;
  className?: string;
}

const tracks: Record<ProgressSize, number> = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16 };

export function ProgressBar({
  label,
  value,
  max = 100,
  variant = 'linear',
  size = 'xs',
  pin = false,
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const track = tracks[size];
  const a11y = {
    role: 'progressbar',
    'aria-label': label,
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
  };

  if (variant === 'circular') {
    const box = 40;
    const radius = (box - track) / 2;
    const length = 2 * Math.PI * radius;
    return (
      <svg {...a11y} viewBox={`0 0 ${box} ${box}`} width={box} height={box} className={className}>
        <g fill="none" strokeWidth={track} transform={`rotate(-90 ${box / 2} ${box / 2})`}>
          <circle cx={box / 2} cy={box / 2} r={radius} className="stroke-neutral-2" />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            strokeDasharray={length}
            strokeDashoffset={length * (1 - percent / 100)}
            className="stroke-primary"
          />
        </g>
      </svg>
    );
  }

  return (
    <div
      {...a11y}
      style={{ height: track }}
      className={cx('relative w-full rounded-full bg-neutral-2', className)}
    >
      <div
        style={{ width: `${percent}%` }}
        className="h-full rounded-full bg-primary transition-[width]"
      />
      {pin && (
        <span
          style={{ left: `${percent}%`, width: track + 8, height: track + 8 }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neutral-1 bg-primary shadow-moon-sm"
        />
      )}
    </div>
  );
}
