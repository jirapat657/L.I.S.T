import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, Timestamp, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { ScopeData, ScopePayload } from '@/types/scopeOfWork';

const COLLECTION_NAME = 'LIMScopeOfWork';

export const addScope = async (data: ScopeData) => {
  const payload = {
    ...data,
    docDate: data.docDate ? Timestamp.fromDate(data.docDate.toDate()) : null,
    createdAt: Timestamp.now(),
  };
  return await addDoc(collection(db, COLLECTION_NAME), payload);
};

export const getAllScopes = async (): Promise<ScopeData[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        docNo: data.docNo || '',
        docDate: data.docDate || null,
        docType: data.docType || '',
        project: data.project || '',
        customer: data.customer || '',
        description: data.description || '',
        remark: data.remark || '',
        files: data.files || [],
        createdAt: data.createdAt || Timestamp.now(),
    };
    });
}

export const deleteScopeById = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const updateScopeById = async (id: string, data: Partial<ScopeData>) => {
  const payload = {
    ...data,
    docDate: data.docDate ? Timestamp.fromDate(data.docDate.toDate()) : null,
    updatedAt: Timestamp.now(),
  };

  console.log('📤 Payload to Firestore:', payload);
    console.log('🟢 Updating ID:', id);

  return await setDoc(doc(db, COLLECTION_NAME, id), payload, { merge: true });
};

export const createScope = async (data: ScopePayload) => {
  return await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: Timestamp.now(),
  });
};
