// src/seedFirestoreEmulator.ts
import "dotenv/config";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  setDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
} from "firebase/auth";

// Debug: ดูว่าอ่าน ENV ได้จริงไหม
console.log('API_KEY:', process.env.VITE_FIREBASE_API_KEY);

// --- config ---
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

connectFirestoreEmulator(db, "localhost", 8080);
connectAuthEmulator(auth, "http://localhost:9099");
console.log("[Emulator] Firestore + Auth connected!");

async function seedLIMUsers() {
  const email = "adminj@demo.com";
  const password = "11223344";
  const userName = "adminJ";
  const jobPosition = "Developer";
  const role = "Admin";
  const status = "Active";
  const userId = "LC-000001";

  // ลองสร้าง user (จะ error ถ้าซ้ำ)
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("Error creating user:", err.message);
  } else {
    console.error("Unknown error:", err);
  }
  process.exit(1);
}

  const { user } = userCredential;
  const createdAt = new Date(user.metadata.creationTime!);

  await setDoc(doc(db, "LIMUsers", user.uid), {
    email,
    userName,
    jobPosition,
    role,
    status,
    userId,
    createdAt: Timestamp.fromDate(createdAt),
  });

  console.log("✅ Seeded user & document to Emulator!", user.uid);
}

seedLIMUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
