// src/api/toDoList.ts
import { db } from "@/services/firebase";
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc, doc,
  query, orderBy, serverTimestamp
} from "firebase/firestore";
import type { ToDoItem, AddToDoParams, UpdateToDoParams } from "@/types/toDoList";

const COLLECTION_NAME = 'LIMToDoList';

const userTodosCol = (uid: string) => collection(db, 'LIMUsers', uid, COLLECTION_NAME);
const userTodoDoc = (uid: string, id: string) => doc(db, 'LIMUsers', uid, COLLECTION_NAME, id);

export async function getToDoList(uid: string): Promise<ToDoItem[]> {
  const q = query(userTodosCol(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ToDoItem));
}

export async function addToDo(uid: string, item: AddToDoParams): Promise<string> {
  const docRef = await addDoc(userTodosCol(uid), {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateToDo(uid: string, params: UpdateToDoParams): Promise<void> {
  const { id, ...updates } = params;
  await updateDoc(userTodoDoc(uid, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteToDo(uid: string, id: string): Promise<void> {
  await deleteDoc(userTodoDoc(uid, id));
}
