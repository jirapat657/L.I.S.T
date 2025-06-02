import {
  type DocumentData,
  type WithFieldValue,
  type CollectionReference,
  collection,
  addDoc,
  type DocumentReference,
  type DocumentSnapshot,
  getDoc,
  doc,
  Timestamp,
  setDoc,
  query,
  QuerySnapshot,
  orderBy,
  getDocs,
  type OrderByDirection,
  FieldPath,
  updateDoc,
  WriteBatch,
  writeBatch,
  type WhereFilterOp,
  GeoPoint,
  Query,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'

export interface WhereCondition {
  field: string | FieldPath
  operator: WhereFilterOp
  value: string | number | boolean | Date | DocumentReference | GeoPoint | Array<string> | string[]
}

export interface TOrders {
  field: string | FieldPath
  direction: OrderByDirection
}

export const convertQueryData = (data: DocumentData) => {
  const result = { ...data }
  for (const key in result) {
    if (result[key] instanceof Timestamp && result[key] !== null) {
      result[key] = result[key].toDate()
    }
  }
  return result
}

const getAllDocuments = async <T>(
  collectionName: string,
  orders: TOrders
): Promise<{
  results: Partial<Array<T & { docId: string }>>
  total: number
}> => {
  const collectionRef: QuerySnapshot<DocumentData, DocumentData> = await getDocs(
    query(collection(db, collectionName), orderBy(orders.field, orders.direction))
  )
  const dataResult = await Promise.all(
    collectionRef.docs.map(async (doc) => {
      const getData = convertQueryData(doc.data())
      return { ...getData, docId: doc.id }
    })
  )
  return {
    results: dataResult as Array<T & { docId: string }>,
    total: dataResult.length,
  }
}

const getDocumentByDocId = async <T>(
  collectionName: string,
  docId: string
): Promise<Partial<T & { docId: string }>> => {
  const docRef = doc(db, collectionName, docId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error(`No document exists at ${docRef.path}`)
  }

  const getData = convertQueryData(docSnap.data())
  console.log('🧪 [getDocumentByDocId] getData:', getData) // 👈 DEBUG สำคัญที่สุด

  return { ...getData, docId: docSnap.id } as Partial<T & { docId: string }>
}


const createDocument = async (
  collectionName: string,
  data: WithFieldValue<DocumentData>
): Promise<DocumentReference<DocumentData, DocumentData>> => {
  try {
    const user = getAuth().currentUser

    const collectionRef: CollectionReference<DocumentData> = collection(db, collectionName)

    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: new Date(),
      createdBy: {
        uid: user?.uid,
        fullName: user?.email,
      },
    })

    return docRef
  } catch (error) {
    console.error('Error saving document:', error)
    throw error
  }
}

const updateDocumentByDocId = async (
  collectionName: string,
  docId: string,
  data: WithFieldValue<DocumentData>
): Promise<void> => {
  const collectionRef: DocumentReference<DocumentData> = doc(db, collectionName, docId)
  const user = getAuth().currentUser

  delete data?.docId
  delete data?.createdAt
  delete data?.createdBy

  return await updateDoc(collectionRef, {
    ...data,
    updatedAt: new Date(),
    updatedBy: {
      uid: user?.uid,
      fullName: user?.email,
    },
  }).catch((error) => {
    throw error
  })
}

const createUser = async (data: WithFieldValue<DocumentData>) => {
  const auth = getAuth()
  const user = auth.currentUser

  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)

  const newUser = userCredential.user

  await setDoc(doc(db, 'UserSetting', newUser?.uid), {
    email: data.email,
    permission: data.permission,
    active: data.active,
    createdAt: new Date(),
    createdBy: {
      uid: user?.uid,
      fullName: user?.email,
    },
  })

  return newUser
}

const bulkCreateDocument = async (
  collectionName: string,
  data: Array<WithFieldValue<DocumentData>>
): Promise<{ total: number; results: Array<string> }> => {
  const collectionRef = collection(db, collectionName)

  const chunkArray: Array<Array<WithFieldValue<DocumentData>>> = Array.from(
    { length: Math.ceil(data.length / 500) },
    (_v, i) => data.slice(i * 500, i * 500 + 500)
  )
  const list = []

  const countArray: Array<number> = []
  for (const docChunk of chunkArray) {
    const batch: WriteBatch = writeBatch(db)
    const user = getAuth().currentUser
    for (const docData of docChunk) {
      const getDocumentReference = doc(collectionRef)
      list.push(getDocumentReference.id)
      batch.set(getDocumentReference, {
        ...docData,
        createdAt: new Date(),
        createdBy: {
          uid: user?.uid,
          fullName: user?.email,
        },
      })
    }
    await batch.commit().then(() => {
      countArray.push(docChunk.length)
    })
  }

  return { total: countArray.reduce((a, b) => a + b, 0), results: list || [] }
}

const getDocumentWheres = <T>(
  collectionName: string,
  queryConditions: Array<WhereCondition | TOrders>,
  orders: TOrders
): Promise<{ results: Array<Partial<T>>; total: number }> => {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const collectionRef = collection(db, collectionName)
        const queryRef: Query<DocumentData> = query(
          collectionRef,
          ...queryConditions.map((q) => {
            if ((q as WhereCondition).operator !== undefined) {
              return where(
                (q as WhereCondition).field,
                (q as WhereCondition).operator,
                (q as WhereCondition).value
              )
            } else {
              return orderBy((q as TOrders).field, (q as TOrders).direction)
            }
          }),
          orderBy(orders.field, orders.direction)
        )
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(queryRef)
        const dataResult = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = convertQueryData(doc.data())
            return {
              ...data,
              docId: doc.id,
            }
          })
        )
        resolve({
          results: dataResult as Array<T & { docId: string }>,
          total: dataResult.length,
        })
      } catch (error) {
        reject(error)
        throw error
      }
    })()
  })
}

const bulkUpdateDocument = async (
  collectionName: string,
  data: Array<WithFieldValue<DocumentData> & { docId: string }>
): Promise<{ total: number; results: Array<string> }> => {
  const collectionRef = collection(db, collectionName)

  const chunkArray: Array<Array<WithFieldValue<DocumentData>>> = Array.from(
    { length: Math.ceil(data.length / 500) },
    (_v, i) => data.slice(i * 500, i * 500 + 500)
  )

  const list = []

  const countArray: Array<number> = []
  for (const docChunk of chunkArray) {
    const batch: WriteBatch = writeBatch(db)
    const user = getAuth().currentUser
    for (const docData of docChunk) {
      const documentIdData = docData?.docId
      delete docData?.docId
      list.push(documentIdData)
      batch.set(
        doc(collectionRef, documentIdData),
        {
          ...docData,
          updatedAt: new Date(),
          updatedBy: {
            uid: user?.uid,
            fullName: user?.email,
          },
        },
        { merge: true }
      )
    }
    await batch.commit().then(() => {
      countArray.push(docChunk.length)
    })
  }

  return { total: countArray.reduce((a, b) => a + b, 0), results: list || [] }
}

export {
  createDocument,
  getDocumentByDocId,
  createUser,
  getAllDocuments,
  updateDocumentByDocId,
  bulkCreateDocument,
  getDocumentWheres,
  bulkUpdateDocument,
}
