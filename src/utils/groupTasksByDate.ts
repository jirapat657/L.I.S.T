// src/utils/groupTasksByDate.ts
import { Timestamp } from "firebase/firestore";

export type DateLike = Timestamp | Date | string | null | undefined;

export function toDateSafe(value: DateLike): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function groupTasksByDate<T extends { createdAt?: DateLike }>(
  tasks: T[]
): Record<string, T[]> {
  return tasks.reduce<Record<string, T[]>>((acc, item) => {
    const dateObj = toDateSafe(item.createdAt);
    const dateStr = dateObj.toISOString().slice(0, 10); // yyyy-mm-dd
    (acc[dateStr] ??= []).push(item);
    return acc;
  }, {});
}
