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
  import { db, storage } from '@/services/firebase';
  
  // ✅ Import interfaces จาก types
  import type { ProjectFormValues, ProjectData } from '@/types/project';
  
  const COLLECTION_NAME = 'LIMProjects';
  
  export const addProject = async (values: ProjectFormValues & { createBy: string }) => {

    let logoUrl = '';
    const file = values.logo?.file;

    if (file) {
      const storageRef = ref(storage, `project-logos/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      logoUrl = await getDownloadURL(snapshot.ref);
    }

    const payload = {
      projectId: values.projectId,
      projectName: values.projectName,
      logo: logoUrl,
      createBy: values.createBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = doc(db, COLLECTION_NAME, values.projectId); // ✅ ใช้ projectId เป็น doc ID
    await setDoc(docRef, payload); // ✅ ใช้ setDoc แทน addDoc

    return values.projectId; // ✅ คืน ID เดิมที่ส่งเข้าไป
  };

  export const updateProject = async (
    id: string,
    values: Partial<ProjectFormValues>
  ) => {
    let logoUrl: string | null = null;

    const file = values.logo?.file;
    if (file instanceof File) {
      const storageRef = ref(storage, `project-logos/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      logoUrl = await getDownloadURL(snapshot.ref);
    } else if (values.logo && typeof values.logo === 'string') {
      // ✅ กรณีที่ส่ง url string มา ให้เก็บ url เดิม
      logoUrl = values.logo;
    }

    const payload: Partial<ProjectData> = {
      projectId: values.projectId,
      projectName: values.projectName,
      logo: logoUrl, // <<-- เซตตรงๆไปเลย ไม่ต้อง &&!
      updatedAt: Timestamp.now(),
    };

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, payload);
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
    
  
  