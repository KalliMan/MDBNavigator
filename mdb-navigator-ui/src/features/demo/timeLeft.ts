// The demo countdown's text. Whole minutes are rounded up, so it never says "0 min"; the last minute counts seconds.
export function formatTimeLeft(msLeft: number): string {
  const seconds = Math.max(0, Math.ceil(msLeft / 1000));
  if (seconds >= 60) {
    return `${Math.ceil(seconds / 60)} min left`;
  }
  return `0:${String(seconds).padStart(2, '0')} left`;
}
