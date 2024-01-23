export function formatTimestamp(timestamp: number): string {
  if (isNaN(timestamp)) return "--:--";

  const date = new Date(0);
  date.setSeconds(timestamp);

  return date.toISOString().substring(14, 19);
}
