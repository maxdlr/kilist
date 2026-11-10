export const REMINDER_HOUR = 18;
export const REMINDER_DAYS = 7;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const reminderDates = (now: Date, playedAt: string[], days = REMINDER_DAYS, hour = REMINDER_HOUR) => {
  const playedToday = playedAt.some((played) => sameDay(new Date(played), now));
  const dates: Date[] = [];
  for (let offset = 0; dates.length < days && offset <= days; offset += 1) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, 0, 0, 0);
    if (offset === 0 && (playedToday || at <= now)) continue;
    dates.push(at);
  }
  return dates;
};
