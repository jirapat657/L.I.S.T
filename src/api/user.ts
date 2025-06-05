// src/api/user.ts
import {
    collection,
    deleteDoc,
    doc,
    query,
    updateDoc,
    getDocs,
    setDoc,
    where
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

    // 🔍 ตรวจสอบว่า userId ซ้ำหรือไม่
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', data.userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error(`User ID "${data.userId}" is already in use.`);
    }

    // ✅ สร้างผู้ใช้ใน Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCredential.user.uid;

    // 🔐 ลบ password ออกก่อนบันทึกลง Firestore (ห้ามเก็บ password ใน Firestore เด็ดขาด)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = data;

    // ✅ ใช้ setDoc เพื่อให้ UID เป็น docId
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, userData);

    return uid;
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
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((doc) => ({
      id: doc.id, // ✅ ยังใช้ doc.id ได้ (คือ userId)
      ...(doc.data() as Omit<UserData, 'id'>),
    }));
  };

  export const getUserByEmail = async (email: string): Promise<UserData | null> => {
    const q = query(collection(db, COLLECTION_NAME), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...(docSnap.data() as Omit<UserData, 'id'>),
    };
  };
