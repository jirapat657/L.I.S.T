// src/types/issue.d.ts
import { Timestamp } from 'firebase/firestore';

export interface IssueFormValues {
  projectId: string;
  issueCode: string;
  issueDate: Timestamp;
  title?: string;
  description?: string;
  status?: string;
  startDate?: Timestamp | null;
  dueDate?: Timestamp | null;
  completeDate?: Timestamp | null;
  onLateTime?: string;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
  createdAt: Timestamp;
  subtasks?: Subtask[]; // ✅ เชื่อมตรงนี้
}

export interface SubtaskData {
  details: string;
  date: Timestamp | null;
  completeDate?: Timestamp | null;
  baTest?: string;
  status?: string;
  remark?: string;
  createdAt?: Timestamp;
}


export interface FormValues {
  issueCode: string;
  issueDate?: Dayjs;
  title?: string;
  description?: string;
  status?: string;
  startDate?: Dayjs;
  dueDate?: Dayjs;
  completeDate?: Dayjs;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
}

export interface RowData {
  key: string;
  details: string;
  date: Dayjs;
  completeDate?: Dayjs;
  baTest?: string;
  status?: string;
  remark?: string;
  showFull?: boolean;
}

export interface Subtask {
  id: string;
  details: string;
  date?: Timestamp | null;
  completeDate?: Timestamp | null;
  baTest?: string;
  status?: string;
  remark?: string;
  createdAt?: Timestamp
}

export interface IssueData {
  id: string;
  projectId: string;
  issueCode: string;
  issueDate: Timestamp;
  title: string;
  description: string;
  status: string;
  startDate?: Timestamp | null;
  dueDate?: Timestamp | null;
  completeDate?: Timestamp | null;
  onLateTime?: string;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
  createdAt: Timestamp;
  subtasks?: Subtask[];
}