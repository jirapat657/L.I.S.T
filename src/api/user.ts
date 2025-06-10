// src/api/user.ts
import {
  collection,
  deleteDoc,
  doc,
  query,
  updateDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { UserFormValues, UserData } from '@/types/users';
import axios from 'axios';

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

// สร้าง user ใหม่ (เชื่อม API backend หรือ Cloud Function)
export async function createUser(values: {
  email: string;
  password: string;
  userName: string;
  jobPosition: string;
  role: string;    // "Admin" สำหรับ admin ใหญ่
  status: string;
  userId: string;
}) {
  const res = await axios.post('/api/createUser', values);
  return res.data;
}

// อัพเดต Auth+Firestore (สำหรับ admin ใหญ่)
export const updateUserBySuperAdmin = async (params: {
  uid: string;                // ใช้ uid (Auth) ที่ตรงกับ Firestore doc.id (แนะนำ)
  email?: string;
  displayName?: string;
  password?: string;
  firestoreData?: unknown;        // object ฟิลด์ที่ต้องการอัพเดตใน Firestore
}) => {
  const res = await axios.post('/api/updateUserBySuperAdmin', params);
  return res.data;
};

// อัพเดตข้อมูล user (Firestore เท่านั้น) ใช้สำหรับ user ปกติหรือแก้ไขตัวเอง
export const updateUser = async (
  id: string, // doc.id (ควร == uid)
  values: Partial<Omit<UserFormValues, 'userId' | 'createdAt' | 'status'>>
) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, values);
};

// เปลี่ยน status ของ user (Active/Inactive)
export const updateUserStatus = async (id: string, status: 'Active' | 'Inactive') => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { status });
};

// ลบ user (Firestore เท่านั้น)
export const deleteUser = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

// ดึง user ทั้งหมด (full fields)
export const getUsers = async (): Promise<UserData[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<UserData, 'id'>),
  }));
};

// ดึง user ด้วยอีเมล
export const getUserByEmail = async (email: string): Promise<UserData | null> => {
  const q = query(collection(db, COLLECTION_NAME), where('email', '==', email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<UserData, 'id'>),
  };
};
