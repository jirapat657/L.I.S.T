// src/types/users.d.ts
import { Timestamp } from 'firebase/firestore';

export interface UserFormValues {
  userId: string;
  userName: string;
  email: string;
  password?: string;
  newPassword?: string;  // เพิ่มใหม่ที่นี่
  role: string;
  jobPosition: string;
  createdAt: Timestamp;
  status: 'Active' | 'Inactive';
}

export interface UserData extends Omit<UserFormValues, 'password'> {
  id: string;              // Firestore document id (อาจจะ == uid)
  uid: string;             // Auth.uid ของ Firebase (แนะนำให้ตรงกับ doc.id จะดีที่สุด)
  userId: string;          // รหัสที่แสดง เช่น LC-000001
  userName: string;
  email: string;
  role: string;
  jobPosition: string;
  status: 'Active' | 'Inactive';
  createdAt?: { seconds: number; nanoseconds: number };
}
