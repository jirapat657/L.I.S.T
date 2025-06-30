import { db } from '@/services/firebase';
import { collection, doc, deleteDoc, getDocs, query, CollectionReference, type DocumentData, addDoc, updateDoc } from 'firebase/firestore';
import type { OtherDocumentPayload, OtherDocumentData } from '@/types/otherDocument';
import { getAuth } from 'firebase/auth'; // Firebase Authentication

// ฟังก์ชันสำหรับดึงข้อมูลทั้งหมด
export const getAllOtherDocuments = async (): Promise<OtherDocumentData[]> => {
  const documentsCollection = collection(db, 'LIMOtherDocuments');
  const q = query(documentsCollection);
  const querySnapshot = await getDocs(q);
  const documents: OtherDocumentData[] = [];
  querySnapshot.forEach((doc) => {
    documents.push({ id: doc.id, ...doc.data() } as OtherDocumentData);
  });
  return documents;
};

// ฟังก์ชันสำหรับสร้างเอกสารใหม่
export const createOtherDocument = async (payload: OtherDocumentPayload): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const collectionRef: CollectionReference<DocumentData> = collection(db, 'LIMOtherDocuments'); // กำหนดชื่อคอลเล็กชัน
  await addDoc(collectionRef, {
    ...payload,
    createdAt: new Date(),
    createdBy: {
      uid: user.uid,
      fullName: user.email,
    },
  });
};

// ฟังก์ชันสำหรับอัปเดตเอกสาร
export const updateOtherDocumentById = async (id: string, payload: OtherDocumentPayload): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { ...updateData } = payload;

  const documentRef = doc(db, 'LIMOtherDocuments', id);
  
  // อัปเดตข้อมูลใน Firestore พร้อมข้อมูลที่เกี่ยวข้องกับเวลาและผู้ใช้ที่ทำการอัปเดต
  await updateDoc(documentRef, {
    ...updateData, // ส่งข้อมูลที่ไม่รวม docId
    updatedAt: new Date(),
    updatedBy: {
      uid: user.uid,
      fullName: user.email,
    },
  });
};

// ฟังก์ชันสำหรับลบเอกสาร
export const deleteOtherDocumentById = async (id: string): Promise<void> => {
  const documentRef = doc(db, 'LIMOtherDocuments', id);
  await deleteDoc(documentRef);
};
