// src/api/user.ts
import { doc, updateDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';  // ใช้ Firebase SDK
import { db, functions } from '@/services/firebase';  // ใช้ FirebaseApp ที่เชื่อมกับ SDK
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

// สร้าง user ใหม่ (ใช้ Cloud Function)
export async function createUser(values: {
  email: string;
  password: string;
  userName: string;
  jobPosition: string;
  role: string;
  status: string;
  userId: string;
}) {
  const payload = {
    ...values,
    email: values.email.trim().toLowerCase(),
  };

  try {
    const createUserFunction = httpsCallable(functions, 'createUser'); // ฟังก์ชัน Cloud Function
    const res = await createUserFunction(payload);  // เรียก Cloud Function
    return res.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

// อัปเดตรหัสผ่านและข้อมูลผู้ใช้ (เฉพาะ Admin)
export const updateUserPasswordByAdmin = async (
  uid: string,
  newPassword: string,
  firestoreData: object,
  idToken: string
) => {
  try {
    const updateUserPasswordByAdminFunction = httpsCallable(functions, 'updateUserPasswordByAdmin');
    const res = await updateUserPasswordByAdminFunction({ uid, newPassword, firestoreData, idToken });
    return res.data;
  } catch (error) {
    console.error('Error updating user password:', error);
    throw new Error('Failed to update user password');
  }
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
    ...(doc.data() as Omit<UserData, 'id'>), // ข้อมูลจาก Firestore
  }));

  console.log("Fetched Users:", users);  // ตรวจสอบข้อมูลที่ดึงมา
  return users;
};

