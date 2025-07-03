//  src/types/toDoList.d.ts
import { Timestamp } from "firebase/firestore";

export interface ToDoItem {
  id?: string;
  text: string;
  completed: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp; // เพิ่ม field นี้เพื่อจัดการอัปเดตเวลา
}

// เพิ่ม type สำหรับ mutation parameters (optional)
export type AddToDoParams = Omit<ToDoItem, 'id' | 'createdAt' | 'updatedAt'>;
// แยก type สำหรับการอัปเดตให้ชัดเจน
export type UpdateToDoParams = {
  id: string; // จำเป็นต้องมี
} & Partial<Omit<ToDoItem, 'id'>>; // ส่วนอื่นๆ เป็น optional