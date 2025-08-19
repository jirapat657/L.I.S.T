// src/types/projectChangeRequest.ts
import type { Timestamp } from 'firebase/firestore';

// --- Type สำหรับข้อมูลย่อยในตาราง ---
export type ChangeRequestTask = {
  id: string;
  sequence?: string;
  description?: string;
  requestedBy?: string;
  approved?: string;
};

// --- Type สำหรับข้อมูลผู้เกี่ยวข้อง (Firestore) ---
export type PartyInfo_Firestore = {
  company?: string;
  name?: string;
  date?: Timestamp | null;
  signature?: string;
};

// --- Type สำหรับข้อมูลหลัก (Firestore) ---
export type ProjectChangeRequest_Firestore = {
  id: string;
  projectName?: string;
  projectStage?: string;
  jobCode?: string;
  date?: Timestamp | null;
  tasks?: ChangeRequestTask[];
  // [เพิ่ม] เพิ่มฟิลด์สำหรับ Charge Section
  chargeTypes?: ('included' | 'free' | 'extra')[];
  extraChargeDescription?: string;
  remark?: string;
  customerInfo?: PartyInfo_Firestore;
  serviceByInfo?: PartyInfo_Firestore;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

// --- Type สำหรับข้อมูลผู้เกี่ยวข้อง (สำหรับแสดงผล เช่น PDF) ---
export type PartyInfo_PDF = {
  company?: string;
  name?: string;
  date?: Date | string;
  signature?: string;
};

// --- Type สำหรับข้อมูลหลัก (สำหรับแสดงผล เช่น PDF) ---
export type ProjectChangeRequest_PDF = {
  id: string;
  projectName?: string;
  projectStage?: string;
  jobCode?: string;
  date?: Date | string;
  tasks?: ChangeRequestTask[];
  // [เพิ่ม] เพิ่มฟิลด์สำหรับ Charge Section
  chargeTypes?: ('included' | 'free' | 'extra')[];
  extraChargeDescription?: string;
  remark?: string;
  customerInfo?: PartyInfo_PDF;
  serviceByInfo?: PartyInfo_PDF;
  createdAt?: Date;
  updatedAt?: Date;
};