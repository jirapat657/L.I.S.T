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
    console.log("🧾 logo (UploadFile[]):", values.logo);
    console.log("📦 originFileObj:", values.logo?.[0]?.originFileObj);

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
    let logoUrl = '';

    const file = values.logo?.file;
    if (file instanceof File) {
      const storageRef = ref(storage, `project-logos/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      logoUrl = await getDownloadURL(snapshot.ref);
    }

    const { logo, ...rest } = values;
    const payload: Partial<ProjectData> = {
      ...rest,
      ...(logoUrl && { logo: logoUrl }),
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
    
  
  