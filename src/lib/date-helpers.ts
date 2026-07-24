/**
 * Short date only — e.g. "7/22/2026".
 * Used for compact contexts like table rows.
 */
export function formatDateShort(date?: string): string {
  return date ? new Date(date).toLocaleDateString() : "N/A";
}
 
/**
 * Medium date + short time — e.g. "Jul 22, 2026, 3:45 PM".
 * Used for detail views (created/updated timestamps, etc).
 */
export function formatDateTime(date?: string): string {
  return date
    ? new Date(date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";
}