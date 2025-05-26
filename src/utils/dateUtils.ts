// src/utils/dateUtils.ts
import dayjs, { Dayjs } from 'dayjs';

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
