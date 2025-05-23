// src/api/project.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    orderBy,
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, storage } from '@/services/firebase';
  
  // ✅ Import interfaces จาก types
  import type { ProjectFormValues, ProjectData } from '@/types/project';
  
  const COLLECTION_NAME = 'LIMProjects';
  
  export const addProject = async (values: ProjectFormValues) => {
    let logoUrl = '';
  
    if (values.logo) {
      const storageRef = ref(storage, `project-logos/${Date.now()}-${values.logo.name}`);
      const snapshot = await uploadBytes(storageRef, values.logo);
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
  
    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return docRef.id;
  };
  
  export const updateProject = async (
    id: string,
    values: Partial<ProjectFormValues>
  ) => {
    let logoUrl = '';
  
    if (values.logo instanceof File) {
      const storageRef = ref(storage, `project-logos/${Date.now()}-${values.logo.name}`);
      const snapshot = await uploadBytes(storageRef, values.logo);
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
  
  // export const listenToProjects = (callback: (projects: ProjectData[]) => void) => {
  //   const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  //   return onSnapshot(q, (snapshot) => {
  //     const data: ProjectData[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProjectData));
  //     callback(data);
  //   });
  // };
  
  