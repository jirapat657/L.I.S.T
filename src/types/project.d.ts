// src/types/project.d.ts
import { Timestamp } from 'firebase/firestore';

// 👇 ฟอร์มกรอกข้อมูล - ปรับให้รองรับทั้ง File และ URL
export interface ProjectFormValues {
  projectId: string;
  projectName: string;
  logo?: {
    file: File;
  } | string | null; // ✅ รับได้ทั้งไฟล์ใหม่, URL เดิม, หรือต้องการลบ
  modifiedBy?: string; // ทำให้เป็น optional เพราะบางครั้งไม่ต้องส่ง
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
