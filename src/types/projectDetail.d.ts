// src/types/projectDetail.d.ts
import type { Dayjs } from 'dayjs';

export interface Issue {
  id: string;
  issueCode: string;
  issueDate: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  dueDate: string;
  completeDate: string;
  onLateTime: string;
  developer: string;
  baTest: string;
  remark: string;
  document: string;
}

export interface Filters {
  issueCode: string;
  issueDate: Dayjs | null;
  title: string;
  status: string;
  startDate: Dayjs | null;
  dueDate: Dayjs | null;
  completeDate: Dayjs | null;
  developer: string;
  baTest: string;
}
