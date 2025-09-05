// src/types/scope.ts
import { Dayjs } from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import type { UploadFile } from 'antd/es/upload/interface';

// ใช้ใน <Form />
export interface ScopeFormValues {
  docNo: string;
  docDate: Dayjs | null;
  docType: string;
  project: string;
  customer: string;
  description: string;
  remark?: string;
  files?: UploadFile[];
}

export interface FileData {
  name: string
  url: string
}

// ใช้กับ Firestore
export interface ScopeData {
  id: string; // ใช้เมื่อดึงจาก Firestore
  docNo: string;
  docDate: Timestamp | null;
  docType: string;
  project: string;
  projectId: string; // ✅ เพิ่มตรงนี้
  customer: string;
  description: string;
  remark?: string;
  files?: FileData[]; // ลิงก์ไฟล์ที่อัปโหลดแล้ว
  createdAt: Timestamp;
}

// ใช้ใน <Form />
export interface ScopePayload {
  docNo: string;
  docDate: Timestamp | null;
  docType: string;
  project: string;
  customer: string;
  description: string;
  remark?: string;
  files?: FileData[];
  createdAt: Timestamp;
}

