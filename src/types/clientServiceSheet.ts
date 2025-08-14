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

export interface PartyInfo {
  company: string | null;
  name: string | null;
  date: Timestamp | null;
  signature: string | null;
}

export interface ClientServiceSheetData {
  id?: string // เพิ่มเป็น optional สำหรับกรณีสร้างใหม่
  projectName: string
  serviceLocation: string
  startTime: string
  endTime: string
  jobCode: string
  date: Timestamp | string
  user: string
  totalHours: number

  chargeTypes?: ChargeFlag[] // เปลี่ยนเป็น optional
  extraChargeDescription?: string

  tasks?: ServiceTask[]

  remark: string | null;
  customerInfo: PartyInfo | null;
  serviceByInfo: PartyInfo | null;

  createdAt?: Timestamp // เปลี่ยนเป็น optional
  updatedAt?: Timestamp // เปลี่ยนเป็น optional
}