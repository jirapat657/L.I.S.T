// src/api/projectChangeRequest.ts
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
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { ProjectChangeRequest_Firestore } from '@/types/projectChangeRequest';

const COLLECTION_NAME = 'LIMProjectChangeRequests';

/**
 * เพิ่ม Project Change Request ใหม่
 * @param values ข้อมูลที่ไม่มี id, createdAt, updatedAt
 * @returns ID ของเอกสารที่ถูกสร้างขึ้น
 */
export const addProjectChangeRequest = async (
  values: Omit<ProjectChangeRequest_Firestore, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const colRef = collection(db, COLLECTION_NAME);
  
  const payload = {
    ...values,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(colRef, payload);
  
  // อัปเดตเอกสารด้วย ID ของตัวเอง
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id;
};

/**
 * อัปเดต Project Change Request
 * @param id ID ของเอกสารที่ต้องการอัปเดต
 * @param values ข้อมูลส่วนที่ต้องการอัปเดต
 */
export const updateProjectChangeRequest = async (
  id: string,
  values: Partial<Omit<ProjectChangeRequest_Firestore, 'id'>>
) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const payload = {
    ...values,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(docRef, payload);
};

/**
 * ลบ Project Change Request
 * @param id ID ของเอกสารที่ต้องการลบ
 */
export const deleteProjectChangeRequest = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

/**
 * ดึง Project Change Request ทั้งหมด (เรียงตามวันที่สร้างใหม่สุดก่อน)
 * @returns Array ของ Project Change Request
 */
export const getProjectChangeRequests = async (): Promise<ProjectChangeRequest_Firestore[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ProjectChangeRequest_Firestore);
};

/**
 * ดึง Project Change Request ตาม id
 * @param id ID ของเอกสารที่ต้องการ
 * @returns ข้อมูลเอกสาร หรือ null หากไม่พบ
 */
export const getProjectChangeRequestById = async (id: string): Promise<ProjectChangeRequest_Firestore | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as ProjectChangeRequest_Firestore) : null;
};
