// src/api/user.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
  } from 'firebase/firestore';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { db, auth } from '@/services/firebase';
  
  export interface UserFormValues {
    userId: string;
    userName: string;
    email: string;
    password: string;
    role: string;
    createdAt: Timestamp;
    status: 'Active' | 'Inactive';
  }
  
  export interface UserData extends Omit<UserFormValues, 'password'> {
    id: string;
  }
  
  export const createUser = async (data: UserFormValues) => {
    await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...userData } = data;
    const docRef = await addDoc(collection(db, 'lucasUsers'), userData);
    return docRef.id;
  };
  
  export const updateUser = async (
    id: string,
    values: Partial<Omit<UserFormValues, 'userId' | 'createdAt' | 'status'>>
  ) => {
    const docRef = doc(db, 'lucasUsers', id);
    await updateDoc(docRef, values);
  };
  
  export const updateUserStatus = async (id: string, status: 'Active' | 'Inactive') => {
    const docRef = doc(db, 'lucasUsers', id);
    await updateDoc(docRef, { status });
  };
  
  export const deleteUser = async (id: string) => {
    const docRef = doc(db, 'lucasUsers', id);
    await deleteDoc(docRef);
  };
  
  export const listenToUsers = (callback: (users: UserData[]) => void) => {
    const q = query(collection(db, 'lucasUsers'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as UserData)
      );
      callback(users);
    });
  };
  