// src/types/users.d.ts
import { Timestamp } from 'firebase/firestore';

export interface UserFormValues {
  userId: string;
  userName: string;
  email: string;
  password?: string;
  role: string;
  jobPosition: string;
  createdAt: Timestamp;
  status: 'Active' | 'Inactive';
}

export interface UserData extends Omit<UserFormValues, 'password'> {
  id: string;
  username: string;
  email: string;
  role: string;
}
