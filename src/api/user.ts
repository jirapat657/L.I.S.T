// src/api/user.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    query,
    updateDoc,
    getDocs
  } from 'firebase/firestore';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { db, auth } from '@/services/firebase';
  import type { UserFormValues, UserData } from '@/types/users';
  
  
  const COLLECTION_NAME = 'LIMUsers';
  
  export const getAllUsers = async (): Promise<{ id: string; userName: string }[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userName: data.userName || '', // ตรวจสอบว่ามีฟิลด์ userName หรือไม่
      };
    });
  };  
  
  export const createUser = async (data: UserFormValues) => {
    if (!data.password) {
      throw new Error("Password is required");
    }
    await createUserWithEmailAndPassword(auth, data.email, data.password);
    delete data.password;
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    return docRef.id;
  };
  
  export const updateUser = async (
    id: string,
    values: Partial<Omit<UserFormValues, 'userId' | 'createdAt' | 'status'>>
  ) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, values);
  };
  
  export const updateUserStatus = async (id: string, status: 'Active' | 'Inactive') => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status });
  };
  
  export const deleteUser = async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  };
  
  export const getUsers = async (): Promise<UserData[]> => {
  const snapshot = await getDocs(query(collection(db, 'LIMUsers')))
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserData[]
}
