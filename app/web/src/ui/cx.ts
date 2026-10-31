export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// One focus treatment across the kit. Figma draws it on buttons only; the rest follow.
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
