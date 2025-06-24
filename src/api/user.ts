// src/api/user.ts
import { doc, updateDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';  // ใช้ FirebaseApp ที่เชื่อมกับ SDK
import type { UserData } from '@/types/users';

// ชื่อ Collection ใน Firestore
const COLLECTION_NAME = 'LIMUsers';

// ดึง user ทั้งหมด (เฉพาะ id กับ userName)
export const getAllUsers = async (): Promise<{ id: string; userName: string }[]> => {
  const ref = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userName: data.userName || '', // เผื่อไม่มีฟิลด์ userName
    };
  });
};


// เปลี่ยน status ของ user (Active/Inactive)
export const updateUserStatus = async (id: string, status: 'Active' | 'Inactive') => {
  const docRef = doc(db, COLLECTION_NAME, id);
  try {
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status');
  }
};

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
    uid: doc.id, // ใช้ doc.id เป็น uid
    ...(doc.data() as Omit<UserData, 'id'>), // ข้อมูลจาก Firestore
  }));

  console.log("Fetched Users:", users);  // ตรวจสอบข้อมูลที่ดึงมา
  return users;
};

