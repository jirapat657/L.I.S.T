// src/utils/dateUtils.ts
import dayjs, { Dayjs } from 'dayjs';
import type { Timestamp } from 'firebase/firestore';

/**
 * คืนข้อความ “On Time” หรือ “Late Time” พร้อมจำนวนวัน
 */
export const calculateOnLateTime = (
  completeDate?: Dayjs | Date | null,
  dueDate?: Dayjs | Date | null
): string => {
  if (!completeDate || !dueDate) return '';

  const c = dayjs(completeDate);
  const d = dayjs(dueDate);
  const diff = c.diff(d, 'day'); // + ถ้าเกินกำหนด  − หรือ 0 = ตรงเวลา/ก่อนกำหนด

  if (isNaN(diff)) return '';

  return diff <= 0
    ? `On Time (${Math.abs(diff)} Day)`
    : `Late Time (${diff} Day)`;
};

export const formatTimestamp = (
  value: Timestamp | string | null | undefined
): string => {
  if (!value) return '-';

  if (typeof value === 'string') {
    return dayjs(value).format('DD/MM/YY');
  }

  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return dayjs(value.toDate()).format('DD/MM/YY');
  }

  return '-';
};

/**
 * แปลง Firebase Timestamp → Dayjs อย่างปลอดภัย
 */
export const safeDate = (
  date: Timestamp | null | undefined
): Dayjs | null => {
  return date?.toDate ? dayjs(date.toDate()) : null;
};
