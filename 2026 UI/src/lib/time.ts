/**
 * Relative "time ago" for a rule's last-triggered time, e.g. "30s ago", "1m ago",
 * "2h ago", "2d ago". Relative (rather than an absolute date/time) so it never
 * exposes a real-world timestamp that could conflict with the study's system
 * clock. Uses real elapsed time, which is fine for activity timestamps.
 */
export function formatTriggered(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}
