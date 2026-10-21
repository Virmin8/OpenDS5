/** "about 3 h", "about 40 min", "under 10 min". */
export function formatTimeLeft(minutes: number): string {
  if (minutes < 10) {
    return 'under 10 min';
  }
  if (minutes < 60) {
    return `about ${Math.round(minutes / 5) * 5} min`;
  }
  const hours = minutes / 60;
  return hours < 3
    ? `about ${Math.round(hours * 2) / 2} h`
    : `about ${Math.round(hours)} h`;
}

/** The narrow form for the sidebar: "~3 h", "~40 min", "<10 min". */
export function formatTimeLeftShort(minutes: number): string {
  return formatTimeLeft(minutes).replace('about ', '~').replace('under ', '<');
}
