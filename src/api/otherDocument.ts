import { db } from '@/services/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { OtherDocumentPayload, OtherDocumentData } from '@/types/otherDocument';
import { getAuth } from 'firebase/auth'; // Firebase Authentication

// ฟังก์ชันสำหรับดึงข้อมูลทั้งหมด
export const getAllOtherDocuments = async (): Promise<OtherDocumentData[]> => {
  const documentsCollection = collection(db, 'LIMOtherDocuments');
  const q = query(documentsCollection, orderBy('createdAt', 'desc'));
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

  const documentRef = doc(collection(db, 'LIMOtherDocuments'), uuidv4()); // สร้างเอกสารใหม่ด้วย ID ที่ไม่ซ้ำ
  const documentData = {
    ...payload,
  };
  await setDoc(documentRef, documentData);
};

// ฟังก์ชันสำหรับอัปเดตเอกสาร
export const updateOtherDocumentById = async (id: string, payload: OtherDocumentPayload): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const documentRef = doc(db, 'LIMOtherDocuments', id);
  const documentData = {
    ...payload,
  };
  await setDoc(documentRef, documentData, { merge: true });
};

// ฟังก์ชันสำหรับลบเอกสาร
export const deleteOtherDocumentById = async (id: string): Promise<void> => {
  const documentRef = doc(db, 'LIMOtherDocuments', id);
  await deleteDoc(documentRef);
};

export const getUniqueDocumentTypes = async (): Promise<string[]> => {
  const querySnapshot = await getDocs(collection(db, 'LIMOtherDocuments'));
  const docTypes = new Set<string>();

  querySnapshot.forEach(doc => {
    const docType = doc.data().docType;
    if (docType) {
      docTypes.add(docType);  // เพิ่ม docType ที่ไม่ซ้ำลงใน Set
    }
  });

  return Array.from(docTypes);  // แปลง Set กลับเป็น Array
};

export const addDocumentType = async (newType: string) => {
  try {
    // เพิ่มประเภทใหม่ลงใน Firestore
    await addDoc(collection(db, 'LIMOtherDocuments'), {
      docType: newType,  // เก็บประเภทใหม่ใน field docType
    });
  } catch (err) {
    console.error('Error adding document type: ', err);
    throw new Error('Failed to add document type');
  }
};