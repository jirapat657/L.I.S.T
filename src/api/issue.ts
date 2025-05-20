// src/api/issue.ts
import { db } from '@/services/firebase';
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface IssueFormValues {
  projectId: string;
  issueCode: string;
  issueDate: Timestamp;
  title?: string;
  description?: string;
  status?: string;
  startDate?: Timestamp;
  dueDate?: Timestamp;
  completeDate?: Timestamp;
  onLateTime?: string;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
}

export const addIssue = async (data: IssueFormValues) => {
    const ref = collection(db, 'lucasIssues');
    await addDoc(ref, {
      ...data,
      createdAt: Timestamp.now(), // ✅ เพิ่ม createdAt ตอน add
    });
  };
  

// ✅ ดึงข้อมูลทั้งหมดในโปรเจกต์เดียว โดยเรียงจาก issueDate ใหม่ → เก่า
export const getIssuesByProjectId = async (projectId: string) => {
  const q = query(
    collection(db, 'lucasIssues'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc') // ✅ เรียงจากใหม่ไปเก่า
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
