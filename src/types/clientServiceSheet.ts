// src/types/clientServiceSheet.ts

import type { Timestamp } from 'firebase/firestore'

export interface ServiceTask {
  id: string
  description: string
  type: string
  status: string
  serviceBy: string
}

export type ChargeFlag = 'included' | 'free' | 'extra'

// --- Type สำหรับข้อมูลที่มาจาก Firestore ---
export type PartyInfo_Firestore = {
  company?: string;
  name?: string;
  date?: Timestamp | null; // Date is a Timestamp
  signature?: string;
};

export type ClientServiceSheet_Firestore = {
  id: string; // ID ของเอกสาร
  projectName?: string;
  jobCode?: string;
  date?: Timestamp | null; // Date is a Timestamp
  user?: string;
  totalHours?: string | number;
  serviceLocation?: string;
  startTime?: string;
  endTime?: string;
  tasks?: ServiceTask[];
  remark?: string;
  customerInfo?: PartyInfo_Firestore;
  serviceByInfo?: PartyInfo_Firestore;
  chargeTypes?: ('included' | 'free' | 'extra')[];
  extraChargeDescription?: string;
};

// --- Type สำหรับข้อมูลที่จะส่งให้ PDF Component ---
export type PartyInfo_PDF = {
  company?: string;
  name?: string;
  date?: Date | string; // Date is now a Date object or string
  signature?: string;
};

export type ClientServiceSheet_PDF = {
  projectName?: string;
  jobCode?: string;
  date?: Date | string; // Date is now a Date object or string
  user?: string;
  totalHours?: string | number;
  serviceLocation?: string;
  startTime?: string;
  endTime?: string;
  tasks?: ServiceTask[];
  remark?: string;
  customerInfo?: PartyInfo_PDF;
  serviceByInfo?: PartyInfo_PDF;
  chargeTypes?: ('included' | 'free' | 'extra')[];
  extraChargeDescription?: string;
};