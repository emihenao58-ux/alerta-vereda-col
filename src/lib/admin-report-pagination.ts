export function getReportPageRange(page: number, pageSize: number) {
  const safePage = Math.max(0, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const from = safePage * safePageSize;
  return { from, to: from + safePageSize - 1 };
}

export function getReportPageCount(total: number, pageSize: number) {
  const safeTotal = Math.max(0, Math.floor(total));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  return Math.max(1, Math.ceil(safeTotal / safePageSize));
}
