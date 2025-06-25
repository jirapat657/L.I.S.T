// src/api/user.ts
import { doc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';  // ใช้ FirebaseApp ที่เชื่อมกับ SDK
import type { UserData } from '@/types/users';

// ชื่อ Collection ใน Firestore
const COLLECTION_NAME = 'LIMUsers';

// ลบ user (Firestore เท่านั้น)
export const deleteUser = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

export const getUsers = async (): Promise<UserData[]> => {
  const snapshot = await getDocs(collection(db, 'LIMUsers')); // ดึงข้อมูลจาก Firestore
  const users = snapshot.docs.map((doc) => ({
    id: doc.id,
    // ใช้ doc.id เป็น uid
    ...(doc.data() as Omit<UserData, 'id'>), // ข้อมูลจาก Firestore
  }));

  console.log("Fetched Users:", users);  // ตรวจสอบข้อมูลที่ดึงมา
  return users;
};

