// Whole days between today and an ISO date (YYYY-MM-DD), ignoring time of day.
export function daysUntil(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatDay(isoDate: string, lang: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(
    lang === "de" ? "de-DE" : "en-GB",
    { weekday: "short", day: "2-digit", month: "short" },
  );
}
