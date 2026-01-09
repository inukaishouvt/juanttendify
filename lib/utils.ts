import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5); // HH:mm
}

export function formatTime12h(timeString: string | number | Date): string {
  if (!timeString) return '--';

  let date: Date;
  if (typeof timeString === 'string' && /^\d{1,2}:\d{2}$/.test(timeString)) {
    // It's a simple HH:mm string (from a period)
    date = new Date(`2000-01-01T${timeString}:00`);
  } else {
    // It's a timestamp (ISO string, number, or Date object)
    date = new Date(timeString);
  }

  if (isNaN(date.getTime())) return typeof timeString === 'string' ? timeString : '--';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
}

export function formatDateManila(date: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '--';

  let d: Date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // For YYYY-MM-DD, append a time and use the Manila timezone to avoid day-shifting
    d = new Date(`${date}T12:00:00`);
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return '--';

  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    ...options
  });
}

export function formatDateTimeManila(date: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--';

  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour12: true,
    ...options
  });
}

export function getManilaToday(): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/\//g, '-');
}

export function getManilaTimeParts(date: Date = new Date()): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(date);

  const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

  return { hours, minutes };
}

export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

export function isTimeBetween(time: Date, startTime: string, endTime: string): boolean {
  const now = { hours: time.getHours(), minutes: time.getMinutes() };
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const nowMinutes = now.hours * 60 + now.minutes;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

/**
 * Converts a string to Title Case (proper capitalization for names)
 * Example: "JOHN DOE" -> "John Doe", "jane doe" -> "Jane Doe"
 */
export function capitalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

