// src/api/clientServiceSheet.ts

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { ClientServiceSheetData } from '@/types/clientServiceSheet'

const COLLECTION_NAME = 'LIMClientServiceSheets'

/**
 * เพิ่ม Client Service Sheet ใหม่
 * - values ต้องแปลงวันที่ (date) เป็น Firestore Timestamp ก่อนเรียกใช้
 * - totalHours ต้องเป็น number
 */
export const addClientServiceSheet = async (
  values: Omit<ClientServiceSheetData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const colRef = collection(db, COLLECTION_NAME)
  const docRef = doc(colRef) // สร้าง doc ใหม่ ให้ id อัตโนมัติ

  // รับรองว่า date เป็น Timestamp, totalHours เป็น number
  const payload: ClientServiceSheetData = {
    ...values,
    id: docRef.id,
    date:
      typeof values.date === 'string'
        ? Timestamp.fromDate(new Date(values.date))
        : values.date ?? Timestamp.now(),
    totalHours: typeof values.totalHours === 'string'
      ? Number(values.totalHours)
      : values.totalHours,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }

  await setDoc(docRef, payload)
  return docRef.id
}

/**
 * อัปเดต Client Service Sheet (ระบุ id ที่ต้องการอัปเดต)
 * - values สามารถระบุแค่บางฟิลด์ก็ได้
 */
export const updateClientServiceSheet = async (
  id: string,
  values: Partial<ClientServiceSheetData>
) => {
  const docRef = doc(db, COLLECTION_NAME, id)
  // แปลง date เป็น Timestamp ถ้าส่งมาเป็น string
  const toUpdate: Partial<ClientServiceSheetData> = { ...values, updatedAt: Timestamp.now() }
  if (toUpdate.date && typeof toUpdate.date === 'string') {
    toUpdate.date = Timestamp.fromDate(new Date(toUpdate.date))
  }
  if (toUpdate.totalHours && typeof toUpdate.totalHours === 'string') {
    toUpdate.totalHours = Number(toUpdate.totalHours)
  }
  await updateDoc(docRef, toUpdate)
}

/**
 * ลบ Client Service Sheet
 */
export const deleteClientServiceSheet = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id)
  await deleteDoc(docRef)
}

/**
 * ดึง Client Service Sheet ทั้งหมด (เรียงตาม createdAt ใหม่สุดก่อน)
 */
export const getClientServiceSheets = async (): Promise<ClientServiceSheetData[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as ClientServiceSheetData)
}

/**
 * ดึง Client Service Sheet ตาม id
 */
export const getClientServiceSheetById = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() as ClientServiceSheetData : null
}