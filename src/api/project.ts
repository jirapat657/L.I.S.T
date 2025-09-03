// src/api/project.ts
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    orderBy,
    setDoc,
    getDoc,
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { auth, db, storage } from '@/services/firebase';
  
  // ✅ Import interfaces จาก types
  import type { ProjectFormValues, ProjectData } from '@/types/project';
  
  const COLLECTION_NAME = 'LIMProjects';
  
  export const addProject = async (values: ProjectFormValues & { createBy: string }) => {
    // กำหนดค่าเริ่มต้นสำหรับ logo
    let logoUrl: string | null = null; // ใช้ null แทน empty string เพื่อความชัดเจน

    // กรณีที่มีการอัปโหลดไฟล์โลโก้
    if (values.logo && typeof values.logo === 'object' && values.logo.file) {
      const file = values.logo.file;
      const storageRef = ref(storage, `project-logos/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      logoUrl = await getDownloadURL(snapshot.ref);
    } 
    // กรณีส่ง URL มาโดยตรง (เพื่อความสอดคล้องกับ type ที่ปรับแล้ว)
    else if (typeof values.logo === 'string') {
      logoUrl = values.logo;
    }

    const payload: ProjectData = {
      id: values.projectId, // ใส่ id ไว้ด้วยเพื่อความครบถ้วน
      projectId: values.projectId,
      projectName: values.projectName,
      logo: logoUrl,
      createBy: values.createBy,
      modifiedBy: values.createBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = doc(db, COLLECTION_NAME, values.projectId);
    await setDoc(docRef, payload);

    return values.projectId;
  };

  export const updateProject = async (
    id: string,
    values: Partial<ProjectFormValues>
  ) => {
    // เตรียม payload พื้นฐาน
    const payload: Partial<ProjectData> = {
      projectId: values.projectId,
      projectName: values.projectName,
      modifiedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'ไม่ทราบผู้ใช้',
      updatedAt: Timestamp.now(),
    };

    // จัดการโลโก้ 3 กรณี
    if (values.logo === null) {
      // กรณีลบโลโก้
      payload.logo = null;
    } else if (typeof values.logo === 'object' && values.logo?.file) {
      // กรณีอัปโหลดไฟล์ใหม่
      const storageRef = ref(storage, `project-logos/${Date.now()}-${values.logo.file.name}`);
      const snapshot = await uploadBytes(storageRef, values.logo.file);
      payload.logo = await getDownloadURL(snapshot.ref);
    } else if (typeof values.logo === 'string') {
      // กรณีใช้ URL เดิม (ไม่เปลี่ยนแปลง)
      payload.logo = values.logo;
    }
    // ถ้าไม่ส่ง logo มา = ไม่ต้องอัปเดตโลโก้

    await updateDoc(doc(db, COLLECTION_NAME, id), payload);
  };

  
  export const deleteProject = async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  };
  
  export const getProjects = async (): Promise<ProjectData[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProjectData));
  };
  
  export const checkProjectIdExists = async (projectId: string): Promise<boolean> => {
    const docRef = doc(db, COLLECTION_NAME, projectId);
    const snap = await getDoc(docRef);
    return snap.exists();
  };
    
  
 export const getAllProjects = async (): Promise<ProjectData[]> => {
  const snapshot = await getDocs(collection(db, 'LIMProjects'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ProjectData));
};