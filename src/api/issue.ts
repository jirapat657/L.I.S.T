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
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

// ======================
// INTERFACES
// ======================

export interface IssueFormValues {
  projectId: string;
  issueCode: string;
  issueDate: Timestamp;
  title?: string;
  description?: string;
  status?: string;
  startDate?: Timestamp | null;
  dueDate?: Timestamp | null;
  completeDate?: Timestamp | null;
  onLateTime?: string;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
}

export interface SubtaskData {
  details: string;
  date: Timestamp | null;
  completeDate?: Timestamp | null;
  baTest?: string;
  status?: string;
  remark?: string;
}

// ======================
// MAIN ISSUE FUNCTIONS
// ======================

// ✅ เพิ่ม Issue พร้อม Subtasks (เป็น subcollection)
export const addIssue = async (
  data: IssueFormValues,
  subtasks: SubtaskData[] = []
) => {
  const ref = collection(db, 'lucasIssues');

  // เพิ่ม issue หลัก
  const issueDoc = await addDoc(ref, {
    ...data,
    createdAt: Timestamp.now(),
  });

  // เพิ่ม subtasks ใน subcollection
  for (const sub of subtasks) {
    await addDoc(
      collection(db, 'lucasIssues', issueDoc.id, 'subtasks'),
      {
        ...sub,
        createdAt: Timestamp.now(),
      }
    );
  }
};

// ✅ ดึงข้อมูล issue ตาม projectId เรียงจากใหม่ → เก่า
export const getIssuesByProjectId = async (projectId: string) => {
  const q = query(
    collection(db, 'lucasIssues'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ======================
// SUBTASK FUNCTIONS
// ======================

// ✅ ดึง subtasks ของ Issue
export const getSubtasksByIssueId = async (issueId: string) => {
  const q = query(
    collection(db, 'lucasIssues', issueId, 'subtasks'),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ✅ แก้ไข Subtask รายตัว
export const updateSubtask = async (
  issueId: string,
  subtaskId: string,
  updates: Partial<SubtaskData>
) => {
  const ref = doc(db, 'lucasIssues', issueId, 'subtasks', subtaskId);
  await updateDoc(ref, updates);
};

// ✅ ลบ Subtask รายตัว
export const deleteSubtask = async (
  issueId: string,
  subtaskId: string
) => {
  const ref = doc(db, 'lucasIssues', issueId, 'subtasks', subtaskId);
  await deleteDoc(ref);
};
