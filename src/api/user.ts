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
import { CF_BASE } from '@/config';

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

// สร้าง user ใหม่ (Cloud Function)
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
  const res = await axios.post(`${CF_BASE}/createUser`, payload);
  return res.data;
}


// อัปเดตรหัสผ่านและ firestore ของ user อื่น (เฉพาะ Admin เท่านั้น)
export const updateUserPasswordByAdmin = async (
  uid: string,
  newPassword: string,
  firestoreData: object,
  idToken: string
) => {
  const res = await axios.post(
    `${CF_BASE}/updateUserPasswordByAdmin`,
    { uid, newPassword, firestoreData },
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  return res.data;
};

// ฟังก์ชันในการอัปเดตข้อมูลผู้ใช้ใน Firestore
export const updateUser = async (id: string, values: Partial<UserFormValues>) => {
  const userRef = doc(db, 'LIMUsers', id);

  // ลบฟิลด์ undefined ออกทั้งหมดก่อนส่ง update
  const cleaned: Record<string, unknown> = {};
  Object.entries(values).forEach(([k, v]) => {
    if (v !== undefined) cleaned[k] = v;
  });

  try {
    // ใช้ Partial<UserFormValues> เพื่อทำให้ฟิลด์ต่าง ๆ เป็น optional
    await updateDoc(userRef, values);
    
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user in Firestore');
  }
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
