// src/api/clientServiceSheet.ts

import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  orderBy,
  query,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
// [แก้ไข] นำเข้า Type สำหรับ Firestore โดยเฉพาะ
import type { ClientServiceSheet_Firestore } from '@/types/clientServiceSheet'

const COLLECTION_NAME = 'LIMClientServiceSheets'

/**
 * เพิ่ม Client Service Sheet ใหม่
 * @param values ข้อมูลที่ไม่มี id, createdAt, updatedAt (เพราะจะถูกสร้างใหม่)
 * @returns ID ของเอกสารที่ถูกสร้างขึ้น
 */
export const addClientServiceSheet = async (
  values: Omit<ClientServiceSheet_Firestore, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  // [ปรับปรุง] ใช้ addDoc เพื่อให้ Firestore สร้าง ID ให้อัตโนมัติและโค้ดกระชับขึ้น
  const colRef = collection(db, COLLECTION_NAME)
  
  const payload = {
    ...values,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }

  const docRef = await addDoc(colRef, payload)
  
  // อัปเดตเอกสารด้วย ID ของตัวเองเพื่อให้ง่ายต่อการ query ในอนาคต
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id
}

/**
 * อัปเดต Client Service Sheet
 * @param id ID ของเอกสารที่ต้องการอัปเดต
 * @param values ข้อมูลส่วนที่ต้องการอัปเดต
 */
export const updateClientServiceSheet = async (
  id: string,
  // [แก้ไข] Type ของ values ควรเป็น Partial และไม่ควรมี id
  values: Partial<Omit<ClientServiceSheet_Firestore, 'id'>>
) => {
  const docRef = doc(db, COLLECTION_NAME, id)
  const payload = {
    ...values,
    updatedAt: Timestamp.now(),
  }
  await updateDoc(docRef, payload)
}

/**
 * ลบ Client Service Sheet
 * @param id ID ของเอกสารที่ต้องการลบ
 */
export const deleteClientServiceSheet = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id)
  await deleteDoc(docRef)
}

/**
 * ดึง Client Service Sheet ทั้งหมด (เรียงตามวันที่สร้างใหม่สุดก่อน)
 * @returns Array ของ Client Service Sheet
 */
export const getClientServiceSheets = async (): Promise<ClientServiceSheet_Firestore[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  // [แก้ไข] ระบุ Type ที่ return ให้ชัดเจน
  return snapshot.docs.map(doc => doc.data() as ClientServiceSheet_Firestore)
}

/**
 * ดึง Client Service Sheet ตาม id
 * @param id ID ของเอกสารที่ต้องการ
 * @returns ข้อมูลเอกสาร หรือ null หากไม่พบ
 */
export const getClientServiceSheetById = async (id: string): Promise<ClientServiceSheet_Firestore | null> => {
  const docRef = doc(db, COLLECTION_NAME, id)
  const docSnap = await getDoc(docRef)
  // [แก้ไข] ระบุ Type ที่ return ให้ชัดเจน
  return docSnap.exists() ? (docSnap.data() as ClientServiceSheet_Firestore) : null
}