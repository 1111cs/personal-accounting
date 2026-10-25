import dayjs from 'dayjs';

export function getCurrentMonth(): string {
  return dayjs().format('YYYY-MM');
}

export function getMonthKey(date: Date | string): string {
  return dayjs(date).format('YYYY-MM');
}

export function getDaysInMonth(date: Date | string): number {
  return dayjs(date).daysInMonth();
}

export function getRemainingDays(date: Date | string): number {
  const d = dayjs(date);
  return d.daysInMonth() - d.date() + 1;
}

export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function getYesterday(): string {
  return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
}

export function getWeekStart(): string {
  return dayjs().startOf('week').format('YYYY-MM-DD');
}

export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function isYesterday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
}

export function isThisWeek(date: string | Date): boolean {
  return dayjs(date).isAfter(dayjs().startOf('week').subtract(1, 'day'));
}
