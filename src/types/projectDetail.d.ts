// src/types/projectDetail.d.ts
import type { Dayjs } from 'dayjs';

export interface Issue {
  id: string;
  issueCode: string;
  issueDate?: string | Timestamp | null;
  title: string;
  description: string;
  status: string;
  startDate?: string | Timestamp | null;
  dueDate?: string | Timestamp | null;
  completeDate?: string | Timestamp | null;
  onLateTime?: string;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
  projectId: string;
  projectName?: string;
}

export interface Filters {
  keyword: string;
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
