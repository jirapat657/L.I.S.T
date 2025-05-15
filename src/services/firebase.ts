import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const FirebaseApp = initializeApp(config)
const functions = getFunctions(FirebaseApp)
const auth = getAuth()
const db = getFirestore()
const storage = getStorage()

if (window.location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001)
  // connectAuthEmulator(auth, 'http://localhost:9099')
  // connectFirestoreEmulator(db, 'localhost', 8080)
  // connectStorageEmulator(storage, 'localhost', 9199)
}

export { auth, db, functions, storage }
