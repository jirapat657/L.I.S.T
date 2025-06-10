// src/utils/subtaskUtils.ts

import { Timestamp } from 'firebase/firestore';
import type { Subtask } from '@/types/issue';

export const duplicateSubtask = (subtask: Subtask): Subtask & { id: string } => {
  return {
    ...subtask,
    id: `${Date.now()}`, // หรือใช้ uuidv4() ก็ได้
    createdAt: Timestamp.now(),
  };
};
