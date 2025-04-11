export function parseTimeToSeconds(timeString: string): number {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseTimeFromDate(date: Date): string {
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
