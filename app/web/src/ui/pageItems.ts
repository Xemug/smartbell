/** First, last and the current page with its neighbours; a gap is `null`. */
export function pageItems(page: number, pageCount: number): (number | null)[] {
  const shown = [1, page - 1, page, page + 1, pageCount].filter((p) => p >= 1 && p <= pageCount);
  const pages = [...new Set(shown)].sort((a, b) => a - b);
  return pages.flatMap((p, index) => {
    const previous = pages[index - 1] ?? 0;
    if (p - previous === 2) return [previous + 1, p]; // A gap of one page: show it instead.
    return p - previous > 2 ? [null, p] : [p];
  });
}
