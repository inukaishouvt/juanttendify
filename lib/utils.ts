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

