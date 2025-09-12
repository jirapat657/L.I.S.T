// /types/otherDocument.ts
import type { Dayjs } from 'dayjs';
import { Timestamp } from 'firebase/firestore';

// ข้อมูลเอกสารในฐานข้อมูล (ข้อมูลที่ดึงจาก Firestore)
export interface OtherDocumentData {
  id: string;
  docNo: string;
  docDate: Timestamp | null;
  docType: string;
  project: string;
  projectId?: string; 
  customer: string;
  description: string;
  remark?: string;
  files?: FileData[];
  createdAt: Timestamp;
}

// ข้อมูลเอกสารที่ต้องการส่งไปยัง Firestore (สำหรับการสร้าง/อัปเดต)
export interface OtherDocumentPayload {
  docNo: string;
  docDate: Timestamp | null;
  docType: string;
  project: string;
  projectId: string; 
  customer: string;
  description: string;
  remark?: string | null; // ใช้ null แทน undefined เพื่อความชัดเจน
  files?: FileData[];
  createdAt: Timestamp;
  createBy: string;  // เพิ่ม 'createBy' เพื่อเก็บชื่อผู้สร้างเอกสาร
}

// ข้อมูลฟอร์มที่ใช้งานใน Modal
export interface OtherDocumentFormValues {
  docNo: string;
  docDate: Dayjs | null;
  docType: string;
  project: string;
  projectId: string; 
  customer: string;
  description: string;
  remark?: string | null;
  files?: FileData[];
  newType?: string;  // เพิ่มฟิลด์ newType เพื่อรองรับกรอกประเภทใหม่
}

// ข้อมูลไฟล์ที่อัปโหลด
export interface FileData {
  name: string;
  url: string;
}
