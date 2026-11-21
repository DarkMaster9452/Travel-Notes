/** How much of a slot's window has already gone, 0–100. */
export function windowProgress(openAt: Date | string, closeAt: Date | string, now = Date.now()): number {
  const from = new Date(openAt).getTime();
  const to = new Date(closeAt).getTime();
  if (to <= from) return 100;
  return Math.max(0, Math.min(100, ((now - from) / (to - from)) * 100));
}
