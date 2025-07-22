// src/api/issue.ts
import { db } from '@/services/firebase'
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
  getDoc,
  doc,
} from 'firebase/firestore'

// ✅ นำเข้า types
import type { IssueFormValues, SubtaskData, IssueData, Subtask } from '@/types/issue'

import { removeUndefined } from '@/utils/object'

const COLLECTION_NAME = 'LIMIssues'

// ======================
// MAIN ISSUE FUNCTIONS
// ======================

// ✅ เพิ่ม Issue พร้อม Subtasks (เป็น subcollection)
export const addIssue = async (
  data: IssueFormValues & { projectId?: string; projectCode?: string },
  subtasks: SubtaskData[] = []
) => {
  const ref = collection(db, COLLECTION_NAME)

  const issueDoc = await addDoc(
    ref,
    removeUndefined({
      ...data,
      ...(data.projectId && { projectId: data.projectId }), // ✅ ใส่เฉพาะถ้ามี
      ...(data.projectCode && { projectCode: data.projectCode }), // ✅ ใส่เฉพาะถ้ามี
      createdAt: Timestamp.now(),
    })
  )

  for (const sub of subtasks) {
    await addDoc(
      collection(db, COLLECTION_NAME, issueDoc.id, 'subtasks'),
      removeUndefined({
        ...sub,
        createdAt: sub.createdAt,
      })
    )
  }
}

// ดึง issue ทั้งหมดในโปรเจกต์นั้น (โดยอิงจาก doc.id)
export const getIssuesByProjectId = async (projectId: string): Promise<IssueData[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('projectId', '==', projectId), // ✅ ใช้ doc.id ที่แน่นอน
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as IssueData)
  )
}

export const getIssuesByProjectCode = async (projectCode: string): Promise<IssueData[]> => {
  const q = query(
    collection(db, 'LIMIssues'),
    where('projectId', '==', projectCode), // 🔍 ใช้รหัสของโปรเจกต์ เช่น GG2
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as IssueData)
  )
}

// ======================
// SUBTASK FUNCTIONS
// ======================

// ✅ ดึง subtasks ของ Issue
export const getSubtasksByIssueId = async (issueId: string): Promise<Subtask[]> => {
  const q = query(collection(db, COLLECTION_NAME, issueId, 'subtasks'), orderBy('createdAt', 'asc'))

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Subtask, 'id'>),
  }))
}

// ✅ แก้ไข Subtask รายตัว
export const updateSubtask = async (
  issueId: string,
  subtaskId: string,
  updates: Partial<SubtaskData>
) => {
  const ref = doc(db, COLLECTION_NAME, issueId, 'subtasks', subtaskId)
  await updateDoc(ref, removeUndefined(updates) as Partial<IssueData>)
}

// ✅ ลบ Subtask รายตัว
export const deleteSubtask = async (issueId: string, subtaskId: string) => {
  const ref = doc(db, COLLECTION_NAME, issueId, 'subtasks', subtaskId)
  await deleteDoc(ref)
}

// ==========
// view issue
// ==========
export const getIssueById = async (id: string): Promise<IssueData | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id) // ✅ path ถูก
    const docSnap = await getDoc(docRef)

    console.log('🔍 Fetching issue with ID:', id)
    console.log('📄 Found:', docSnap.exists())
    if (!docSnap.exists()) return null

    const issueData = { id: docSnap.id, ...docSnap.data() } as IssueData

    const subtaskSnap = await getDocs(collection(docRef, 'subtasks'))
    const subtasks = subtaskSnap.docs.map((s) => ({
      id: s.id,
      ...(s.data() as Omit<Subtask, 'id'>),
    }))

    return { ...issueData, subtasks: subtasks ?? [] }
  } catch (error) {
    console.error('❌ Error loading issue by ID:', error)
    return null
  }
}

// ==========
// edit issue
// ==========
export const updateIssue = async (id: string, data: Partial<IssueData>) => {
  const ref = doc(db, COLLECTION_NAME, id)
  await updateDoc(ref, removeUndefined(data) as Partial<IssueData>)
}

export const addSubtask = async (issueId: string, subtask: Omit<Subtask, 'id'>) => {
  const ref = collection(db, COLLECTION_NAME, issueId, 'subtasks')
  await addDoc(
    ref,
    removeUndefined({
      ...subtask,
      createdAt: subtask.createdAt,
    })
  )
}

// ==========
// Delete Issue
// ==========
export const deleteIssue = async (issueId: string) => {
  try {
    // 1. ลบ Subtasks ทั้งหมดของ Issue นี้ก่อน (ถ้ามี)
    const subtasksRef = collection(db, COLLECTION_NAME, issueId, 'subtasks');
    const subtasksSnapshot = await getDocs(subtasksRef);
    
    // ลบ subtasks ทีละตัว
    const deleteSubtaskPromises = subtasksSnapshot.docs.map((doc) => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deleteSubtaskPromises);

    // 2. ลบ Issue หลัก
    const issueRef = doc(db, COLLECTION_NAME, issueId);
    await deleteDoc(issueRef);

    return true;
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw error;
  }
};


// ==========
// Dashboard
// ==========
// ✅ ดึงทุก issue โดยไม่ filter (สำหรับ dashboard)
export const getAllIssues = async (): Promise<IssueData[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as IssueData)
  )
}


// ฟังก์ชันดึง issues โดยใช้ projectName
export const getIssuesByProjectName = async (projectName: string): Promise<IssueData[]> => {
  // ดึงข้อมูล projectId จาก projectName
  const projectsQuery = query(
    collection(db, 'LIMProjects'),
    where('projectName', '==', projectName) // ค้นหาจาก projectName
  )
  const projectsSnapshot = await getDocs(projectsQuery)

  if (projectsSnapshot.empty) {
    console.error('No project found with that name');
    return [] // หากไม่พบ project ให้ส่งกลับ array ว่าง
  }

  // ดึง projectId จากข้อมูลที่ค้นพบ
  const projectId = projectsSnapshot.docs[0].id
  const projectData = projectsSnapshot.docs[0].data(); // ดึงข้อมูลของโปรเจกต์

  // ใช้ projectId เพื่อดึง issues จาก LIMIssues
  const issuesQuery = query(
    collection(db, COLLECTION_NAME),
    where('projectId', '==', projectId), // กรองด้วย projectId
    orderBy('createdAt', 'desc')
  )

  const issuesSnapshot = await getDocs(issuesQuery)

  // เพิ่ม projectName เข้าไปในแต่ละ issue
  const issuesWithProjectName = issuesSnapshot.docs.map((doc) => {
    const issueData = doc.data();
    return {
      id: doc.id,
      ...issueData,
      projectName: projectData.projectName,  // เพิ่ม projectName ที่ดึงมาจาก LIMProjects
    } as IssueData;
  });

  return issuesWithProjectName;
}

