// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// กำหนดค่า Firebase จาก environment variables (VITE_)
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// เริ่มต้น Firebase App
const FirebaseApp = initializeApp(config);

// Firebase services
const auth = getAuth(FirebaseApp);
const db = getFirestore(FirebaseApp);
const functions = getFunctions(FirebaseApp);
const storage = getStorage(FirebaseApp);

// เชื่อมต่อกับ Emulator เมื่อทำงานใน localhost
if (window.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
}
// เมื่อทำการ deploy ไปยัง production จะใช้ Firebase production services โดยอัตโนมัติ

export { FirebaseApp, auth, db, functions, storage };
