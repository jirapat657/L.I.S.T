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
  where,
  limit as qLimit,
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

// ปรับตาม type ที่คุณใช้จริง
export type ClientServiceSheetDoc = {
  id: string;
  jobCode?: string;     // เช่น "PRJ123-05092025-007"
  projectName?: string; // ถ้าต้องการใช้งานอย่างอื่นด้วย
  // ... ฟิลด์อื่น ๆ ตามจริง
};

type GetByPrefixOptions = {
  limit?: number; // จำนวนสูงสุดที่ต้องการดึง (ดีฟอลต์ 50)
};

/**
 * ดึง service-sheets ที่ jobCode เริ่มต้นด้วย prefix ที่กำหนด
 * ตัวอย่าง prefix = "{projectId}-{DDMMYYYY}"  (ยังไม่รวมเลขรัน)
 * เช่น "PRJ123-05092025"
 *
 * หมายเหตุ:
 * - ใช้ range query ด้วย where('jobCode', '>=', prefix) & where('jobCode', '<', prefix + '\uf8ff')
 * - ต้อง orderBy('jobCode') เพื่อให้ range query ใช้งานได้
 * - ควรสร้าง index ตามที่ Firestore แนะนำ (คอนโซลจะขึ้นลิงก์ให้ถ้าขาด index)
 */
export async function getServiceSheetsByPrefix(
  prefix: string,
  options?: GetByPrefixOptions
): Promise<ClientServiceSheetDoc[]> {
  const col = collection(db, COLLECTION_NAME);
  const upperBound = prefix + '\uf8ff';

  const q = query(
    col,
    where('jobCode', '>=', prefix),
    where('jobCode', '<', upperBound),
    orderBy('jobCode', 'asc'),
    qLimit(options?.limit ?? 50)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Omit<ClientServiceSheetDoc, 'id'>;
    return { id: d.id, ...data };
  });
}