export function calculatePageState(
  offset: number,
  count: number,
  totalResults: number
): {
  currentPage: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
} {
  const safeCount = Math.max(1, count);
  const safeTotal = Math.max(0, totalResults);
  const totalPages = safeTotal === 0 ? 1 : Math.ceil(safeTotal / safeCount);
  const currentPage = Math.min(totalPages, Math.floor(Math.max(0, offset) / safeCount) + 1);

  return {
    currentPage,
    totalPages,
    canGoPrev: offset > 0,
    canGoNext: offset + safeCount < safeTotal
  };
}
