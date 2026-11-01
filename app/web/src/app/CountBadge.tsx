// The kit's red `Icon_KPI_Event` count, pinned to the corner of its parent.
export function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      aria-hidden
      className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-error text-[10px] font-semibold leading-none text-button-text"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
