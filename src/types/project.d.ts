// src/types/project.d.ts
import { Timestamp } from 'firebase/firestore';

// 👇 ฟอร์มกรอกข้อมูล
export interface ProjectFormValues {
  projectId: string;
  projectName: string;
  logo?: {
    file: File;
    [key: string]: unknown;
  };
  modifiedBy: string
}

// 👇 ข้อมูลจริงที่จะเก็บใน Firestore
export interface ProjectData {
  id: string;
  projectId: string;
  projectName: string;
  logo: string | null; // ✅ เป็น URL หรือไม่มี
  createBy?: string;
  modifiedBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
