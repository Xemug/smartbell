import { cx } from './cx';

export function Spinner({ size }: { size: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cx(
        'inline-block rounded-full border-2 border-current border-t-transparent',
        'animate-spin motion-reduce:animate-none',
      )}
    />
  );
}
