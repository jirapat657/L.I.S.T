// src/types/project.d.ts
import { Timestamp } from 'firebase/firestore';
import type { UploadFile } from 'antd/es/upload/interface';

// 👇 ฟอร์มกรอกข้อมูล
export interface ProjectFormValues {
  projectId: string;
  projectName: string;
  logo?: {
    file: File;
    [key: string]: any;
  };
}

// 👇 ข้อมูลจริงที่จะเก็บใน Firestore
export interface ProjectData {
  id: string;
  projectId: string;
  projectName: string;
  logo: string | null; // ✅ เป็น URL หรือไม่มี
  createBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
