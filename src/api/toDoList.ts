// src/api/toDoList.ts

import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import type { ToDoItem, AddToDoParams, UpdateToDoParams } from "@/types/toDoList";

// ฟังก์ชันเดิม แต่ปรับ return type ให้ชัดเจนยิ่งขึ้น
export async function getToDoList(): Promise<ToDoItem[]> {
  const q = query(collection(db, "toDoList"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ToDoItem[];
}

// ระบุ parameter type เป็น AddToDoParams
export async function addToDo(item: AddToDoParams): Promise<string> {
  const docRef = await addDoc(collection(db, "toDoList"), {
    ...item,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id; // ส่งกลับเฉพาะ ID ก็เพียงพอ
}

// ใช้ UpdateToDoParams และเพิ่ม updatedAt
export async function updateToDo(params: UpdateToDoParams): Promise<void> {
  const { id, ...updates } = params; // Destructure params ที่รับเข้ามา
  await updateDoc(doc(db, "toDoList", id), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// src/api/toDoList.ts
export async function deleteToDo(id: string): Promise<void> {
  console.log("Firestore: Try to delete", id);
  await deleteDoc(doc(db, "toDoList", id));
}
