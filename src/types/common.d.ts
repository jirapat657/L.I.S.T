// src/types/common.d.ts
import { Timestamp } from 'firebase/firestore';

export type FirestoreDateInput = Timestamp | Date | { toDate: () => Date } | null | undefined;
