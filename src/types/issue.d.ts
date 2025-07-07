// src/types/issue.d.ts
import { Timestamp } from 'firebase/firestore';

export interface IssueFormValues {
  projectId: string;
  issueCode: string;
  issueDate: Timestamp;
  title?: string;
  description?: string;
  type?: string;       
  priority?: string;   
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
  subtasks?: Subtask[]; 
}

export interface SubtaskData {
  id?: string; // เพิ่มได้แม้ใน Firestore จะไม่ได้ใช้
  details: string;
  date?: Timestamp | null;
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
  type?: string;       
  priority?: string;   
  status?: string;
  startDate?: Dayjs;
  dueDate?: Dayjs;
  completeDate?: Dayjs;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
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
  type?: string;       
  priority?: string;   
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